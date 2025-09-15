/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { CustomViewHelper } from './lib/CustomViewHelper.ts'

import { Utility } from './lib/Utilities.ts'
import { Generators } from './lib/Generators.ts'

import { UI } from './lib/UI.ts'

import { StepLoadModel } from './lib/processes/StepLoadModel.ts'
import { StepLoadSkeleton } from './lib/processes/StepLoadSkeleton.ts'
import { StepEditSkeleton } from './lib/processes/StepEditSkeleton.ts'
import { StepAnimationsListing } from './lib/processes/StepAnimationsListing.ts'
import { StepExportToFile } from './lib/processes/StepExportToFile.ts'
import { StepWeightSkin } from './lib/processes/StepWeightSkin.ts'

import { ProcessStep } from './lib/enums/ProcessStep.ts'
import { type Bone, Group, Scene, type Skeleton, type Vector3, type Object3D } from 'three'
import type BoneTesterData from './lib/models/BoneTesterData.ts'

import { build_version } from './environment.js'
import { SkeletonType } from './lib/enums/SkeletonType.ts'

import { CustomSkeletonHelper } from './lib/CustomSkeletonHelper.ts'
import { EventListeners } from './lib/EventListeners.ts'
import { ModelPreviewDisplay } from './lib/enums/ModelPreviewDisplay.ts'
import { TransformControlType } from './lib/enums/TransformControlType.ts'
import { ThemeManager } from './lib/ThemeManager.ts'
// import { AppRouter } from './lib/AppRouter' // Replaced with React Router
import { Animations } from './lib/Animations'

export class Bootstrap {
  public readonly camera = Generators.create_camera()
  public readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  public controls: OrbitControls | undefined = undefined

  public readonly transform_controls: TransformControls = new TransformControls(this.camera, this.renderer.domElement)
  public is_transform_controls_dragging: boolean = false
  public readonly transform_controls_hover_distance: number = 0.03

  public view_helper!: CustomViewHelper

  public readonly theme_manager = new ThemeManager()
  public readonly ui = new UI()
  public readonly load_model_step = new StepLoadModel()
  public readonly load_skeleton_step = new StepLoadSkeleton()
  public readonly edit_skeleton_step = new StepEditSkeleton()
  public readonly weight_skin_step = new StepWeightSkin()
  public readonly animations_listing_step = new StepAnimationsListing(this.theme_manager)
  public readonly file_export_step = new StepExportToFile()
  public readonly scene: Scene = new Scene()

  public process_step: ProcessStep = ProcessStep.LoadModel
  public skeleton_helper: CustomSkeletonHelper | undefined = undefined
  public debugging_visual_object: Group = new Group()

  public mesh_preview_display_type: ModelPreviewDisplay = ModelPreviewDisplay.WeightPainted
  public transform_controls_type: TransformControlType = TransformControlType.Translation

  private readonly clock = new THREE.Clock()
  private environment_container: Group = new Group()
  private readonly eventListeners: EventListeners
  // private readonly router: AppRouter // Replaced with React Router

  public initialize (): void {
    this.setup_environment()
    this.eventListeners.addEventListeners()
    // this.router.init() // Replaced with React Router
    this.process_step = this.process_step_changed(ProcessStep.LoadModel)
    this.animate()
    this.inject_build_version()

    // UI animations
    Animations.attachMicroInteractions()
    const tool_panel = document.getElementById('tool-panel')
    if (tool_panel != null) {
      Animations.fadeSlideInRight(tool_panel, 450, 24)
    }
  }

  constructor () {
    this.eventListeners = new EventListeners(this)
    // this.router = new AppRouter(this) // Replaced with React Router
    this.animate = this.animate.bind(this)

    this.edit_skeleton_step.addEventListener('skeletonTransformed', () => {
      if (this.skeleton_helper !== undefined) {
        this.regenerate_skeleton_helper(this.edit_skeleton_step.skeleton(), 'Skeleton Helper')
      }
      if (this.mesh_preview_display_type === ModelPreviewDisplay.WeightPainted) {
        this.regenerate_weight_painted_preview_mesh()
      }
    })
  }

  private inject_build_version (): void {
    if (this.ui.dom_build_version !== null) {
      this.ui.dom_build_version.innerHTML = build_version
    } else {
      console.warn('Build version DOM element is null. Cannot set number')
    }
  }

