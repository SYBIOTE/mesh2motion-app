import React from 'react';

interface ThemeToggleProps {
  onToggle?: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ onToggle, className }) => {
  return (
    <div id="theme-toggle-container" className={className}>
      <button id="theme-toggle" onClick={onToggle}>
        <span className="theme-icon"></span>
      </button>
    </div>
  );
};
