// Panneaux flottants (calendrier, liste de choix, nuancier…) : un seul service au lieu du code recopié dans chaque
// composant de MyCRM. Le panneau est placé à l'écran sous le champ, ou au-dessus s'il manque de place, recalé pour ne
// jamais sortir de la fenêtre ; il se ferme au clic dehors, au défilement de la page et avec Échap.
import { isRtl } from './dom.ts'

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
export type CloseReason = 'outside' | 'scroll' | 'escape' | 'api'

type Box = { top: number; left: number; right: number; bottom: number; width: number; height: number }
type Size = { width: number; height: number }

/**
 * Position du panneau (coordonnées de la fenêtre) : du côté demandé s'il y tient ou s'il y a plus de place que de
 * l'autre, aligné sur le début ou la fin du champ, recalé pour rester dans la fenêtre à `margin` des bords.
 */
export function computePosition(
  anchor: Box,
  panel: Size,
  viewport: Size,
  placement: Placement = 'bottom-start',
  gap = 4,
  margin = 8,
): { top: number; left: number; placement: Placement } {
  const [side, align] = placement.split('-') as ['bottom' | 'top', 'start' | 'end']
  const below = viewport.height - anchor.bottom - gap - margin
  const above = anchor.top - gap - margin
  const fits = side === 'bottom' ? panel.height <= below : panel.height <= above
  const finalSide = fits ? side : side === 'bottom' ? (above > below ? 'top' : 'bottom') : below > above ? 'bottom' : 'top'
  const top = finalSide === 'bottom' ? anchor.bottom + gap : anchor.top - gap - panel.height
  let left = align === 'start' ? anchor.left : anchor.right - panel.width
  left = Math.max(margin, Math.min(left, viewport.width - margin - panel.width))
  return { top: Math.max(margin, top), left, placement: `${finalSide}-${align}` }
}

/**
 * Où accrocher un panneau ouvert depuis `anchor` : dans la fenêtre modale qui le contient (<dialog> ouvert, modale ou
 * volet de Bootstrap, élément marqué data-tif-container), sinon dans le corps de la page. Hors de la modale, le piège à
 * focus de Bootstrap lui retirerait le clavier.
 */
export function containerFor(anchor: Element): HTMLElement {
  return anchor.closest<HTMLElement>('[data-tif-container], dialog[open], .modal.show, .offcanvas.show') ?? document.body
}

export interface FloatingOptions {
  placement?: Placement
  /** Le panneau prend au moins la largeur du champ. */
  matchWidth?: boolean
  /** Appelé à la fermeture, quelle qu'en soit la raison. */
  onClose?: (reason: CloseReason) => void
  /** Élément qui reprend le focus quand Échap ferme le panneau (par défaut le champ d'ancrage). */
  returnFocus?: HTMLElement
  /** Échap pressé : rend true si le panneau l'a traité lui-même (retour à un écran précédent) et doit rester ouvert. */
  onEscape?: () => boolean
}

/** Panneaux ouverts, du plus ancien au plus récent : Échap ne ferme que le dernier. */
const stack: Floating[] = []

/** Un panneau flottant rattaché à un champ. */
export class Floating {
  readonly anchor: HTMLElement
  readonly panel: HTMLElement
  readonly #options: FloatingOptions
  #open = false
  #anchorAt: { top: number; left: number } | null = null
  #listeners: AbortController | null = null

  constructor(anchor: HTMLElement, panel: HTMLElement, options: FloatingOptions = {}) {
    this.anchor = anchor
    this.panel = panel
    this.#options = options
    panel.classList.add('tif-panel')
  }

  get isOpen(): boolean {
    return this.#open
  }

