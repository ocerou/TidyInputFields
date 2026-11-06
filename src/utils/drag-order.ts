// État d'un glisser-déposer qui réordonne une liste (repris de MyCRM, dragOrder.ts, sans React) : l'élément glissé,
// celui survolé, et le côté où l'élément glissé sera déposé — avant le survolé en montant, après lui en descendant.
export class DragOrder {
  dragging: string | null = null
  target: string | null = null
  readonly #keys: () => string[]

  /** `keys` rend l'ordre affiché au moment de la question. */
  constructor(keys: () => string[]) {
    this.#keys = keys
  }

  start(key: string): void {
    this.dragging = key
    this.target = null
  }

  over(key: string): void {
    this.target = key
  }

  end(): void {
    this.dragging = null
    this.target = null
  }

  /** Côté du dépôt sur l'élément `key`, ou null s'il n'est pas la cible. */
  side(key: string): 'before' | 'after' | null {
    if (!this.dragging || this.target !== key || this.dragging === key) {
      return null
    }
    const keys = this.#keys()
    return keys.indexOf(this.dragging) > keys.indexOf(key) ? 'before' : 'after'
  }

  /** Classes de l'élément : glissé (`tif-dragging`), emplacement du dépôt (`tif-drop-before` / `tif-drop-after`). */
  classes(key: string): string[] {
    const side = this.side(key)
    return [this.dragging === key ? 'tif-dragging' : '', side ? `tif-drop-${side}` : ''].filter(Boolean)
  }

  /** Nouvel ordre une fois l'élément glissé déposé sur la cible (null s'il n'y a rien à déplacer). */
  result(): string[] | null {
    if (!this.dragging || !this.target || this.dragging === this.target) {
      return null
    }
    const side = this.side(this.target)
    const keys = this.#keys().filter((k) => k !== this.dragging)
    const index = keys.indexOf(this.target)
    keys.splice(side === 'before' ? index : index + 1, 0, this.dragging)
    return keys
  }
}
