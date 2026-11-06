// Liste de choix avec recherche (repris de MyCRM, InputSearchSelect) : au repos, une liste déroulante ; ouverte, une
// recherche en tête qui filtre les options en texte plein (chaque mot tapé doit se trouver dans le libellé, dans
// n'importe quel ordre, sans accents ni majuscules), mots trouvés surlignés. Clavier : ↑ ↓, Entrée, Échap ; une lettre
// tapée sur la liste fermée l'ouvre et commence la recherche.
//
// Options fixes (option `options`, ou <option> écrites dans la balise ou le <select> habillé), ou lues à chaque frappe
// par une fonction `source` (liste trop longue pour être chargée : les 20 premiers résultats, « préciser la recherche »
// au-delà). Options regroupées sous des intitulés (`group`, ordre par `groupOrder`), pastilles (`pill`), inactives
// (`inactive` : masquées par défaut, interrupteur « Afficher les désactivés » en pied ; le choix courant reste proposé).
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { byGroup, highlight, matchesWords, wordsOf } from '../utils/search.ts'
import { dispatchChange } from './field.ts'
import { emptyLabelFromElements, footSwitch, ListSelect, optionsFromElements, pill, type ListOption } from './list.ts'

/** Source distante : options correspondant à la recherche ; `total` : nombre de résultats au-delà de ceux rendus. */
export type ListSource = (
  query: string,
  context: { onlyActive: boolean; limit: number; signal: AbortSignal },
) => Promise<{ options: ListOption[]; total?: number }>

