import { UI } from '../UI.ts'

import BoneWeightsByDistance from '../solvers/BoneWeightsByDistance.ts'
import BoneWeightsByDistanceChild from '../solvers/BoneWeightsByDistanceChild.ts'
import SolverDistanceChildTargeting from '../solvers/SolverDistanceChildTargeting.ts'

import { SkinningFormula } from '../enums/SkinningFormula.ts'

import { Generators } from '../Generators.ts'

import { type BufferGeometry, type Material, type Object3D, type Skeleton, SkinnedMesh, type Scene, Group, Uint16BufferAttribute, Float32BufferAttribute } from 'three'
import BoneTesterData from '../models/BoneTesterData.ts'
import { type SkeletonType } from '../enums/SkeletonType.ts'

import { type AbstractAutoSkinSolver } from '../solvers/AbstractAutoSkinSolver.ts'

// Note: EventTarget is a built-ininterface and do not need to import it
export class StepWeightSkin extends EventTarget {
  private readonly ui: UI = new UI()
  private skinning_armature: Object3D | undefined
  private bone_skinning_formula: AbstractAutoSkinSolver | undefined
  private binding_skeleton: Skeleton | undefined
  private skinned_meshes: SkinnedMesh[] = []

  // stores the geometry data for meshes we will skin
  private all_mesh_geometry: BufferGeometry[] = []
  private all_mesh_materials: Material[] = []

  // weight painted mesh actually has multiple meshes that will go in a group
  private readonly weight_painted_mesh_preview: Group = new Group()

  // debug options for bone skinning formula
  private show_debug: boolean = false
  private debug_scene_object: Object3D | undefined
  private bone_index_to_test: number = -1

  constructor () {
    super()
    this.weight_painted_mesh_preview.name = 'Weight Painted Mesh Preview'

    // helps skeleton mesh render on top of this
    this.weight_painted_mesh_preview.renderOrder = -1
  }

  public begin (): void { }

  public create_bone_formula_object (editable_armature: Object3D, skinning_formula: string, skeleton_type: SkeletonType): AbstractAutoSkinSolver | null {
    this.skinning_armature = editable_armature.clone()
    this.skinning_armature.name = 'Armature for skinning'

    // Swap out formulas to see different results
    if (skinning_formula === SkinningFormula.Distance) {
      this.bone_skinning_formula = new BoneWeightsByDistance(this.skinning_armature.children[0], skeleton_type)
    }

    if (skinning_formula === SkinningFormula.DistanceChild) {
      this.bone_skinning_formula = new BoneWeightsByDistanceChild(this.skinning_armature.children[0], skeleton_type)
    }

    if (skinning_formula === SkinningFormula.DistanceChildTargeting) {
      this.bone_skinning_formula = new SolverDistanceChildTargeting(this.skinning_armature.children[0], skeleton_type)
    }

    return this.bone_skinning_formula ?? null
  }

  public skeleton (): Skeleton | undefined {
    // gets bone hierarchy from the armature
    return this.binding_skeleton
  }

  /**
   * @param geometry Add in all mesh geometry data to be skinned.
   */
  public add_to_geometry_data_to_skin (geometry: BufferGeometry): void {
    // add name to the geometry
    geometry.name = 'Mesh ' + this.all_mesh_geometry.length
    this.all_mesh_geometry.push(geometry)
  }

  public get_geometry_data_to_skin (): BufferGeometry[] {
    return this.all_mesh_geometry
  }

  // This can happen multiple times, so we need a better way to handle this to store all geometries
  // this will be useful when creating the weight painted mesh and that generation being done
  public set_mesh_geometry (geometry: BufferGeometry): void {
    if (this.bone_skinning_formula === undefined) {
      console.warn('Tried to set_mesh_geometry() in weight skinning step, but bone_skinning_formula is undefined!')
      return
    }

    this.bone_skinning_formula.set_geometry(geometry)
  }

  public test_geometry (): BoneTesterData {
    if (this.bone_skinning_formula === undefined) {
      console.warn('Tried to test_geometry() in weight skinning step, but bone_skinning_formula is undefined!')
      return new BoneTesterData([], [])
    }

    if (this.show_debug) {
      this.bone_skinning_formula.set_show_debug(this.show_debug)
      this.bone_skinning_formula.set_debugging_scene_object(this.debug_scene_object)
      this.bone_skinning_formula.set_bone_index_to_test(this.bone_index_to_test)
    }

    return this.bone_skinning_formula.test_bones_outside_in_mesh()
  }

