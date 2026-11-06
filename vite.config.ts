import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// En développement (`npm run dev`) : le catalogue de démo (dossier demo). En construction : la librairie, en module ES
// et en script classique (global `Tif`), plus la feuille de style.
export default defineConfig(({ command }) =>
  command === 'serve'
    ? {
        root: 'demo',
        server: { port: 5180, strictPort: true },
        // Cache propre au catalogue (le site de documentation tourne en même temps pendant les tests) et
        // dépendances de la page Bootstrap déclarées d'avance : pas de rechargement en cours de test.
        cacheDir: fileURLToPath(new URL('./node_modules/.vite-demo', import.meta.url)),
        optimizeDeps: { include: ['jquery', 'bootstrap/dist/js/bootstrap.bundle.min.js'] },
      }
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