export class TifSearchSelect extends ListSelect {
  static override NAME = 'search-select'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    options: [] as ListOption[],
    /** Libellé du choix vide (« — Aucun — ») ; absent, on ne peut pas vider la zone. */
    emptyLabel: '',
    /** Groupes présentés en premier, dans cet ordre. */
    groupOrder: [] as string[],
    /** Nombre d'options à partir duquel la recherche s'affiche (0 : toujours). */
    searchThreshold: 0,
    /** Zone obligatoire : orange tant qu'elle est vide. */
    required: false,
    /** Orange quoi qu'il en soit (obligatoire décidé par l'application). */
    missing: false,
    disabled: false,
    /** Nom lu par les lecteurs d'écran. */
    label: '',
    /** Texte du bouton sans choix (« — Choisir — » par défaut). */
    placeholder: '',
    quiet: false,
    /** Bouton « Nouveau » en pied : émet create.tif.search-select. */
    create: false,
    /** Lien du choix courant : modèle d'adresse où {value} est remplacé (« /accounts/{value} »). */
    link: '',
    /** Infobulle du lien (« Ouvrir le compte »). */
    linkTitle: '',
    /** Source distante (fonction, en JavaScript seulement). */
    source: null as ListSource | null,
    /** Libellé du choix courant pour une source distante (fonction, en JavaScript seulement). */
    sourceLabel: null as ((value: string) => Promise<string | null>) | null,
    /** Nombre de résultats demandés à la source. */
    limit: 20,
    /** Source distante : interrupteur en pied (« Clients actifs »), allumé par défaut, transmis à la source. */
    activeFilter: '',
  }

  /** Champ qui porte la valeur : le <select> habillé, ou un champ caché. */
  readonly holder: HTMLInputElement | HTMLSelectElement
  readonly #native: HTMLSelectElement | null
  readonly #anchor: HTMLAnchorElement
  #showInactive = false
  #onlyActive = true
  #remote: { options: ListOption[]; total: number } | null = null
  #currentLabel: string | null = null
  #request: AbortController | null = null
  #timer: ReturnType<typeof setTimeout> | undefined

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLSelectElement ? element : null
    this.#native = native
    // Une option vide écrite avec un libellé (« — Aucun — ») vaut emptyLabel.
    if (!this.options.emptyLabel) {
      this.options.emptyLabel = emptyLabelFromElements(element)
    }
    if (native) {
      if (!(this.options.options as ListOption[]).length) {
        this.options.options = optionsFromElements(native)
      }
      if (!this.options.value) {
        this.options.value = native.value
      }
      native.hidden = true
      this.holder = native
      native.after(this.button)
    } else {
      const written = optionsFromElements(element)
      if (written.length && !(this.options.options as ListOption[]).length) {
        this.options.options = written
      }
      for (const option of Array.from(element.querySelectorAll('option, optgroup'))) {
        option.remove()
      }
      this.holder = h('input', { type: 'hidden' })
      element.append(this.holder, this.button)
    }
    this.#anchor = h('a', { class: 'tif-select-link', hidden: true })
    this.button.after(this.#anchor)
    this.#apply(Object.keys(this.options))
  }

  /** Valeur choisie, '' sans choix. */
  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    this.#setValue(value == null ? '' : String(value))
  }

  #setValue(value: string): void {
    if (this.holder instanceof HTMLSelectElement && value && ![...this.holder.options].some((o) => o.value === value)) {
      this.holder.append(h('option', { value }, value))
    }
    this.holder.value = value
    this.#currentLabel = null
    this.#render()
    this.#loadLabel()
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name') && o.name) {
      this.holder.name = String(o.name)
    }
    if (keys.includes('options') && this.holder instanceof HTMLSelectElement && this.#native) {
      // Le <select> habillé garde des options à jour : le formulaire n'envoie qu'une valeur qu'il connaît.
      const kept = this.holder.value
      // Une option vide en tête : sans choix, le formulaire envoie '' (et non rien).
      this.holder.replaceChildren(h('option', { value: '' }), ...this.#all().map((x) => h('option', { value: x.value }, x.label)))
      this.holder.value = kept
    }
    if (keys.includes('value')) {
      this.#setValue(String(o.value ?? ''))
    }
    if (keys.includes('disabled')) {
      this.button.disabled = Boolean(o.disabled)
      this.holder.disabled = Boolean(o.disabled)
      if (o.disabled) {
        this.close()
      }
    }
    if (keys.includes('label')) {
      if (o.label) {
        this.button.setAttribute('aria-label', String(o.label))
      } else {
        this.button.removeAttribute('aria-label')
      }
    }
    if (keys.includes('quiet')) {
      this.button.classList.toggle('tif-quiet', Boolean(o.quiet))
    }
    this.#render()
  }

  #all(): ListOption[] {
    return (this.options.options as ListOption[] | null) ?? []
  }

  #source(): ListSource | null {
    return typeof this.options.source === 'function' ? (this.options.source as ListSource) : null
  }

  /** Option du choix courant (liste fixe) ou son libellé lu par la source. */
  #selected(): ListOption | undefined {
    const value = this.holder.value
    if (!value) {
      return undefined
    }
    if (this.#source()) {
      return this.#currentLabel !== null ? { value, label: this.#currentLabel } : undefined
    }
    return this.#all().find((x) => x.value === value)
  }

  #render(): void {
    const selected = this.#selected()
    const value = this.holder.value
    const text = selected?.label ?? (value ? value : String(this.options.emptyLabel || this.options.placeholder || t('search.choose')))
    this.setButtonLabel(text, !selected && !value)
    this.button.querySelector('.tif-pill')?.remove()
    if (selected?.pill) {
      this.button.append(pill(selected.pill))
    }
    const missing = Boolean(this.options.missing) || (Boolean(this.options.required) && !value)
    this.button.classList.toggle('tif-missing', missing)
    // Lien posé sur le libellé (un lien ne peut pas être dans le bouton) : le reste de la zone ouvre la liste.
    const link = String(this.options.link || '')
    this.#anchor.hidden = !(link && selected)
    if (link && selected) {
      this.#anchor.href = link.replace('{value}', encodeURIComponent(selected.value))
      this.#anchor.textContent = selected.label
      this.#anchor.title = String(this.options.linkTitle || '')
    }
    this.button.classList.toggle('tif-under-link', !this.#anchor.hidden)
  }

  /** Source distante : libellé du choix courant. */
  #loadLabel(): void {
    const value = this.holder.value
    const labelOf = this.options.sourceLabel as ((value: string) => Promise<string | null>) | null
    if (!value || !this.#source() || typeof labelOf !== 'function') {
      return
    }
    void labelOf(value).then((label) => {
      if (this.holder.value === value && !this.disposed) {
        this.#currentLabel = label ?? t('search.notFound')
        this.#render()
      }
    })
  }

  protected override localeChanged(): void {
    this.#render()
  }

  // --- Liste ---

  protected withSearch(): boolean {
    return Boolean(this.#source()) || this.#all().length >= Number(this.options.searchThreshold) || this.#all().some((x) => x.inactive)
  }

  #offered(): ListOption[] {
    const value = this.holder.value
    return this.#showInactive ? this.#all() : this.#all().filter((x) => !x.inactive || x.value === value)
  }

  protected matches(): ListOption[] {
    const words = wordsOf(this.search)
    const order = (this.options.groupOrder as string[]) ?? []
    const source = this.#source()
    const proposed = byGroup(source ? (this.#remote?.options ?? []) : this.#offered(), order)
    if (words.length) {
      // Avec une recherche, pas de choix vide ; une source distante a déjà filtré ses options.
      return source ? proposed : proposed.filter((x) => matchesWords(x.label, words))
    }
    return this.options.emptyLabel ? [{ value: '', label: String(this.options.emptyLabel) }, ...proposed] : proposed
  }

  protected override initialActive(): number {
    return this.matches().findIndex((x) => x.value === this.holder.value)
  }

  protected optionContent(option: ListOption, words: string[]) {
    const current = option.value === this.holder.value && option.value !== ''
    return [
      h('span', { class: 'tif-option-label' }, option.value === '' ? option.label : highlight(option.label, words)),
      option.inactive && h('span', { class: 'tif-option-note' }, t('search.inactive')),
      option.pill && pill(option.pill),
      current && icon('check'),
    ]
  }

  protected optionState(option: ListOption) {
    return {
      selected: option.value === this.holder.value,
      className: option.value === '' ? 'tif-option-empty' : option.inactive ? 'tif-option-inactive' : undefined,
    }
  }

  protected pick(option: ListOption): void {
    this.close()
    this.button.focus()
    if (option.value !== this.holder.value) {
      if (this.#source()) {
        this.#currentLabel = option.label
      }
      if (this.holder instanceof HTMLSelectElement && option.value && ![...this.holder.options].some((o) => o.value === option.value)) {
        this.holder.append(h('option', { value: option.value }, option.label))
      }
      this.holder.value = option.value
      this.#render()
      dispatchChange(this.holder)
    }
  }

  protected footer() {
    const source = this.#source()
    const withSearch = this.withSearch()
    const create = Boolean(this.options.create)
    if (!withSearch && !create) {
      return null
    }
    const words = wordsOf(this.search)
    const parts: (Node | string | false)[] = []
    if (withSearch) {
      if (source) {
        const remote = this.#remote
        parts.push(
          remote === null
            ? t('search.searching')
            : remote.total > remote.options.length
              ? t('search.firstOf', { shown: remote.options.length, total: remote.total })
              : t('search.results', { count: remote.total }),
        )
      } else {
        const offered = this.#offered().length
        parts.push(words.length ? t('search.matchesOf', { matches: this.matches().length, total: offered }) : t('search.choices', { count: offered }))
      }
    }
    if (source && this.options.activeFilter) {
      parts.push(
        footSwitch(String(this.options.activeFilter), this.#onlyActive, (checked) => {
          this.#onlyActive = checked
          this.active = 0
          this.#fetch(0)
        }),
      )
    }
    if (!source && this.#all().some((x) => x.inactive)) {
      parts.push(
        footSwitch(t('search.showInactive'), this.#showInactive, (checked) => {
          this.#showInactive = checked
          this.active = 0
          this.renderList()
        }),
      )
    }
    if (create) {
      const button = h('button', { type: 'button', class: 'tif-btn tif-btn-sm' }, icon('add'), t('search.new'))
      button.addEventListener('mousedown', (event) => event.preventDefault())
      button.addEventListener('click', () => {
        this.close()
        this.emit('create', { search: this.search })
      })
      parts.push(button)
    }
    return parts
  }

  protected override opening(): void {
    if (this.#source()) {
      this.#remote = null
      this.#fetch(0)
    }
  }

  protected override searchChanged(): void {
    if (this.#source()) {
      this.#fetch(200)
    }
  }

  protected override closed(): void {
    clearTimeout(this.#timer)
    this.#request?.abort()
  }

  /** Source distante : options correspondant à la recherche, un court instant après la frappe. */
  #fetch(delay: number): void {
    const source = this.#source()
    if (!source) {
      return
    }
    clearTimeout(this.#timer)
    this.#request?.abort()
    const request = new AbortController()
    this.#request = request
    this.#timer = setTimeout(() => {
      source(this.search.trim(), { onlyActive: this.#onlyActive, limit: Number(this.options.limit) || 20, signal: request.signal })
        .then((page) => {
          if (request.signal.aborted) {
            return
          }
          this.#remote = { options: page.options, total: page.total ?? page.options.length }
          this.active = 0
          this.renderList()
        })
        .catch(() => {
          if (!request.signal.aborted) {
            this.#remote = { options: [], total: 0 }
            this.renderList()
          }
        })
    }, delay)
  }

  override dispose(): void {
    this.closed()
    this.#anchor.remove()
    if (this.#native) {
      this.#native.hidden = false
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}
