import { defineConfig } from 'vite'

// Sous-chemin tidyinputfields/rich-text : l'éditeur riche, Tiptap compris (l'utilisateur n'installe rien d'autre).
// La librairie reste externe : le module l'importe ('tidyinputfields'), le script classique lit l'objet global Tif.
// Les licences des dépendances embarquées (toutes MIT) sont écrites à côté, dans rich-text.licenses.md.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    license: { fileName: 'rich-text.licenses.md' },
    lib: {
      entry: 'src/rich-text/index.ts',
      name: 'TifRichText',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'rich-text.js' : 'rich-text.min.js'),
      cssFileName: 'rich-text',
    },
    rollupOptions: {
      external: [/^tidyinputfields/],
      output: { globals: { tidyinputfields: 'Tif' } },
    },
  },
})
