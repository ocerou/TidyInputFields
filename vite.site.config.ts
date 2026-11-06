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
      'tidyinputfields/css': fileURLToPath(new URL('./src/styles/index.css', import.meta.url)),
      tidyinputfields: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5181, strictPort: true },
  build: { outDir: '../site-dist', emptyOutDir: true },
})
