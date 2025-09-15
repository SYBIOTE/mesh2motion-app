import React from 'react';

interface UndoRedoControlsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className
}) => {
  return (
    <fieldset className={className} style={{ position: 'fixed', right: '240px', top: '20px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        <button 
          id="undo-button" 
          className="secondary-button" 
          title="Undo (Ctrl+Z)" 
          disabled={!canUndo}
          onClick={onUndo}
        >
          <img src="images/icons/undo.png" alt="Undo" width="16" height="16" />
        </button>
        
        <button 
          id="redo-button" 
          className="secondary-button" 
          title="Redo (Ctrl+Y)" 
          disabled={!canRedo}
          onClick={onRedo}
        >
          <img src="images/icons/redo.png" alt="Redo" width="16" height="16" />
        </button>
      </div>
    </fieldset>
  );
};
