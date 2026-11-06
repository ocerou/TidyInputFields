import { defineConfig } from 'vite'

// Point d'entrée tidyinputfields/react (dist/react.js). React et la librairie restent externes : ce module ne les
// recopie pas, il les importe (React chez l'utilisateur, 'tidyinputfields' depuis le paquet lui-même).
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: 'src/react/index.ts',
      formats: ['es'],
      fileName: () => 'react.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^tidyinputfields/],
    },
  },
})