  private setup_environment (): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true

    // Set Filmic tone mapping for less saturated, more cinematic look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping // a bit softer of a look
    this.renderer.toneMappingExposure = 2.0 // tweak this value for brightness

    //  renderer should automatically clear its output before rendering a frame
    // This was added/needed when the view helper was implemented.
    this.renderer.autoClear = false

    // Set default camera position for front view
    // this will help because we first want the user to rotate the model to face the front
    this.camera.position.set(0, 1.7, 15) // X:0 (centered), Y:1.7 (eye-level), Z:5 (front view)

    Generators.create_window_resize_listener(this.renderer, this.camera)
    document.body.appendChild(this.renderer.domElement)

    // center orbit controls around mid-section area with target change
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0.9, 0)

    // Set zoom limits to prevent excessive zooming in or out
    this.controls.minDistance = 2 // Minimum zoom (closest to model)
    this.controls.maxDistance = 30 // Maximum zoom (farthest from model)

    this.controls.update()

    const view_hitbox_el = document.getElementById('view-control-hitbox')
    const safe_view_hitbox: HTMLElement = view_hitbox_el ?? (() => {
      const div = document.createElement('div')
      div.id = 'view-control-hitbox-fallback'
      div.style.position = 'absolute'
      div.style.width = '120px'
      div.style.height = '120px'
      div.style.bottom = '0'
      div.style.left = '0'
      document.body.appendChild(div)
      return div
    })()
    this.view_helper = new CustomViewHelper(this.camera, safe_view_hitbox)
    this.view_helper.set_labels('X', 'Y', 'Z')

    const transform_helper = this.transform_controls.getHelper()
    if (transform_helper !== undefined) {
      this.scene.add(transform_helper)
    }

    // make transform control axis a bit smaller so they don't interfere with other points
    this.transform_controls.size = 1.0

    // basic things in another group, to better isolate what we are working on
    this.regenerate_floor_grid()
  } // end setup_environment()

  public regenerate_floor_grid (): void {
    // remove previous setup objects from scene if they exist
    const setup_container = this.scene.getObjectByName('Setup objects')
    if (setup_container != null) {
      this.scene.remove(setup_container)
    }

    // change color of grid based on theme
    let grid_color = 0x4f6f6f
    let floor_color = 0x2d4353
    let light_strength: number = 10
    if (this.theme_manager.get_current_theme() === 'light') {
      grid_color = 0xcccccc // light theme color
      floor_color = 0xecf0f1 // light theme color
      light_strength = 14
    }

    this.scene.fog = new THREE.Fog(floor_color, 20, 80)

    this.environment_container = new Group()
    this.environment_container.name = 'Setup objects'
    const default_lights = Generators.create_default_lights(light_strength) as unknown as Object3D[]
    const grid_helpers = Generators.create_grid_helper(grid_color, floor_color) as unknown as Object3D[]
    this.environment_container.add(...default_lights)
    this.environment_container.add(...grid_helpers)
    this.scene.add(this.environment_container)
  }

  public regenerate_skeleton_helper (new_skeleton: Skeleton, helper_name = 'Skeleton Helper'): void {
    // if skeleton helper exists...remove it
    if (this.skeleton_helper !== undefined) {
      this.scene.remove(this.skeleton_helper)
    }

    this.skeleton_helper = new CustomSkeletonHelper(new_skeleton.bones[0], { linewidth: 4, color: 0x4e7d58 })
    this.skeleton_helper.name = helper_name
    this.scene.add(this.skeleton_helper)
  }

  public update_a_pose_options_visibility (): void {
    if (this.ui.dom_a_pose_correction_options != null) {
      if (this.load_skeleton_step.skeleton_type() === SkeletonType.Human) {
        this.ui.dom_a_pose_correction_options.style.display = 'block'
      } else {
        this.ui.dom_a_pose_correction_options.style.display = 'none'
      }
    }
  }

  public handle_transform_controls_moving (): void {
    if (this.edit_skeleton_step.is_mirror_mode_enabled()) {
      const selected_bone: Bone = this.transform_controls.object as Bone
      this.edit_skeleton_step.apply_mirror_mode(selected_bone, this.transform_controls.getMode())
    }
  }

  private show_skin_failure_message (bone_names_with_errors: string[], error_point_positions: Vector3[]): void {
    // add the bone vertices as X markers to debugging object
    const error_markers: Group = Generators.create_x_markers(error_point_positions, 0.02, 0xff0000)
    this.debugging_visual_object.add(error_markers)
  }

  public process_step_changed (process_step: ProcessStep): ProcessStep {
    this.ui.hide_all_elements()
    this.edit_skeleton_step.cleanup_on_exit_step()
    if (this.ui.dom_animation_player !== null) {
      this.ui.dom_animation_player.style.display = 'none'
      if (process_step === ProcessStep.AnimationsListing) {
        this.ui.dom_animation_player.style.display = 'flex'
      }
    }

    switch (process_step) {
      case ProcessStep.LoadModel:
        if (this.load_model_step.model_meshes() !== undefined) {
          const imported_model = this.scene.getObjectByName('Imported Model') as Object3D | null
          if (imported_model !== null) {
            this.scene.remove(imported_model)
          }
        }
        process_step = ProcessStep.LoadModel
        this.load_model_step.begin()
        break
      case ProcessStep.LoadSkeleton:
        if (this.skeleton_helper !== undefined) {
          this.scene.remove(this.skeleton_helper)
        }
        this.mesh_preview_display_type = ModelPreviewDisplay.Textured
        this.changed_model_preview_display(this.mesh_preview_display_type)
        {
          const model_meshes = this.load_model_step.model_meshes()
          if (model_meshes != null) {
            this.scene.add(model_meshes)
          }
        }
        process_step = ProcessStep.LoadSkeleton
        this.load_skeleton_step.begin()
        break
      case ProcessStep.EditSkeleton:
        if (this.edit_skeleton_step.skeleton() !== undefined) {
          this.regenerate_skeleton_helper(this.edit_skeleton_step.skeleton())
        }
        process_step = ProcessStep.EditSkeleton
        this.edit_skeleton_step.begin()
        this.edit_skeleton_step.setup_scene(this.scene)
        this.transform_controls.enabled = true
        this.transform_controls.setMode(this.transform_controls_type)
        this.skeleton_helper?.setJointsVisible(true)
        this.mesh_preview_display_type = ModelPreviewDisplay.WeightPainted
        this.changed_model_preview_display(this.mesh_preview_display_type)
        break
      case ProcessStep.BindPose: {
        this.process_step = ProcessStep.BindPose
        this.transform_controls.enabled = false
        this.calculate_skin_weighting_for_models()
        if (this.weight_skin_step.skeleton() !== undefined) {
          this.regenerate_skeleton_helper(this.weight_skin_step.skeleton()!)
        }
        const final_meshes = this.weight_skin_step.final_skinned_meshes() as unknown as Object3D[]
        this.scene.add(...final_meshes)
        const wp_group = this.weight_skin_step.weight_painted_mesh_group()
        if (wp_group !== null) {
          wp_group.visible = false
        }
        this.process_step_changed(ProcessStep.AnimationsListing)
        break
      }
      case ProcessStep.AnimationsListing:
        this.process_step = ProcessStep.AnimationsListing
        this.animations_listing_step.begin()
        this.skeleton_helper?.setJointsVisible(false)
        if (this.ui.dom_show_skeleton_checkbox !== null) {
          this.ui.dom_show_skeleton_checkbox.checked = false
        }
        this.update_a_pose_options_visibility()
        if (this.load_skeleton_step.skeleton_type() === SkeletonType.Human) {
          const orig = this.load_skeleton_step.armature?.() ?? null
          const edited = this.edit_skeleton_step.armature?.() ?? null
          if (orig != null && edited != null) {
            this.animations_listing_step.calculate_hip_bone_offset(orig, edited)
          }
        }
        this.animations_listing_step.load_and_apply_default_animation_to_skinned_mesh(this.weight_skin_step.final_skinned_meshes(),
          this.load_skeleton_step.skeleton_type())
        if (this.skeleton_helper !== undefined) {
          this.skeleton_helper.hide()
        }
        break
    }

    // Animate current step label and active panel container when visible
    const step_label = document.getElementById('current-step-label')
    const active_panel = document.getElementById('tool-panel')
    Animations.stepChange(step_label, active_panel)

    this.transform_controls.detach()
    // this.router.update(process_step) // Replaced with React Router
    return process_step
  }

  private animate (): void {
    requestAnimationFrame(this.animate)
    const delta_time: number = this.clock.getDelta()

    // if we are in the animation listing step, we can call
    // render/update functions in that
    if (this.process_step === ProcessStep.AnimationsListing) {
      this.animations_listing_step.frame_change(delta_time)
    }

    this.renderer.render(this.scene, this.camera)

    // view helper
    this.view_helper.render(this.renderer)
    if (this.view_helper.is_animating()) {
      this.view_helper.update(delta_time)
    }
  }

  public changed_model_preview_display (mesh_textured_display_type: ModelPreviewDisplay): void {
    this.mesh_preview_display_type = mesh_textured_display_type

    // show/hide loaded textured model depending on view
    const model_meshes_obj = this.load_model_step.model_meshes()
    if (model_meshes_obj != null) {
      model_meshes_obj.visible = this.mesh_preview_display_type === ModelPreviewDisplay.Textured
    }

    if (this.mesh_preview_display_type === ModelPreviewDisplay.WeightPainted) {
      this.regenerate_weight_painted_preview_mesh()
    }

    // show/hide weight painted mesh depending on view
    const weight_group = this.weight_skin_step.weight_painted_mesh_group()
    if (weight_group !== null) {
      weight_group.visible = this.mesh_preview_display_type === ModelPreviewDisplay.WeightPainted
    }
  }

  public changed_transform_controls_mode (radio_button_selected: string): void {
    switch (radio_button_selected) {
      case 'translate':
        this.transform_controls_type = TransformControlType.Translation
        this.transform_controls.setMode('translate')
        break
      case 'rotation':
        this.transform_controls_type = TransformControlType.Rotation
        this.transform_controls.setMode('rotate')
        break
      default:
        console.warn(`Unknown transform mode selected: ${radio_button_selected}`)
        break
    }
  }

  public handle_transform_controls_mouse_down (mouse_event: MouseEvent): void {
    // primary click is made for rotating around 3d scene
    const is_primary_button_click = mouse_event.button === 0

    if (!is_primary_button_click) { return }

    if (this.edit_skeleton_step.skeleton()?.bones === undefined) { return }

    // when we are done with skinned mesh, we shouldn't be editing transforms
    if (!this.transform_controls.enabled) {
      return
    }

    // we will change which skeleton we do an intersection test with
    // depending on what step we are on. We are either moving the setup skeleton
    // or moving the bind pose skeleton
    const skeleton_to_test: Skeleton | undefined = this.edit_skeleton_step.skeleton()

    // if no skeleton to test, abort
    if (skeleton_to_test === undefined) {
      console.warn('No skeleton to test for intersection, aborting transform controls mouse down')
      return
    }

    // this returns 3 values, so we can destructure them. do not remove any of these
    // even if one of them is not used, otherwise there will be weird issues
    const [closest_bone, _unused_index, closest_distance] = Utility.raycast_closest_bone_test(this.camera, mouse_event, skeleton_to_test)

    // don't allow to select root bone for now
    if (closest_bone?.name === 'root') {
      return
    }

    // only do selection if we are close
    // the orbit controls also have panning with alt-click, so we don't want to interfere with that
    if (closest_distance === null || closest_distance > this.transform_controls_hover_distance) {
      return
    }

    if (closest_bone !== null) {
      this.transform_controls.attach(closest_bone)
      this.edit_skeleton_step.set_currently_selected_bone(closest_bone)
    } else {
      this.edit_skeleton_step.set_currently_selected_bone(null as any)
    }
  }

  public remove_skinned_meshes_from_scene (): void {
    const existing_skinned_meshes = this.scene.children.filter((child: Object3D) => child.name === 'Skinned Mesh')
    existing_skinned_meshes.forEach((existing_skinned_mesh: Object3D) => {
      Utility.remove_object_with_children(existing_skinned_mesh)
    })
  }

  public regenerate_weight_painted_preview_mesh (): void {
    // needed for skinning process
    this.calculate_skin_weighting_for_models()

    // if the weight painted mesh is not in scene, add it
    if (this.scene.getObjectByName('Weight Painted Mesh') === undefined) {
      this.scene.add(this.weight_skin_step.weight_painted_mesh_group())
    }
  }

  private calculate_skin_weighting_for_models (): void {
    // we only need one binding skeleton. All skinned meshes will use this.
    this.weight_skin_step.reset_all_skin_process_data() // clear out any existing skinned meshes in storage

    // needed for skinning process if we change modes
    const edit_armature = this.edit_skeleton_step.armature()
    const algo = this.edit_skeleton_step.algorithm() ?? 'closest-distance-targeting'
    const skel_type = this.load_skeleton_step.skeleton_type()
    if (edit_armature != null && skel_type != null) {
      this.weight_skin_step.create_bone_formula_object(edit_armature, algo, skel_type)
    }

    this.weight_skin_step.create_binding_skeleton()

    // add geometry data needed for skinning
    this.load_model_step.models_geometry_list().forEach((mesh_geometry) => {
      this.weight_skin_step.add_to_geometry_data_to_skin(mesh_geometry)
    })

    // all mesh material data associated with the geometry data
    this.load_model_step.models_material_list().forEach((mesh_material) => {
      this.weight_skin_step.add_mesh_material(mesh_material)
    })

    // perform skinning operation
    // this will take all the mesh geometry data we added above and create skinned meshes
    // TODO: Always regenerate the weight painted mesh preview for now. This will change later
    // when we have are in the "Weight Painted" display mode
    this.weight_skin_step.calculate_weights_for_all_mesh_data(true)

    // TODO: maybe way to update references instead of removing and adding?
    // this.remove_skinned_meshes_from_scene() // clear any existing skinned meshes in the scene
    // this.scene.add(...this.weight_skin_step.final_skinned_meshes())

    // remember our skeleton position before we do the skinning process
    // that way if we revert to try again...we will have the original positions/rotations
    this.load_model_step.model_meshes().visible = false // hide our unskinned mesh after we have done the skinning process

    // re-define skeleton helper to use the skinned mesh)
    if (this.weight_skin_step.skeleton() === undefined) {
      console.warn('Tried to regenerate skeleton helper, but skeleton is undefined!')
      return
    }

    // we might want to test out the binding algorithm to see various hitboxes
    // if we are doing debugging, go to that view, if no debugging, go straight to thd animation listing step
    if (this.edit_skeleton_step.show_debugging()) {
      return
    }

    console.log('What does our scene look like after we are done skinning:', this.scene)
  }

  public test_bone_weighting_success (): boolean {
    this.debugging_visual_object = Utility.regenerate_debugging_scene(this.scene) // clear out the debugging scene

    {
      const edit_armature = this.edit_skeleton_step.armature()
      const algo = this.edit_skeleton_step.algorithm() ?? 'closest-distance-targeting'
      const skel_type = this.load_skeleton_step.skeleton_type()
      if (edit_armature != null && skel_type != null) {
        this.weight_skin_step.create_bone_formula_object(edit_armature, algo, skel_type)
      }
    }

    if (this.edit_skeleton_step.show_debugging()) {
      this.weight_skin_step.set_show_debug(this.edit_skeleton_step.show_debugging())
      this.weight_skin_step.set_debug_scene_object(this.debugging_visual_object)
      this.weight_skin_step.set_bone_index_to_test(-1)
    }

    // Don't do skinning operation if there are bones outside of the mesh
    // that messes up the bone envelope calculation
    let testing_geometry_success = true
    this.load_model_step.models_geometry_list().forEach((mesh_geometry, index) => {
      this.weight_skin_step.set_mesh_geometry(mesh_geometry)
      const tester_data: BoneTesterData = this.weight_skin_step.test_geometry()

      if (tester_data.bones_names_with_errors.length > 0) {
        const names_with_object_index: string[] = tester_data.bones_names_with_errors.map((bone_name: string) => bone_name + ` ${mesh_geometry.name}`)
        this.show_skin_failure_message(names_with_object_index, tester_data.bones_vertices_with_errors)
        testing_geometry_success = false
      }
    })

    if (!testing_geometry_success) {
      return false
    }

    return true
  }
} // end Bootstrap class

// Create an instance of the Bootstrap class when the script is loaded
const app = new Bootstrap()
app.initialize()
