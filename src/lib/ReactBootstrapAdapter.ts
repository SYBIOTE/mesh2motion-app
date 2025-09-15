import type { Bootstrap } from '../script';
import { ProcessStep } from './enums/ProcessStep';

/**
 * Adapter class to bridge React components with the existing Bootstrap 3D engine
 */
export class ReactBootstrapAdapter {
  private bootstrap: Bootstrap;
  private selectedModelPath: string = 'models/human-mannequin.glb'; // Default model

  constructor(bootstrap: Bootstrap) {
    this.bootstrap = bootstrap;
    
    // Listen for model loaded events
    this.bootstrap.load_model_step.addEventListener('modelLoaded', () => {
      this.addModelToScene();
    });
  }

  // Navigation methods
  navigateToStep(step: ProcessStep): void {
    this.bootstrap.process_step = this.bootstrap.process_step_changed(step);
  }

  // Model loading methods
  uploadModel(file: File): void {
    this.bootstrap.load_model_step.load_model_from_file(file);
    // The model will be added to scene automatically via the 'modelLoaded' event listener
  }

  selectModel(modelPath: string): void {
    // Store the selected model path for later loading
    this.selectedModelPath = modelPath;
  }

  loadModel(): void {
    if (this.selectedModelPath) {
      this.bootstrap.load_model_step.load_model_from_path(this.selectedModelPath);
      // The model will be added to scene automatically via the 'modelLoaded' event listener
    }
  }

  /**
   * Add the loaded model to the 3D scene for immediate display
   */
  private addModelToScene(): void {
    // Remove any existing imported model
    const existingModel = this.bootstrap.scene.getObjectByName('Imported Model');
    if (existingModel) {
      this.bootstrap.scene.remove(existingModel);
    }

    // Add the new model to the scene
    const modelMeshes = this.bootstrap.load_model_step.model_meshes();
    if (modelMeshes) {
      modelMeshes.name = 'Imported Model';
      this.bootstrap.scene.add(modelMeshes);
    }
  }

  toggleDebugMode(enabled: boolean): void {
    this.bootstrap.load_model_step.set_debug_mode(enabled);
  }

  // Skeleton methods
  rotateModel(axis: 'x' | 'y' | 'z'): void {
    // TODO: Connect to existing model rotation
    console.log('Rotate model:', axis);
    // this.bootstrap.load_skeleton_step.rotate_model(axis);
  }

  moveModelToFloor(): void {
    // TODO: Connect to existing move to floor
    console.log('Move to floor');
    // this.bootstrap.load_skeleton_step.move_to_floor();
  }

  selectSkeleton(skeletonType: string): void {
    // TODO: Connect to existing skeleton selection
    console.log('Select skeleton:', skeletonType);
    // this.bootstrap.load_skeleton_step.set_skeleton_type(skeletonType);
  }

  selectHandSkeleton(handType: string): void {
    // TODO: Connect to existing hand skeleton selection
    console.log('Select hand skeleton:', handType);
    // this.bootstrap.load_skeleton_step.set_hand_skeleton_type(handType);
  }

  loadSkeleton(): void {
    // TODO: Connect to existing skeleton loading
    console.log('Load skeleton');
    // this.bootstrap.load_skeleton_step.load_skeleton();
  }

  // Edit skeleton methods
  undo(): void {
    this.bootstrap.edit_skeleton_step.undo_bone_transformation();
  }

  redo(): void {
    this.bootstrap.edit_skeleton_step.redo_bone_transformation();
  }

  changePreview(previewType: 'weight-painted' | 'textured'): void {
    const displayType = previewType === 'weight-painted' ? 
      this.bootstrap.mesh_preview_display_type : 
      this.bootstrap.mesh_preview_display_type;
    this.bootstrap.changed_model_preview_display(displayType);
  }

  changeTransform(transformType: 'translate' | 'rotation'): void {
    this.bootstrap.changed_transform_controls_mode(transformType);
  }

  toggleMirror(enabled: boolean): void {
    // TODO: Connect to existing mirror toggle
    console.log('Mirror toggle:', enabled);
    // this.bootstrap.edit_skeleton_step.set_mirror_mode(enabled);
  }

  scaleSkeleton(scale: number): void {
    // TODO: Connect to existing scale skeleton
    console.log('Scale skeleton:', scale);
    // this.bootstrap.edit_skeleton_step.scale_skeleton(scale);
  }

  bindPose(): void {
    this.navigateToStep(ProcessStep.BindPose);
  }

  // Animation methods
  toggleAnimation(animationId: string, selected: boolean): void {
    // TODO: Connect to existing animation toggle
    console.log('Animation toggle:', animationId, selected);
    // this.bootstrap.animations_listing_step.toggle_animation(animationId, selected);
  }

  filterAnimations(filter: string): void {
    // TODO: Connect to existing animation filter
    console.log('Filter animations:', filter);
    // this.bootstrap.animations_listing_step.filter_animations(filter);
  }

  extendArms(value: number): void {
    // TODO: Connect to existing arm extend
    console.log('Extend arms:', value);
    // this.bootstrap.animations_listing_step.extend_arms(value);
  }

  toggleSkeletonVisibility(show: boolean): void {
    if (this.bootstrap.skeleton_helper) {
      if (show) {
        this.bootstrap.skeleton_helper.show();
      } else {
        this.bootstrap.skeleton_helper.hide();
      }
    }
  }

  changeExportFormat(format: string): void {
    // TODO: Connect to existing export format change
    console.log('Export format:', format);
    // this.bootstrap.file_export_step.set_export_format(format);
  }

  exportAnimations(): void {
    // TODO: Connect to existing export functionality
    console.log('Export animations');
    // this.bootstrap.file_export_step.export_selected_animations();
  }

  // Theme methods
  toggleTheme(): void {
    this.bootstrap.theme_manager.toggle_theme();
    this.bootstrap.regenerate_floor_grid();
  }

  // Getters for current state
  getCurrentStep(): ProcessStep {
    return this.bootstrap.process_step;
  }

  getSelectedBone(): string {
    return this.bootstrap.edit_skeleton_step.get_currently_selected_bone()?.name || 'None';
  }

  canUndo(): boolean {
    return this.bootstrap.edit_skeleton_step.can_undo();
  }

  canRedo(): boolean {
    return this.bootstrap.edit_skeleton_step.can_redo();
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.bootstrap.theme_manager.get_current_theme() as 'light' | 'dark';
  }
}
