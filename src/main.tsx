import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import { Bootstrap } from './script';

// Import CSS files
import './styles.css';
import './radio-button-group.css';
import './animation-player.css';

// Create Bootstrap instance (the 3D engine)
const bootstrap = new Bootstrap();

// Initialize the 3D engine
bootstrap.initialize();

// Render React app
const container = document.createElement('div');
container.id = 'react-root';
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App bootstrap={bootstrap} />);

// Export bootstrap instance for global access if needed
(window as any).bootstrap = bootstrap;
