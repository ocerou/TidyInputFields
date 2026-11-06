import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Site de documentation (dossier site) : `npm run docs` en développement (http://localhost:5181),
// `npm run docs:build` pour le publier. La version construite tient dans un seul fichier, site-dist/index.html,
// scripts et styles intégrés : elle s'ouvre par double-clic (file://, où les modules séparés sont refusés) comme
// sur GitHub Pages. Les exemples importent 'tidyinputfields' comme un utilisateur ; ici, l'import vise les sources.
export default defineConfig({
  root: 'site',
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      // Du plus précis au plus général : 'tidyinputfields' seul viserait aussi 'tidyinputfields/react'.
      'tidyinputfields/react': fileURLToPath(new URL('./src/react/index.ts', import.meta.url)),
      'tidyinputfields/css': fileURLToPath(new URL('./src/styles/index.css', import.meta.url)),
      tidyinputfields: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5181, strictPort: true },
  // Cache propre au site : le catalogue de test tourne en même temps pendant les tests.
  cacheDir: fileURLToPath(new URL('./node_modules/.vite-site', import.meta.url)),
  optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'prismjs'] },
  build: { outDir: '../site-dist', emptyOutDir: true },
})
