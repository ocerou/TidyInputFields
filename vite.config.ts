import { defineConfig } from 'vite'

// En développement (`npm run dev`) : le catalogue de démo (dossier demo). En construction : la librairie, en module ES
// et en script classique (global `Tif`), plus la feuille de style.
export default defineConfig(({ command }) =>
  command === 'serve'
    ? { root: 'demo', server: { port: 5180, strictPort: true } }
    : {
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          sourcemap: true,
          lib: {
            entry: 'src/index.ts',
            name: 'Tif',
            formats: ['es', 'iife'],
            fileName: (format) => (format === 'es' ? 'tidyinputfields.js' : 'tidyinputfields.min.js'),
            cssFileName: 'tidyinputfields',
          },
        },
      },
)
