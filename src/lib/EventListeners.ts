import { type Bootstrap } from '../script'
import { ModelPreviewDisplay } from './enums/ModelPreviewDisplay'
import { ProcessStep } from './enums/ProcessStep'
import { Utility } from './Utilities'
export class EventListeners {
  constructor (private readonly bootstrap: Bootstrap) {}

  public addEventListeners (): void {
    // Stepper navigation
    const route_map: Record<string, string> = {
      'load-model': '/load-model',
      'load-skeleton': '/load-skeleton',
      edit: '/edit',
      animate: '/animate',
      export: '/export'
    }
    document.querySelectorAll('#stepper .step').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const step_key = target.getAttribute('data-step') ?? 'load-model'
        const path = route_map[step_key]
        if (path != null) {
          // use router to navigate
          history.pushState({}, '', path)
          // trigger the app to handle route change
          if (path === '/load-model') this.bootstrap.process_step_changed(ProcessStep.LoadModel)
          else if (path === '/load-skeleton') this.bootstrap.process_step_changed(ProcessStep.LoadSkeleton)
          else if (path === '/edit') this.bootstrap.process_step_changed(ProcessStep.EditSkeleton)
          else if (path === '/animate') this.bootstrap.process_step_changed(ProcessStep.AnimationsListing)
          else if (path === '/export') this.bootstrap.process_step_changed(ProcessStep.AnimationsListing)
        }
      })
    })

    // VRM banner dismiss
    document.getElementById('vrm-banner-dismiss')?.addEventListener('click', () => {
      const banner = document.getElementById('vrm-banner')
      if (banner != null) { banner.style.display = 'none' }
    })
    // monitor theme changes
    this.bootstrap.theme_manager.addEventListener('theme-changed', (event: any) => {
      this.bootstrap.regenerate_floor_grid()
    })

    // listen for view helper changes
    document.getElementById('view-control-hitbox')?.addEventListener('pointerdown', (event: PointerEvent) => {
      if (this.bootstrap.view_helper?.handleClick(event)) {
        event.stopPropagation()
        event.preventDefault()
      }
    })

    this.bootstrap.renderer.domElement.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.bootstrap.is_transform_controls_dragging) {
        this.bootstrap.handle_transform_controls_moving()
      }

      // edit skeleton step logic that deals with hovering over bones
      if (this.bootstrap.process_step === ProcessStep.EditSkeleton) {
        this.bootstrap.edit_skeleton_step.calculate_bone_hover_effect(event, this.bootstrap.camera, this.bootstrap.transform_controls_hover_distance)
      }
    })

    this.bootstrap.renderer.domElement.addEventListener('mousedown', (event: MouseEvent) => {
      this.bootstrap.handle_transform_controls_mouse_down(event)

      // update UI with current bone name
      const current_bone = this.bootstrap.edit_skeleton_step.get_currently_selected_bone()
      if (this.bootstrap.ui.dom_selected_bone_label !== null && current_bone !== null) {
        this.bootstrap.ui.dom_selected_bone_label.innerHTML = current_bone.name
      }
    }, false)

    // custom event listeners for the transform controls.
    // we can know about the "mouseup" event with this
    this.bootstrap.transform_controls?.addEventListener('dragging-changed', (event: any) => {
      const drag_event = event as { value: boolean }
      const is_dragging: boolean = !!drag_event.value
      this.bootstrap.is_transform_controls_dragging = is_dragging
      if (this.bootstrap.controls !== undefined) {
        this.bootstrap.controls.enabled = !is_dragging
      }

      // Store undo state when we start dragging (event.value = true)
      if (is_dragging && this.bootstrap.process_step === ProcessStep.EditSkeleton) {
        this.bootstrap.edit_skeleton_step.store_bone_state_for_undo()
      }

      // if we stopped dragging, that means a mouse up.
      // if we are editing skeleton and viewing weight painted mesh, refresh the weight painting
      if (this.bootstrap.process_step === ProcessStep.EditSkeleton &&
        this.bootstrap.mesh_preview_display_type === ModelPreviewDisplay.WeightPainted) {
        this.bootstrap.regenerate_weight_painted_preview_mesh()
      }
    })

    this.bootstrap.load_model_step.addEventListener('modelLoaded', () => {
      // VRM detected: show banner, but do NOT auto-skip steps. Let user continue.
      const is_vrm = this.bootstrap.load_model_step.is_vrm_loaded?.() ?? false
      if (is_vrm) {
        const banner = document.getElementById('vrm-banner')
        if (banner != null) {
          banner.style.display = 'flex'
        }
      }
      // proceed to Load Skeleton as the next step by default
      this.bootstrap.process_step = this.bootstrap.process_step_changed(ProcessStep.LoadSkeleton)
      // update stepper active/disabled states
      this.updateStepper()
    })

    this.bootstrap.load_skeleton_step.addEventListener('skeletonLoaded', () => {
      this.bootstrap.edit_skeleton_step.load_original_armature_from_model(this.bootstrap.load_skeleton_step.armature())
      this.bootstrap.process_step = this.bootstrap.process_step_changed(ProcessStep.EditSkeleton)
      this.updateStepper()
    })

    this.bootstrap.ui.dom_bind_pose_button?.addEventListener('click', () => {
      const passed_bone_skinning_test = this.bootstrap.test_bone_weighting_success()
      if (passed_bone_skinning_test) {
        this.bootstrap.process_step_changed(ProcessStep.BindPose)
      }
      this.updateStepper()
    })

    // rotate model after loading it in to orient it correctly
    this.bootstrap.ui.dom_rotate_model_x_button?.addEventListener('click', () => {
      this.bootstrap.load_model_step.rotate_model_geometry('x', 90)
    })

    this.bootstrap.ui.dom_rotate_model_y_button?.addEventListener('click', () => {
      this.bootstrap.load_model_step.rotate_model_geometry('y', 90)
    })

    this.bootstrap.ui.dom_rotate_model_z_button?.addEventListener('click', () => {
      this.bootstrap.load_model_step.rotate_model_geometry('z', 90)
    })

    this.bootstrap.ui.dom_move_model_to_floor_button?.addEventListener('click', () => {
      this.bootstrap.load_model_step.move_model_to_floor()
    })

    this.bootstrap.ui.dom_show_skeleton_checkbox?.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLInputElement | null
      if (this.bootstrap.skeleton_helper !== undefined && target !== null) {
        this.bootstrap.skeleton_helper.visible = !!target.checked
      } else {
        console.warn('Skeleton helper is undefined, so we cannot show it')
      }
    })

    this.bootstrap.ui.dom_export_button?.addEventListener('click', () => {
      const all_clips = this.bootstrap.animations_listing_step.animation_clips()
      const animations_to_export: number[] = this.bootstrap.animations_listing_step.get_animation_indices_to_export()

      this.bootstrap.file_export_step.set_animation_clips_to_export(all_clips, animations_to_export)
      // Pass VRM context if we loaded a VRM model
      const is_vrm = this.bootstrap.load_model_step.is_vrm_loaded()
      const vrm_src = this.bootstrap.load_model_step.get_vrm_source_data_url()
      const vrm_name = this.bootstrap.load_model_step.get_original_uploaded_filename()
      const vrm_inst: any = (this.bootstrap.load_model_step as any).get_vrm_instance?.()

      // Build a reverse bone map (node.name -> humanoid bone name) if humanoid is present
      let bone_name_map: Record<string, string> | undefined
      const humanoid = vrm_inst?.humanoid
      const human_bones = humanoid?.humanBones
      if (Array.isArray(human_bones)) {
        const map: Record<string, string> = {}
        human_bones.forEach((hb: any) => {
          const node_name: string | undefined = hb?.node?.name
          const bone_name: string | undefined = hb?.bone
          if (node_name != null && node_name !== '' && bone_name != null && bone_name !== '') {
            map[node_name] = bone_name
          }
        })
        bone_name_map = map
      } else if (human_bones != null && typeof human_bones === 'object') {
        const map: Record<string, string> = {}
        Object.keys(human_bones as Record<string, unknown>).forEach((key: string) => {
          const hb: any = (human_bones as Record<string, unknown>)[key]
          const node_name: string | undefined = hb?.node?.name
          const bone_name: string = key
          if (node_name != null && node_name !== '' && bone_name !== '') {
            map[node_name] = bone_name
          }
        })
        bone_name_map = map
      }

      this.bootstrap.file_export_step.set_vrm_context(
        is_vrm,
        vrm_src,
        vrm_name,
        bone_name_map,
        (this.bootstrap.load_model_step as any).get_vrm_instance?.()
      )
      this.bootstrap.file_export_step.export(this.bootstrap.weight_skin_step.final_skinned_meshes(), 'exported-model')
    })

    // going back to edit skeleton step after skinning
    // this will do a lot of resetting
    this.bootstrap.ui.dom_back_to_edit_skeleton_button?.addEventListener('click', () => {
      this.bootstrap.remove_skinned_meshes_from_scene() // clear any existing skinned meshes
      this.bootstrap.debugging_visual_object = Utility.regenerate_debugging_scene(this.bootstrap.scene)
      this.bootstrap.process_step = this.bootstrap.process_step_changed(ProcessStep.EditSkeleton)
      this.updateStepper()

      // reset current bone selection for edit skeleton step
      this.bootstrap.edit_skeleton_step.set_currently_selected_bone?.(null as any)

      if (this.bootstrap.ui.dom_selected_bone_label !== null) {
        this.bootstrap.ui.dom_selected_bone_label.innerHTML = 'None'
      }

      // reset the undo/redo system
      this.bootstrap.edit_skeleton_step.clear_undo_history()
    })

    // going back to load skeleton step from edit skeleton step
    this.bootstrap.ui.dom_back_to_load_skeleton_button?.addEventListener('click', () => {
      this.bootstrap.process_step = this.bootstrap.process_step_changed(ProcessStep.LoadSkeleton)
      this.updateStepper()
    })

    this.bootstrap.ui.dom_back_to_load_model_button?.addEventListener('click', () => {
      this.bootstrap.process_step = this.bootstrap.process_step_changed(ProcessStep.LoadModel)
      this.updateStepper()
    })

    this.bootstrap.ui.dom_transform_type_radio_group?.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement | null
      const radio_button_selected: string | null = target?.value ?? null

      if (radio_button_selected === null) {
        console.warn('Null radio button selected for transform type change')
        return
      }

      this.bootstrap.changed_transform_controls_mode(radio_button_selected)
    })

    // changing the 3d model preview while editing the skeleton bones
    this.bootstrap.ui.dom_mesh_preview_group?.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement | null
      const radio_button_selected: string | null = target?.value ?? null

      if (radio_button_selected === null) {
        console.warn('Null radio button selected for mesh preview type change')
        return
      }

      if (radio_button_selected === ModelPreviewDisplay.Textured) {
        this.bootstrap.changed_model_preview_display(ModelPreviewDisplay.Textured)
      } else if (radio_button_selected === ModelPreviewDisplay.WeightPainted) {
        this.bootstrap.changed_model_preview_display(ModelPreviewDisplay.WeightPainted)
      } else {
        console.warn(`Unknown mesh preview type selected: ${radio_button_selected}`)
      }
    })

    // Keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when in EditSkeleton step
      if (this.bootstrap.process_step !== ProcessStep.EditSkeleton) {
        return
      }

      // Define undo/redo shortcut conditions
      // Ctrl+Z or Cmd+Z for undo
      // Ctrl+Y, Cmd+Y, Ctrl+Shift+Z, or Cmd+Shift+Z for redo
      const is_undo_shortcut_pressed = (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey
      const is_redo_shortcut_pressed = (event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))

      if (is_undo_shortcut_pressed) {
        event.preventDefault()
        this.bootstrap.edit_skeleton_step.undo_bone_transformation()
      }

      if (is_redo_shortcut_pressed) {
        event.preventDefault()
        this.bootstrap.edit_skeleton_step.redo_bone_transformation()
      }
    })
  }

  private updateStepper (): void {
    const steps = ['load-model', 'load-skeleton', 'edit', 'animate', 'export']
    const current = this.bootstrap.process_step
    const reached: Record<string, boolean> = {
      'load-model': true,
      'load-skeleton': current !== ProcessStep.LoadModel,
      edit: current === ProcessStep.EditSkeleton || current === ProcessStep.BindPose || current === ProcessStep.AnimationsListing,
      animate: current === ProcessStep.AnimationsListing,
      export: current === ProcessStep.AnimationsListing
    }

    steps.forEach((key) => {
      const el = document.querySelector(`#stepper .step[data-step="${key}"]`)
      if (el == null) return
      el.classList.remove('active')
      el.disabled = !reached[key]
    })

    // set active
    let active_key = 'load-model'
    if (current === ProcessStep.LoadSkeleton) active_key = 'load-skeleton'
    else if (current === ProcessStep.EditSkeleton) active_key = 'edit'
    else if (current === ProcessStep.AnimationsListing) active_key = 'animate'
    const active_el = document.querySelector(`#stepper .step[data-step="${active_key}"]`)
    active_el?.classList.add('active')
  }
}
