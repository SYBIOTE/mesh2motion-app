import React, { useState } from 'react';

interface Animation {
  id: string;
  name: string;
  selected: boolean;
}

interface AnimationPageProps {
  animations?: Animation[];
  onAnimationToggle?: (animationId: string, selected: boolean) => void;
  onFilterChange?: (filter: string) => void;
  onArmExtend?: (value: number) => void;
  onShowSkeletonToggle?: (show: boolean) => void;
  onExportFormatChange?: (format: string) => void;
  onBackToEditSkeleton?: () => void;
  onExport?: () => void;
  animationCount?: number;
  selectedCount?: number;
  showSkeleton?: boolean;
  exportFormat?: string;
  armExtendValue?: number;
}

export const AnimationPage: React.FC<AnimationPageProps> = ({
  animations = [],
  onAnimationToggle,
  onFilterChange,
  onArmExtend,
  onShowSkeletonToggle,
  onExportFormatChange,
  onBackToEditSkeleton,
  onExport,
  animationCount = 0,
  selectedCount = 0,
  showSkeleton = false,
  exportFormat = 'glb',
  armExtendValue = 3
}) => {
  const [filter, setFilter] = useState('');
  const [armValue, setArmValue] = useState(armExtendValue);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handleArmValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArmValue(parseInt(e.target.value));
  };

  const handleArmExtend = () => {
    if (onArmExtend) {
      onArmExtend(armValue);
    }
  };

  const handleSkeletonToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onShowSkeletonToggle) {
      onShowSkeletonToggle(e.target.checked);
    }
  };

  const handleExportFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onExportFormatChange) {
      onExportFormatChange(e.target.value);
    }
  };

  const handleAnimationToggle = (animationId: string, selected: boolean) => {
    if (onAnimationToggle) {
      onAnimationToggle(animationId, selected);
    }
  };

  return (
    <span id="skinned-step-animation-export-options">
      <div id="animations-listing">
        <div id="animation-listing-count">{animationCount}</div>
        <input 
          type="text" 
          id="animation-filter" 
          placeholder="Filter animations..."
          value={filter}
          onChange={handleFilterChange}
        />

        <div id="animations-items">
          {animations.map((animation) => (
            <div key={animation.id} className="animation-item">
              <input
                type="checkbox"
                id={`animation-${animation.id}`}
                checked={animation.selected}
                onChange={(e) => handleAnimationToggle(animation.id, e.target.checked)}
              />
              <label htmlFor={`animation-${animation.id}`}>{animation.name}</label>
            </div>
          ))}
        </div>

        <div id="a-pose-correction-options">
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex' }}>A-Pose Correction</label>
            <span className="tooltip">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span>
              <span className="tooltiptext">
                If your model uses an A-Pose, this will help expand/contract arms for all animations
              </span>
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '1rem', 
            justifyContent: 'flex-start', 
            alignItems: 'center' 
          }}>
            <input 
              type="number" 
              id="extend-arm-input" 
              name="arm-extend-input" 
              value={armValue} 
              min="-25" 
              max="25" 
              step="1"
              onChange={handleArmValueChange}
            />
            <span className="suffix-unit">%</span>
            <button 
              id="extend-arm-button" 
              className="secondary-button"
              onClick={handleArmExtend}
            >
              Open Arms
            </button>

            <div className="styled-checkbox icon-toggle">
              <input 
                type="checkbox" 
                id="show-skeleton-checkbox" 
                name="show-skeleton" 
                value="show" 
                style={{ display: 'none' }}
                checked={showSkeleton}
                onChange={handleSkeletonToggle}
              />
              <label htmlFor="show-skeleton-checkbox" title="Show skeleton" tabIndex={0}>
                <img 
                  src="images/icons/bone-display.svg" 
                  width="30" 
                  height="30" 
                  alt="Show skeleton" 
                />
              </label>
            </div>
          </div>

          <hr />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="export-format" style={{ fontSize: '0.9rem' }}>Format:</label>
          <select 
            id="export-format" 
            title="Choose export format"
            value={exportFormat}
            onChange={handleExportFormatChange}
          >
            <option value="glb">GLB</option>
            <option value="vrm">VRM</option>
            <option value="fbx">FBX</option>
          </select>

          <button 
            className="secondary-button" 
            id="action_back_to_edit_skeleton"
            onClick={onBackToEditSkeleton}
          >
            &#x2039; Back
          </button>
          
          <button 
            id="export-button" 
            title="Export animations. Make sure to select the animations you want to export first."
            onClick={onExport}
          >
            <span className="button-icon-group">
              <span className="material-symbols-outlined">save_alt</span>
              <span>Download <span id="animation-selection-count">{selectedCount}</span></span>
            </span>
          </button>
          <a id="download-hidden-link" href="#" style={{ display: 'none' }}></a>
        </div>
      </div>
    </span>
  );
};
