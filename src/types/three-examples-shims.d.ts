// Shims to help TypeScript resolve example modules with .js suffix
// Three.js ships typings, but some TS configs fail to map .js subpaths.

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  export * from 'three/examples/jsm/loaders/GLTFLoader'
  export { GLTFLoader as default } from 'three/examples/jsm/loaders/GLTFLoader'
}

declare module 'three/examples/jsm/loaders/FBXLoader.js' {
  export * from 'three/examples/jsm/loaders/FBXLoader'
  export { FBXLoader as default } from 'three/examples/jsm/loaders/FBXLoader'
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  export * from 'three/examples/jsm/controls/OrbitControls'
  export { OrbitControls as default } from 'three/examples/jsm/controls/OrbitControls'
}

declare module 'three/examples/jsm/controls/TransformControls.js' {
  export * from 'three/examples/jsm/controls/TransformControls'
  export { TransformControls as default } from 'three/examples/jsm/controls/TransformControls'
}

declare module 'three/examples/jsm/exporters/GLTFExporter.js' {
  export * from 'three/examples/jsm/exporters/GLTFExporter'
  export { GLTFExporter as default } from 'three/examples/jsm/exporters/GLTFExporter'
}


