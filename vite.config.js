const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

// allows us to use external shaders files to be imported into our materials
import glsl from 'vite-plugin-glsl'

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server:
    {
        host: true,
        open: false
    },
    build:
    {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    },
    plugins:
    [
        glsl()
    ]
}