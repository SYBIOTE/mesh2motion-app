/* eslint-disable @typescript-eslint/naming-convention */
import { UI } from '../UI.ts'
import { type VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import {
  type BufferGeometry,
  type Material,
  type Object3D,
  type SkinnedMesh,
  Box3,
  Scene,
  Mesh,
  MeshNormalMaterial,
  FrontSide,
  MathUtils
} from 'three'
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

export class StepLoadModel extends EventTarget {
  private readonly gltf_loader = new GLTFLoader()
  private readonly vrm_loader = new GLTFLoader().register((parser) => new VRMLoaderPlugin(parser))
  private readonly fbx_loader = new FBXLoader()
  private readonly ui: UI = new UI()
  private original_model_data: Scene = new Scene()
  private final_mesh_data: Scene = new Scene()
  private debug_model_loading: boolean = false
  private is_vrm_model: boolean = false
  private vrm_instance: VRM | null = null
  private vrm_source_data_url: string | null = null
  private original_uploaded_filename: string | null = null

  // there can be multiple objects in a model, so store them in a list
  private readonly geometry_list: BufferGeometry[] = []
  private readonly material_list: Material[] = []

  private _added_event_listeners: boolean = false

  // for debugging, let's count these to help us test performance things better
  vertex_count = 0
  triangle_count = 0
  objects_count = 0

  // function that goes through all our geometry data and calculates how many triangles we have
  private calculate_mesh_metrics (): void {
    let triangle_count = 0
    let vertex_count = 0

    // calculate all the loaded mesh data
    this.models_geometry_list().forEach((geometry) => {
      triangle_count += geometry.attributes.position.count / 3
      vertex_count += geometry.attributes.position.count
    })

    this.triangle_count = triangle_count
    this.vertex_count = vertex_count
    this.objects_count = this.models_geometry_list().length
  }

  private calculate_geometry_list (): void {
    if (this.final_mesh_data === undefined) {
      console.error('original model not loaded yet. Cannot do calculations')
    }

    // clear geometry and material list in case we run this again
    // this empties the array in place, and doesn't need to create a new array
    this.geometry_list.length = 0
    this.material_list.length = 0

    this.final_mesh_data.traverse((child: Object3D) => {
      if (child.type === 'Mesh') {
        const geometry_to_add: BufferGeometry = (child as Mesh).geometry.clone()
        geometry_to_add.name = child.name
        this.geometry_list.push(geometry_to_add)

        // Handle materials that may be arrays or custom VRM materials without clone()
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const childMaterial: any = (child as Mesh).material as unknown
        let material_to_store: Material
        if (Array.isArray(childMaterial)) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const firstMat: any = childMaterial[0]
          if (firstMat != null && typeof firstMat.clone === 'function') {
            material_to_store = firstMat.clone()
          } else {
            material_to_store = firstMat as Material
          }
        } else {
          if (childMaterial != null && typeof childMaterial.clone === 'function') {
            material_to_store = childMaterial.clone()
          } else {
            material_to_store = childMaterial as Material
          }
        }
        this.material_list.push(material_to_store)
      }
    })

    // debugging type data
    this.calculate_mesh_metrics()
    console.log(`Vertex count:${this.vertex_count}    Triangle Count:${this.triangle_count}     Object Count:${this.objects_count} `)
  }

  public begin (): void {
    if (this.ui.dom_current_step_index !== null) {
      this.ui.dom_current_step_index.innerHTML = '1'
    }

    if (this.ui.dom_current_step_element !== null) {
      this.ui.dom_current_step_element.innerHTML = 'Load Model'
    }

    if (this.ui.dom_load_model_tools !== null) {
      this.ui.dom_load_model_tools.style.display = 'flex'
    }

    // if we are navigating back to this step, we don't want to add the event listeners again
    if (!this._added_event_listeners) {
      this.add_event_listeners()
      this._added_event_listeners = true
    }
  }

  public add_event_listeners (): void {
    if (this.ui.dom_upload_model_button !== null) {
      this.ui.dom_upload_model_button.addEventListener('change', (event: Event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0]
        if (file == null) { return }
        this.original_uploaded_filename = file.name
        const file_extension: string = this.get_file_extension(file.name)

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          console.log('File reader loaded', reader)
          if (reader.result == null) { return }
          this.load_model_file(reader.result as string, file_extension)
        }
      })
    }

    if (this.ui.dom_load_model_debug_checkbox !== null) {
      this.ui.dom_load_model_debug_checkbox.addEventListener('change', (event: Event) => {
        const debug_mode = (event.target as HTMLInputElement)?.checked
        if (debug_mode == null) { return }
        this.debug_model_loading = debug_mode
      })
    }

    if (this.ui.dom_load_model_button !== null) {
      this.ui.dom_load_model_button.addEventListener('click', () => {
        // get currently selected option out of the model-selection drop-down as HTMLSelectElement | null
        const model_selection = document.querySelector('#model-selection')

        if (model_selection !== null) {
          const file_name = (model_selection as HTMLSelectElement).options[(model_selection as HTMLSelectElement).selectedIndex].value
          const file_extension: string = this.get_file_extension(file_name)
          this.load_model_file(file_name, file_extension)
        }
      })
    }
  }

  private get_file_extension (file_path: string): string {
    const file_name: string | undefined = file_path.split('/').pop() // remove the directory path

    if (file_name === undefined) {
      console.error('Critical Error: Undefined file extension when loading model')
      return 'UNDEFINED'
    }

    const file_extension: string | undefined = file_name?.split('.').pop() // just get last part of the file name

    if (file_extension === undefined) {
      console.error('Critical Error: File does not have a "." symbol in the name')
      return 'UNDEFINED'
    }

    return file_extension
  }

  private load_model_file (model_file_path: string, file_extension: string): void {
    if (file_extension === 'fbx') {
      console.log('Loading FBX model:', model_file_path)
      this.fbx_loader.load(model_file_path, (fbx) => {
        const loaded_scene: Scene = new Scene()
        loaded_scene.add(fbx)
        this.process_loaded_scene(loaded_scene)
      })
    } else if (file_extension === 'gltf' || file_extension === 'glb') {
      this.gltf_loader.load(model_file_path, (gltf) => {
        const loaded_scene: Scene = gltf.scene as unknown as Scene
        this.process_loaded_scene(loaded_scene)
      })
    } else if (file_extension === 'vrm') {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      this.vrm_loader.load(model_file_path, (gltf: GLTF) => {
        try {
          // Detect VRM 0.x via GLTF extension name and rotate using official utility
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const json = gltf?.parser?.json ?? {}
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const isVRM0: boolean = json?.extensions?.VRM != null
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const vrm = gltf?.userData?.vrm
          if (isVRM0 && vrm != null) {
            // Rotate VRM0 models by 180 degrees on Y to match expected forward axis
            // eslint-disable-next-line @typescript-eslint/naming-convention
            VRMUtils.rotateVRM0(vrm as VRM)
            vrm.scene.updateWorldMatrix(true, true)
          }
          this.is_vrm_model = true
          this.vrm_instance = (vrm as VRM) ?? null
          if (typeof model_file_path === 'string' && model_file_path.startsWith('data:')) {
            this.vrm_source_data_url = model_file_path
          }
        } catch (err) {
          console.warn('VRM post-processing encountered an issue:', err)
        }

        const loaded_scene: Scene = gltf.scene as unknown as Scene
        this.process_loaded_scene(loaded_scene)
      })
    } else {
      console.error('Unsupported file format to load. Only acccepts FBX, GLTF, GLB, VRM:', model_file_path)
    }
  }

  private process_loaded_scene (loaded_scene: Scene): void {
    // VRM models need to preserve transform changes (including VRM0 rotation),
    // so skip stripping and rotation reset for VRM to keep orientation.

    this.original_model_data = loaded_scene.clone()
    this.original_model_data.name = 'Cloned Scene'

    this.original_model_data.traverse((child) => {
      child.castShadow = true
    })

    // strip out stuff that we are not bringing into the model step
    const clean_scene_with_only_models = this.strip_out_all_unecessary_model_data(this.original_model_data)

    // Some objects come in very large, which makes it harder to work with
    // scale everything down to a max height
    this.scale_model_on_import_if_extreme(clean_scene_with_only_models)

    // loop through each child in scene and reset rotation
    // if we don't the skinning process doesn't take rotation into account
    // and creates odd results
    clean_scene_with_only_models.traverse((child) => {
      child.rotation.set(0, 0, 0)
    })

    console.log('Model loaded', clean_scene_with_only_models)

    // assign the final cleaned up model to the original model data
    this.final_mesh_data = clean_scene_with_only_models

    this.calculate_geometry_list()

    this.dispatchEvent(new CustomEvent('modelLoaded'))
  }

  private strip_out_all_unecessary_model_data (model_data: Scene): Scene {
    // create a new scene object, and only include meshes
    const new_scene = new Scene()
    new_scene.name = 'Imported Model'

    model_data.traverse((child) => {
      let new_mesh: Mesh | undefined

      // if the schild is a skinned mesh, create a new mesh object and apply the geometry and material
      if (child.type === 'SkinnedMesh') {
        new_mesh = new Mesh((child as SkinnedMesh).geometry, (child as SkinnedMesh).material)
        new_mesh.name = child.name
        new_scene.add(new_mesh)
      } else if (child.type === 'Mesh') {
        new_mesh = (child as Mesh).clone()
        new_mesh.name = child.name
        new_scene.add(new_mesh)
      }

      // potentially use normal material to help debugging models that look odd
      // some materials have some odd transparency or back-face things that make it look odd
      let material_to_use: MeshNormalMaterial
      if (this.debug_model_loading && new_mesh != null) {
        material_to_use = new MeshNormalMaterial()
        material_to_use.side = FrontSide
        new_mesh.material = material_to_use
      }
    })

    return new_scene
  }

  private scale_model_on_import_if_extreme (scene_object: Scene): void {
    let scale_factor: number = 1.0

    // calculate all the meshes to find out the max height
    const bounding_box = this.calculate_bounding_box(scene_object)
    const height = bounding_box.max.y - bounding_box.min.y

    // if model is very large, or very small, scale it to 1.0 to help with application
    if (height > 0.1 && height < 4) {
      console.log('Model a reasonable size, so no scaling applied: ', height, ' height')
      return
    } else {
      console.log('Model is very large or small, so scaling applied: ', height, ' height')
    }

    scale_factor = 1.0 / height // goal is to scale the model to 1.0 height

    // scale all the meshes down by the calculated amount
    scene_object.traverse((child) => {
      if (child.type === 'Mesh') {
        (child as Mesh).geometry.scale(scale_factor, scale_factor, scale_factor)
      }
    })
  }

  private calculate_bounding_box (scene_object: Scene): Box3 {
    // calculate all the meshes to find out the max height
    let found_mesh: boolean = false
    let bounding_box: Box3 = new Box3()

    scene_object.traverse((child: Object3D) => {
      if (child.type === 'Mesh' && !found_mesh) {
        found_mesh = true
        bounding_box = new Box3().setFromObject(child.parent as Object3D)
      }
    })

    return bounding_box
  }

  public is_vrm_loaded (): boolean {
    return this.is_vrm_model
  }

  public get_vrm_source_data_url (): string | null {
    return this.vrm_source_data_url
  }

  public get_original_uploaded_filename (): string | null {
    return this.original_uploaded_filename
  }

  public get_vrm_instance (): VRM | null {
    return this.vrm_instance
  }

  public model_meshes (): Scene {
    if (this.final_mesh_data !== undefined) {
      return this.final_mesh_data
    }

    // create a new scene object, and only include meshes
    const new_scene = new Scene()
    new_scene.name = 'Model data'

    // do a for loop to add all the meshes to the scene from the geometry and material list
    for (let i = 0; i < this.geometry_list.length; i++) {
      const mesh = new Mesh(this.geometry_list[i], this.material_list[i])
      new_scene.add(mesh)
    }

    this.final_mesh_data = new_scene

    return this.final_mesh_data
  }

  public models_geometry_list (): BufferGeometry[] {
    // loop through final mesh data and return the geometeries
    const geometries_to_return: BufferGeometry[] = []
    this.final_mesh_data.traverse((child) => {
      if (child.type === 'Mesh') {
        geometries_to_return.push((child as Mesh).geometry.clone())
      }
    })

    return geometries_to_return
  }

  public models_material_list (): Material[] {
    return this.material_list
  }

  /**
   * Rotate all geometry data in the model by the given angle (in degrees) around the specified axis.
   * This directly modifies the geometry vertices.
   */
  public rotate_model_geometry (axis: 'x' | 'y' | 'z', angle: number): void {
    const radians = MathUtils.degToRad(angle)
    this.final_mesh_data.traverse((obj: Object3D) => {
      if (obj.type === 'Mesh') {
        const mesh = obj as Mesh
        mesh.geometry.rotateX(axis === 'x' ? radians : 0)
        mesh.geometry.rotateY(axis === 'y' ? radians : 0)
        mesh.geometry.rotateZ(axis === 'z' ? radians : 0)
        mesh.geometry.computeBoundingBox()
        mesh.geometry.computeBoundingSphere()
      }
    })
  }

  public move_model_to_floor (): void {
    // go through all the meshes and find out the lowest point
    // to use later. A model could contain multiple meshes
    // and we want to make sure the offset is the same between all of them
    let final_lowest_point: number = 0
    this.final_mesh_data.traverse((obj: Object3D) => {
      // if object is a mesh, rotate the geometry data
      if (obj.type === 'Mesh') {
        const mesh_obj: Mesh = obj as Mesh
        const bounding_box = new Box3().setFromObject(mesh_obj)

        if (bounding_box.min.y < final_lowest_point) {
          final_lowest_point = bounding_box.min.y
        }
      }
    })

    // move all the meshes to the floor by the amount we calculated above
    this.final_mesh_data.traverse((obj: Object3D) => {
      // if object is a mesh, rotate the geometry data
      if (obj.type === 'Mesh') {
        const mesh_obj: Mesh = obj as Mesh

        // this actually updates the geometry, so the origin will still be at 0,0,0
        // maybe need to recompute the bounding box and sphere internally after translate
        const offset = final_lowest_point * -1
        mesh_obj.geometry.translate(0, offset, 0)
        mesh_obj.geometry.computeBoundingBox()
        mesh_obj.geometry.computeBoundingSphere()
      }
    })
  }
}