  public create_binding_skeleton (): void {
    if (this.skinning_armature === undefined) {
      console.warn('Tried to create_binding_skeleton() but skinning_armature has no children!')
      return
    }

    // when we copy over the armature with the bind, we will lose the reference in the variable
    this.binding_skeleton = Generators.create_skeleton(this.skinning_armature.children[0])
    this.binding_skeleton.name = 'Mesh Binding Skeleton'
  }

  /**
   * We might need to do the skinnning process multiple times
   * so we need to clear out the data from the previous
   * skinned mesh process
   */
  public reset_all_skin_process_data (): void {
    this.skinned_meshes = []
    this.all_mesh_materials = []
    this.all_mesh_geometry = []
    this.weight_painted_mesh_preview.clear()
  }

  public add_mesh_material (material: Material): void {
    this.all_mesh_materials.push(material)
  }

  public create_skinned_mesh (geometry: BufferGeometry, material: Material): SkinnedMesh {
    if (this.binding_skeleton === undefined) {
      console.warn('Tried to create_skinned_mesh() but binding_skeleton is undefined!')
      return
    }

    // create skinned mesh
    const skinned_mesh: SkinnedMesh = new SkinnedMesh(geometry, material)
    skinned_mesh.name = 'Skinned Mesh'
    skinned_mesh.castShadow = true // skinned mesh won't update right if this is false

    // do the binding for the mesh to the skelleton
    skinned_mesh.add(this.binding_skeleton.bones[0])
    skinned_mesh.bind(this.binding_skeleton)

    return skinned_mesh
  }

  public final_skinned_meshes (): SkinnedMesh[] {
    return this.skinned_meshes
  }

  public weight_painted_mesh_group (): Group {
    return this.weight_painted_mesh_preview
  }

  public set_show_debug (value: boolean): void {
    this.show_debug = value
  }

  public set_debug_scene_object (scene: Object3D): void {
    this.debug_scene_object = scene
  }

  public set_bone_index_to_test (index: number): void {
    this.bone_index_to_test = index
  }

  public calculate_weights (): number[][] {
    if (this.bone_skinning_formula === undefined) {
      console.warn('Tried to calculate_weights() but bone_skinning_formula is null for some reason!')
      return [[], []]
    }

    const indices_and_weights: number[][] = this.bone_skinning_formula.calculate_indexes_and_weights()
    return indices_and_weights
  }

  public calculate_weights_for_all_mesh_data (regenerate_weight_painted_mesh: boolean = false): void {
    if (this.all_mesh_geometry.length === 0) {
      console.warn('Tried to calculate_weights_for_all_mesh_data() but all_mesh_geometry is empty!')
      return
    }

    if (this.bone_skinning_formula === undefined) {
      console.warn('Tried to calculate_weights_for_all_mesh_data() but bone_skinning_formula is null for some reason!')
      return
    }

    // loop through each mesh geometry and calculate the weights
    this.all_mesh_geometry.forEach((geometry_data: BufferGeometry, idx: number) => {
      this.bone_skinning_formula?.set_geometry(geometry_data)
      const [final_skin_indices, final_skin_weights]: number[][] = this.calculate_weights()

      geometry_data.setAttribute('skinIndex', new Uint16BufferAttribute(final_skin_indices, 4))
      geometry_data.setAttribute('skinWeight', new Float32BufferAttribute(final_skin_weights, 4))

      const associated_material: Material = this.all_mesh_materials[idx]

      // create skined mesh from the geometry and material
      const temp_skinned_mesh: SkinnedMesh = this.create_skinned_mesh(geometry_data, associated_material)
      this.skinned_meshes.push(temp_skinned_mesh) // add to skinned meshes references

      // re-generate the weight painted mesh display if needed
      if (regenerate_weight_painted_mesh) {
        const weight_painted_mesh = Generators.create_weight_painted_mesh(final_skin_indices, geometry_data)
        const wireframe_mesh = Generators.create_wireframe_mesh_from_geometry(geometry_data)
        this.weight_painted_mesh_preview?.add(weight_painted_mesh, wireframe_mesh)
      }
    })

    console.log('Final skinned meshes:', this.skinned_meshes)
    console.log('Preview weight painted mesh re-generated:', this.weight_painted_mesh_preview)
  }
}
