import React, { useState } from 'react';

interface AnimationPlayerProps {
  currentAnimation?: string;
  currentTime?: string;
  totalTime?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onScrub?: (value: number) => void;
  className?: string;
}

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  currentAnimation = 'No animation selected',
  currentTime = '0f',
  totalTime = '0f',
  isPlaying = false,
  onPlayPause,
  onScrub,
  className
}) => {
  const [scrubberValue, setScrubberValue] = useState(0);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setScrubberValue(value);
    onScrub?.(value);
  };

  return (
    <div id="animation-player" className={className}>
      <div id="current-animation-container">
        <span id="current-animation-name">{currentAnimation}</span>
      </div>
      
      <div id="play-controls">
        <button 
          id="play-pause-button" 
          className="animation-control-button" 
          disabled={currentAnimation === 'No animation selected'}
          onClick={onPlayPause}
        >
          <span className="material-symbols-outlined">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        
        <span>
          <span id="current-time">{currentTime}</span> / 
          <span id="total-time">{totalTime}</span>
        </span>
        
        <input 
          type="range" 
          id="animation-scrubber" 
          min="0" 
          max="100" 
          value={scrubberValue}
          disabled={currentAnimation === 'No animation selected'}
          onChange={handleScrubberChange}
        />
      </div>
    </div>
  );
};