  /** Accroche le panneau, le place et commence à surveiller clic dehors, défilement et Échap. */
  open(): void {
    if (this.#open) {
      return
    }
    this.#open = true
    stack.push(this)
    containerFor(this.anchor).append(this.panel)
    this.position()
    const listeners = new AbortController()
    this.#listeners = listeners
    const signal = listeners.signal
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!this.owns(event.target as Node)) {
          this.close('outside')
        }
      },
      { capture: true, signal },
    )
    window.addEventListener(
      'scroll',
      (event) => {
        // Seul un défilement qui a réellement déplacé le champ ferme le panneau : un événement en retard (défilement
        // fait juste avant l'ouverture, pour amener le champ à l'écran) ne compte pas.
        if (!(event.target instanceof Node && this.owns(event.target)) && this.#anchorMoved()) {
          this.close('scroll')
        }
      },
      { capture: true, signal },
    )
    window.addEventListener('resize', () => this.position(), { signal })
    document.addEventListener(
      'keydown',
      (event) => {
        // Seul le panneau le plus récent répond (un calendrier ouvert dans un autre panneau se ferme seul).
        if (event.key === 'Escape' && stack[stack.length - 1] === this) {
          // Échap ferme le panneau, pas la fenêtre modale qui le contient.
          event.stopPropagation()
          event.preventDefault()
          if (!this.#options.onEscape?.()) {
            this.close('escape')
          }
        }
      },
      { capture: true, signal },
    )
  }

  /** Recalcule la position (après un changement de contenu, par exemple). */
  position(): void {
    if (!this.#open) {
      return
    }
    const anchor = this.anchor.getBoundingClientRect()
    this.#anchorAt = { top: anchor.top, left: anchor.left }
    if (this.#options.matchWidth) {
      this.panel.style.minWidth = `${anchor.width}px`
    }
    const rtl = isRtl(this.anchor)
    let placement = this.#options.placement ?? 'bottom-start'
    if (rtl) {
      placement = placement.replace(/start|end/, (s) => (s === 'start' ? 'end' : 'start')) as Placement
    }
    const size = this.panel.getBoundingClientRect()
    const { top, left, placement: final } = computePosition(anchor, size, { width: window.innerWidth, height: window.innerHeight }, placement)
    this.panel.style.top = `${top}px`
    this.panel.style.left = `${left}px`
    this.panel.dataset.placement = final
  }

  /** Le champ a bougé à l'écran depuis le dernier placement. */
  #anchorMoved(): boolean {
    const now = this.anchor.getBoundingClientRect()
    return !this.#anchorAt || Math.abs(now.top - this.#anchorAt.top) > 1 || Math.abs(now.left - this.#anchorAt.left) > 1
  }

  /**
   * Le nœud fait partie du panneau : le panneau lui-même, son champ, ou un panneau ouvert depuis l'intérieur (le
   * calendrier d'une zone de date posée dans le panneau, par exemple).
   */
  owns(node: Node | null): boolean {
    if (!node) {
      return false
    }
    return this.panel.contains(node) || this.anchor.contains(node) || this.#children().some((child) => child.owns(node))
  }

  /** Panneaux ouverts depuis l'intérieur de celui-ci. */
  #children(): Floating[] {
    return stack.filter((f) => f !== this && this.panel.contains(f.anchor))
  }

  /** Ferme le panneau (et ceux ouverts depuis l'intérieur) ; Échap rend le focus au champ. */
  close(reason: CloseReason = 'api'): void {
    if (!this.#open) {
      return
    }
    for (const child of this.#children()) {
      child.close('api')
    }
    this.#open = false
    this.#forget()
    this.panel.remove()
    if (reason === 'escape') {
      ;(this.#options.returnFocus ?? this.anchor).focus()
    }
    this.#options.onClose?.(reason)
  }

  #forget(): void {
    this.#listeners?.abort()
    this.#listeners = null
    const index = stack.indexOf(this)
    if (index >= 0) {
      stack.splice(index, 1)
    }
  }

  /** Ferme sans rappeler onClose et oublie le panneau. */
  dispose(): void {
    for (const child of this.#children()) {
      child.dispose()
    }
    this.#forget()
    this.#open = false
    this.panel.remove()
  }
}
