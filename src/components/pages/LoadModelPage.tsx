import React, { useState } from 'react';

interface LoadModelPageProps {
  onModelUpload?: (file: File) => void;
  onModelSelect?: (modelPath: string) => void;
  onLoadModel?: () => void;
  debugMode?: boolean;
  onDebugToggle?: (debug: boolean) => void;
}

export const LoadModelPage: React.FC<LoadModelPageProps> = ({
  onModelUpload,
  onModelSelect,
  onLoadModel,
  debugMode = false,
  onDebugToggle
}) => {
  const [selectedModel, setSelectedModel] = useState('models/human-mannequin.glb');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onModelUpload) {
      onModelUpload(file);
    }
  };

  const handleModelSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelPath = e.target.value;
    setSelectedModel(modelPath);
    if (onModelSelect) {
      onModelSelect(modelPath);
    }
  };

  const handleDebugToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const debug = e.target.checked;
    if (onDebugToggle) {
      onDebugToggle(debug);
    }
  };

  return (
    <div id="load-model-tools">
      <label htmlFor="model-upload" className="button">
        <span className="button-icon-group">
          <span className="material-symbols-outlined">upload</span>
          <span>Upload</span>
        </span>
      </label>
      <input 
        id="model-upload" 
        type="file" 
        name="file-upload" 
        accept=".glb, .gltf, .fbx, .vrm"
        onChange={handleFileUpload}
      />

      <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>or</div>
      
      <div className="alternate-background-section">
        <p style={{ margin: 0 }}>Reference model:</p>
        <select 
          id="model-selection" 
          value={selectedModel}
          onChange={handleModelSelection}
        >
          <option value="models/human-mannequin.glb">Human</option>
          <option value="models/fox.glb">Fox</option>
          <option value="models/seagull.glb">Bird</option>
        </select>
        <button id="load-model-button" onClick={onLoadModel}>Load</button>
      </div>

      <div className="styled-checkbox">
        <input 
          type="checkbox" 
          id="load-model-debug-checkbox" 
          name="load-model-debug-checkbox"
          checked={debugMode}
          onChange={handleDebugToggle}
        />
        <label htmlFor="load-model-debug-checkbox">Debug</label>

        <div className="tooltip">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span>
          <span className="tooltiptext">
            Replaces all materials with a 'normal' shader for debugging
          </span>
        </div>
      </div>
    </div>
  );
};
