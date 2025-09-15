import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Step {
  id: string;
  label: string;
  path: string;
  dataStep: string;
}

const steps: Step[] = [
  { id: 'stepper-load-model', label: 'Load Model', path: '/load-model', dataStep: 'load-model' },
  { id: 'stepper-load-skeleton', label: 'Load Skeleton', path: '/load-skeleton', dataStep: 'load-skeleton' },
  { id: 'stepper-edit', label: 'Position Joints', path: '/edit', dataStep: 'edit' },
  { id: 'stepper-animate', label: 'Animate', path: '/animate', dataStep: 'animate' },
  { id: 'stepper-export', label: 'Export', path: '/export', dataStep: 'export' },
];

export const StepperNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleStepClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav id="stepper" className="glass">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            id={step.id}
            data-step={step.dataStep}
            className={`step ${location.pathname === step.path ? 'active' : ''}`}
            onClick={() => handleStepClick(step.path)}
          >
            {step.label}
          </button>
          {index < steps.length - 1 && <span className="step-sep">›</span>}
        </React.Fragment>
      ))}
    </nav>
  );
};
