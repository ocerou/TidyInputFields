// Initialisation par attributs : <input data-tif="date"> devient un composant date, comme les data-bs-* de Bootstrap.
// init() passe une fois sur la page ; observe() suit aussi les éléments ajoutés et retirés après coup (fenêtres,
// lignes de tableau, HTMX, Turbo…).
import { instancesOf, type Component } from './component.ts'
import { isBrowser, onReady } from './dom.ts'
import { componentOf } from './registry.ts'

const SELECTOR = '[data-tif]'

function targets(root: ParentNode): HTMLElement[] {
  const found = [...root.querySelectorAll<HTMLElement>(SELECTOR)]
  return root instanceof HTMLElement && root.matches(SELECTOR) ? [root, ...found] : found
}

/** Crée les composants des éléments marqués data-tif sous `root` (sans recréer ceux qui existent). */
export function init(root: ParentNode = document): Component[] {
  const created: Component[] = []
  for (const element of targets(root)) {
    for (const name of (element.getAttribute('data-tif') ?? '').split(/\s+/).filter(Boolean)) {
      const type = componentOf(name)
      if (type) {
        created.push(type.getOrCreateInstance(element))
      } else {
        console.warn(`TidyInputFields: unknown component "${name}"`, element)
      }
    }
  }
  return created
}

/** Libère tous les composants posés sur `root` et ses descendants. */
export function dispose(root: ParentNode): void {
  const elements = [...(root instanceof Element ? [root] : []), ...root.querySelectorAll('*')]
  for (const element of elements) {
    for (const instance of instancesOf(element)) {
      instance.dispose()
    }
  }
}

/**
 * Suit `root` : initialise les éléments data-tif ajoutés, libère les composants des éléments retirés (sauf s'ils
 * reviennent aussitôt, déplacés). Rend la fonction qui arrête le suivi.
 */
export function observe(root: Node = document.body): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          init(node)
        }
      }
      for (const node of mutation.removedNodes) {
        if (node instanceof Element) {
          queueMicrotask(() => {
            if (!node.isConnected) {
              dispose(node)
            }
          })
        }
      }
    }
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/** Initialisation automatique au chargement, sauf avec <html data-tif-auto="false">. */
export function autoInit(): void {
  if (!isBrowser) {
    return
  }
  onReady(() => {
    if (document.documentElement.getAttribute('data-tif-auto') !== 'false') {
      init()
    }
  })
}
