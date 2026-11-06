import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Site de documentation (dossier site) : `npm run docs` en développement, `npm run docs:build` pour le publier
// (site-dist, chemins relatifs : il s'ouvre aussi bien sur GitHub Pages que depuis un dossier).
// Les exemples importent 'tidyinputfields' comme un utilisateur ; ici, l'import vise les sources.
export default defineConfig({
  root: 'site',
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      'tidyinputfields/css': fileURLToPath(new URL('./src/styles/index.css', import.meta.url)),
      tidyinputfields: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5181, strictPort: true },
  build: { outDir: '../site-dist', emptyOutDir: true },
})
