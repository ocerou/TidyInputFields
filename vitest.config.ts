import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // L'éditeur riche importe la librairie comme un utilisateur : l'import vise les sources.
      'tidyinputfields/rich-text': fileURLToPath(new URL('./src/rich-text/index.ts', import.meta.url)),
      tidyinputfields: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    // tippy.js (barre de sélection de Tiptap) n'a pas d'export par défaut une fois chargé tel quel par Node.
    server: { deps: { inline: [/@tiptap/, 'tippy.js'] } },
  },
})
