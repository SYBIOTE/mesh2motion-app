import React, { useState } from 'react';
import { UndoRedoControls } from '../common/UndoRedoControls';

interface EditSkeletonPageProps {
  selectedBone?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPreviewChange?: (previewType: 'weight-painted' | 'textured') => void;
  onTransformChange?: (transformType: 'translate' | 'rotation') => void;
  onMirrorToggle?: (enabled: boolean) => void;
  onScaleSkeleton?: (scale: number) => void;
  onBackToLoadSkeleton?: () => void;
  onBindPose?: () => void;
  mirrorEnabled?: boolean;
  previewType?: 'weight-painted' | 'textured';
  transformType?: 'translate' | 'rotation';
}

export const EditSkeletonPage: React.FC<EditSkeletonPageProps> = ({
  selectedBone = 'None',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onPreviewChange,
  onTransformChange,
  onMirrorToggle,
  onScaleSkeleton,
  onBackToLoadSkeleton,
  onBindPose,
  mirrorEnabled = true,
  previewType = 'weight-painted',
  transformType = 'translate'
}) => {
  const [scaleValue, setScaleValue] = useState(-3);

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'weight-painted' | 'textured';
    if (onPreviewChange) {
      onPreviewChange(value);
    }
  };

  const handleTransformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'translate' | 'rotation';
    if (onTransformChange) {
      onTransformChange(value);
    }
  };

  const handleMirrorToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onMirrorToggle) {
      onMirrorToggle(e.target.checked);
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScaleValue(parseInt(e.target.value));
  };

  const handleScaleSkeleton = () => {
    if (onScaleSkeleton) {
      onScaleSkeleton(scaleValue);
    }
  };

  return (
    <span id="skeleton-step-actions">
      <UndoRedoControls
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <p id="bone-selection-section">
        <span>Selected Bone: <span id="edit-selected-bone-label">{selectedBone}</span></span>
      </p>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <fieldset>
          <span>Preview</span>
          <div id="mesh-preview-group" className="toggle">
            <input 
              id="preview-painted" 
              type="radio" 
              name="mesh-preview-type" 
              value="weight-painted" 
              checked={previewType === 'weight-painted'}
              onChange={handlePreviewChange}
            />
            <label htmlFor="preview-painted">
              <img 
                src="images/icons/display-weight-painted.svg" 
                alt="Weights" 
                width="20" 
                height="20" 
                title="Weight painted mesh" 
              />
            </label>
            
            <input 
              id="preview-textured" 
              type="radio" 
              name="mesh-preview-type" 
              value="textured"
              checked={previewType === 'textured'}
              onChange={handlePreviewChange}
            />
            <label htmlFor="preview-textured">
              <img 
                src="images/icons/display-textured.svg" 
                alt="Textured" 
                width="20" 
                height="20" 
                title="Textured Mesh" 
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <span>Transform</span>
          <div id="transform-control-type-group" className="toggle">
            <input 
              type="radio" 
              name="transform-control-type" 
              value="translate" 
              id="transform-translate" 
              checked={transformType === 'translate'}
              onChange={handleTransformChange}
            />
            <label htmlFor="transform-translate">
              <img 
                src="images/icons/tool-move.svg" 
                alt="Translate" 
                width="20" 
                height="20" 
                title="Translation" 
              />
            </label>
            
            <input 
              type="radio" 
              name="transform-control-type" 
              value="rotation" 
              id="transform-rotate"
              checked={transformType === 'rotation'}
              onChange={handleTransformChange}
            />
            <label htmlFor="transform-rotate">
              <img 
                src="images/icons/tool-rotate.svg" 
                alt="Rotate" 
                width="20" 
                height="20" 
                title="Rotation" 
              />
            </label>
          </div>
        </fieldset>
      </div>

      <div className="styled-checkbox">
        <input 
          type="checkbox" 
          id="mirror-skeleton" 
          name="mirror-skeleton" 
          value="mirror" 
          checked={mirrorEnabled}
          onChange={handleMirrorToggle}
        />
        <label htmlFor="mirror-skeleton">Mirror Left/Right Joints</label>
      </div>

      <hr />

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-evenly', 
        alignItems: 'center', 
        gap: '0.4rem' 
      }}>
        <input 
          type="number" 
          id="scale-input" 
          name="scale-input" 
          value={scaleValue} 
          min="-90" 
          max="90" 
          step="1.0"
          onChange={handleScaleChange}
        />
        <span className="suffix-unit">%</span>
        <button 
          id="scale-skeleton-button" 
          className="secondary-button"
          onClick={handleScaleSkeleton}
        >
          Scale skeleton
        </button>
      </div>

      <div className="display: flex; gap: 0.5rem;">
        <button 
          className="secondary-button" 
          id="action_back_to_load_skeleton"
          onClick={onBackToLoadSkeleton}
        >
          &#x2039; Back
        </button>
        <button 
          id="action_bind_pose"
          onClick={onBindPose}
        >
          Bind pose
        </button>
      </div>
    </span>
  );
};
