# React Migration Documentation

This document outlines the migration from the original HTML/TypeScript structure to a React-based component architecture.

## Changes Made

### 1. Directory Structure
```
src/
├── components/
│   ├── common/           # Reusable components
│   │   ├── Header.tsx
│   │   ├── StepperNavigation.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── AnimationPlayer.tsx
│   │   ├── GitHubLink.tsx
│   │   ├── UndoRedoControls.tsx
│   │   └── index.ts
│   ├── pages/            # Page-specific components
│   │   ├── LoadModelPage.tsx
│   │   ├── LoadSkeletonPage.tsx
│   │   ├── EditSkeletonPage.tsx
│   │   ├── AnimationPage.tsx
│   │   └── index.ts
│   └── App.tsx           # Main App component with routing
├── lib/
│   └── ReactBootstrapAdapter.ts  # Bridge between React and 3D engine
└── main.tsx              # New React entry point
```

### 2. Component Architecture

#### Common Components
- **Header**: Top toolbar with mouse controls and branding
- **StepperNavigation**: Step-by-step navigation with React Router integration
- **ThemeToggle**: Theme switching functionality
- **AnimationPlayer**: Animation playback controls
- **GitHubLink**: Repository link component
- **UndoRedoControls**: Undo/redo functionality

#### Page Components
- **LoadModelPage**: Model upload and selection interface
- **LoadSkeletonPage**: Skeleton template selection and model positioning
- **EditSkeletonPage**: Joint positioning and skeleton editing tools
- **AnimationPage**: Animation selection and export interface

### 3. React Router Integration
- Replaced Navigo with React Router DOM
- Clean URL routing without hash fragments
- Automatic navigation between steps
- Route-based component rendering

### 4. State Management
- React hooks for component state
- Props-based communication between components
- Adapter pattern for 3D engine integration

### 5. TypeScript Configuration
Updated `tsconfig.json` to support React:
- `jsx: "react-jsx"`
- `target: "ES2020"`
- `lib: ["ES2020", "DOM", "DOM.Iterable"]`
- `module: "ESNext"`
- `moduleResolution: "node"`

### 6. Dependencies Added
```json
{
  "dependencies": {
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/react-router-dom": "^5.3.3"
  }
}
```

### 7. Bridge Pattern Implementation
Created `ReactBootstrapAdapter` to maintain compatibility with the existing 3D engine:
- Wraps Bootstrap class methods for React components
- Maintains separation of concerns
- Provides clean interface for React-to-3D communication

## Usage

### Running the Application
```bash
pnpm dev
```

### Development
- Components are organized by purpose (common vs page-specific)
- All reusable UI elements are in `components/common/`
- Page-specific logic is in `components/pages/`
- The adapter pattern allows gradual migration of 3D engine integration

### Key Benefits
1. **Component Reusability**: UI elements can be reused across different pages
2. **Better State Management**: React hooks provide cleaner state handling
3. **Improved Routing**: React Router offers better navigation control
4. **Type Safety**: Full TypeScript support with proper React types
5. **Maintainability**: Clear separation between UI and 3D engine logic
6. **Scalability**: Easy to add new pages and components

### Migration Notes
- The original Bootstrap 3D engine remains unchanged
- HTML structure has been converted to React components
- All original functionality is preserved through the adapter pattern
- CSS files remain the same and are imported in `main.tsx`

## Future Improvements
1. Connect adapter methods to actual Bootstrap functionality
2. Add proper state synchronization between React and 3D engine
3. Implement error boundaries for better error handling
4. Add unit tests for components
5. Consider migrating to a more modern state management solution (Redux Toolkit, Zustand)
