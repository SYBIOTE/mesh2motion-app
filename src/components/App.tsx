import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Header, 
  StepperNavigation, 
  ThemeToggle, 
  AnimationPlayer, 
  GitHubLink 
} from './common';
import { 
  LoadModelPage, 
  LoadSkeletonPage, 
  EditSkeletonPage, 
  AnimationPage 
} from './pages';
import { ReactBootstrapAdapter } from '../lib/ReactBootstrapAdapter';
import type { Bootstrap } from '../script';

interface AppProps {
  bootstrap: Bootstrap;
}

export const App: React.FC<AppProps> = ({ bootstrap }) => {
  // Create adapter for React-Bootstrap communication
  const adapter = new ReactBootstrapAdapter(bootstrap);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  
  // Animation player state
  const [currentAnimation, setCurrentAnimation] = useState('No animation selected');
  const [currentTime, setCurrentTime] = useState('0f');
  const [totalTime, setTotalTime] = useState('0f');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Current step state for UI visibility
  const [currentStep, setCurrentStep] = useState('Load Model');
  const [stepIndex, setStepIndex] = useState('1');

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    adapter.toggleTheme();
  };

  // Animation player handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Connect to Bootstrap animation system
  };

  const handleScrub = (value: number) => {
    // TODO: Connect to Bootstrap animation system
    console.log('Scrub to:', value);
  };

  // Update step info based on current route
  useEffect(() => {
    const path = window.location.pathname;
    switch (path) {
      case '/load-model':
        setCurrentStep('Load Model');
        setStepIndex('1');
        break;
      case '/load-skeleton':
        setCurrentStep('Load Skeleton');
        setStepIndex('2');
        break;
      case '/edit':
        setCurrentStep('Position Joints');
        setStepIndex('3');
        break;
      case '/animate':
        setCurrentStep('Animate');
        setStepIndex('4');
        break;
      case '/export':
        setCurrentStep('Export');
        setStepIndex('5');
        break;
      default:
        setCurrentStep('Load Model');
        setStepIndex('1');
    }
  }, []);

  return (
    <Router>
      <div className="app">
        <Header />
        <StepperNavigation />
        <ThemeToggle onToggle={handleThemeToggle} />
        
        <div id="tool-panel">
          <div id="tool-selection-group">
            <div style={{ marginBottom: '1rem', padding: 0 }}>
              <div id="current-step-index">{stepIndex}</div>
              <div id="current-step-label">{currentStep}</div>
            </div>

            <Routes>
              <Route path="/load-model" element={
                <LoadModelPage 
                  onModelUpload={adapter.uploadModel.bind(adapter)}
                  onModelSelect={adapter.selectModel.bind(adapter)}
                  onLoadModel={adapter.loadModel.bind(adapter)}
                  onDebugToggle={adapter.toggleDebugMode.bind(adapter)}
                />
              } />
              
              <Route path="/load-skeleton" element={
                <LoadSkeletonPage 
                  onRotateModel={adapter.rotateModel.bind(adapter)}
                  onMoveToFloor={adapter.moveModelToFloor.bind(adapter)}
                  onSkeletonSelect={adapter.selectSkeleton.bind(adapter)}
                  onHandSkeletonSelect={adapter.selectHandSkeleton.bind(adapter)}
                  onLoadSkeleton={adapter.loadSkeleton.bind(adapter)}
                />
              } />
              
              <Route path="/edit" element={
                <EditSkeletonPage 
                  selectedBone={adapter.getSelectedBone()}
                  onUndo={adapter.undo.bind(adapter)}
                  onRedo={adapter.redo.bind(adapter)}
                  canUndo={adapter.canUndo()}
                  canRedo={adapter.canRedo()}
                  onPreviewChange={adapter.changePreview.bind(adapter)}
                  onTransformChange={adapter.changeTransform.bind(adapter)}
                  onMirrorToggle={adapter.toggleMirror.bind(adapter)}
                  onScaleSkeleton={adapter.scaleSkeleton.bind(adapter)}
                  onBindPose={adapter.bindPose.bind(adapter)}
                />
              } />
              
              <Route path="/animate" element={
                <AnimationPage 
                  animations={[]}
                  onAnimationToggle={adapter.toggleAnimation.bind(adapter)}
                  onFilterChange={adapter.filterAnimations.bind(adapter)}
                  onArmExtend={adapter.extendArms.bind(adapter)}
                  onShowSkeletonToggle={adapter.toggleSkeletonVisibility.bind(adapter)}
                  onExportFormatChange={adapter.changeExportFormat.bind(adapter)}
                  onExport={adapter.exportAnimations.bind(adapter)}
                />
              } />
              
              <Route path="/export" element={<Navigate to="/animate" replace />} />
              <Route path="/" element={<Navigate to="/load-model" replace />} />
            </Routes>
          </div>
        </div>

        <AnimationPlayer
          currentAnimation={currentAnimation}
          currentTime={currentTime}
          totalTime={totalTime}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onScrub={handleScrub}
        />

        <GitHubLink />
        
        {/* 3D view control hitbox */}
        <div id="view-control-hitbox"></div>
      </div>
    </Router>
  );
};
