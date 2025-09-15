import React, { useState } from 'react';

interface LoadSkeletonPageProps {
  onRotateModel?: (axis: 'x' | 'y' | 'z') => void;
  onMoveToFloor?: () => void;
  onSkeletonSelect?: (skeletonType: string) => void;
  onHandSkeletonSelect?: (handType: string) => void;
  onBackToLoadModel?: () => void;
  onLoadSkeleton?: () => void;
  showHandOptions?: boolean;
}

export const LoadSkeletonPage: React.FC<LoadSkeletonPageProps> = ({
  onRotateModel,
  onMoveToFloor,
  onSkeletonSelect,
  onHandSkeletonSelect,
  onBackToLoadModel,
  onLoadSkeleton,
  showHandOptions = true
}) => {
  const [selectedSkeleton, setSelectedSkeleton] = useState('human');
  const [selectedHandSkeleton, setSelectedHandSkeleton] = useState('all-fingers');

  const handleSkeletonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skeletonType = e.target.value;
    setSelectedSkeleton(skeletonType);
    if (onSkeletonSelect) {
      onSkeletonSelect(skeletonType);
    }
  };

  const handleHandSkeletonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const handType = e.target.value;
    setSelectedHandSkeleton(handType);
    if (onHandSkeletonSelect) {
      onHandSkeletonSelect(handType);
    }
  };

  return (
    <div id="load-skeleton-tools">
      <span>
        <span style={{ maxWidth: '220px' }}>
          Rotate Model to face front <br /> (blue origin line)
        </span>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <button 
            className="secondary-button" 
            id="rotate-model-x-button"
            onClick={() => onRotateModel?.('x')}
          >
            X
          </button>
          <button 
            className="secondary-button" 
            id="rotate-model-y-button"
            onClick={() => onRotateModel?.('y')}
          >
            Y
          </button>
          <button 
            className="secondary-button" 
            id="rotate-model-z-button"
            onClick={() => onRotateModel?.('z')}
          >
            Z
          </button>
        </div>
      </span>

      <hr />

      <span style={{ maxWidth: '220px' }}>
        <span>If model is below the ground floor</span>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <button 
            className="secondary-button" 
            id="move-model-to-floor-button"
            onClick={onMoveToFloor}
          >
            Move
          </button>
        </div>
      </span>

      <hr />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <span>Skeleton template:</span>
        <select 
          id="skeleton-selection"
          value={selectedSkeleton}
          onChange={handleSkeletonChange}
        >
          <option value="human">Human</option>
          <option value="quadraped">4 Leg Creature</option>
          <option value="bird">Bird</option>
        </select>
      </div>

      {showHandOptions && selectedSkeleton === 'human' && (
        <div id="hand-skeleton-options" className="alternate-background-section">
          <span>
            Hand Options:
            <div className="tooltip" style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span>
              <span className="tooltiptext">
                Variations on which finger bones you want to keep. Single Hand Bone removes all fingers and keeps only the hand bone.
              </span>
            </div>
          </span>

          <select 
            id="hand-skeleton-selection"
            value={selectedHandSkeleton}
            onChange={handleHandSkeletonChange}
          >
            <option value="all-fingers">All Fingers</option>
            <option value="thumb-and-index">Thumb + Main Finger</option>
            <option value="simplified-hand">All Fingers - Simplified</option>
            <option value="single-bone">Single Hand Bone</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          className="secondary-button" 
          id="action_back_to_load_model"
          onClick={onBackToLoadModel}
        >
          &#x2039; Back
        </button>
        <button 
          id="load-skeleton-button"
          onClick={onLoadSkeleton}
        >
          Load Skeleton &nbsp;&#x203a;
        </button>
      </div>
    </div>
  );
};
