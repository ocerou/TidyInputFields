// Envoi de fichiers (nouveau composant) : une zone où déposer les fichiers, ou un bouton pour les choisir, puis la
// liste des fichiers retenus (nom, taille, croix pour le retirer). `accept`, `maxSize` et `maxFiles` écartent les
// fichiers qui ne conviennent pas, avec un message sous la zone. Sans `multiple`, un nouveau fichier remplace l'ancien.
//
// Les fichiers restent dans le <input type="file"> natif (habillé, ou créé dans la balise) grâce à DataTransfer :
// le formulaire les envoie comme d'habitude, en multipart/form-data.
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { icon } from '../core/icons.ts'
import { getLocale, t } from '../i18n/i18n.ts'
import { dispatchChange, FIELD_DEFAULTS, NativeField } from './field.ts'

/** Taille lue dans un nombre d'octets ou un texte (« 5MB », « 500 Ko », « 2 GB ») ; 0 sans limite. */
export function parseSize(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*([kmgt]?)(?:i?[bo])?\s*$/i.exec(String(value ?? ''))
  if (!m) {
    return 0
  }
  const power = ['', 'k', 'm', 'g', 't'].indexOf(m[2].toLowerCase())
  return Math.round(Number(m[1].replace(',', '.')) * 1024 ** power)
}

/** Taille lisible dans la langue : « 1,4 Mo », « 820 kB »… */
export function formatSize(bytes: number, locale = getLocale()): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: units[i], unitDisplay: 'short', maximumFractionDigits: i ? 1 : 0 }).format(value)
}

/** Le fichier correspond à `accept` (types MIME, « image/* », extensions « .pdf »), comme pour un champ natif. */
export function accepts(file: File, accept: string): boolean {
  const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean)
  if (!rules.length) {
    return true
  }
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return rules.some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule))
}

export class TifFile extends NativeField<HTMLInputElement> {
  static override NAME = 'file'
  static override DEFAULTS: Options = {
    ...FIELD_DEFAULTS,
    /** Types acceptés, comme l'attribut accept : « image/*,.pdf ». */
    accept: '',
    multiple: false,
    /** Taille maximale d'un fichier : octets ou texte (« 5MB ») ; 0 sans limite. */
    maxSize: 0,
    /** Nombre maximal de fichiers (0 sans limite). */
    maxFiles: 0,
  }

  // Posés pendant le constructeur de la classe de base (voir field.ts) : champs `declare`, méthodes ordinaires.
  declare frame: HTMLDivElement | undefined
  declare drop: HTMLDivElement | undefined
  declare list: HTMLUListElement | undefined
  declare message: HTMLDivElement | undefined
  declare files: File[] | undefined
  declare listeners: AbortController | undefined
  declare syncing: boolean | undefined

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const control = this.control
    control.type = 'file'
    this.files = [...(control.files ?? [])]
    const browse = h('button', { type: 'button', class: 'tif-link-btn tif-file-browse' }, t('file.browse'))
    this.drop = h('div', { class: 'tif-file-drop' }, icon('upload'), h('span', { class: 'tif-file-drop-text' }, t('file.drop'), ' ', browse))
    this.list = h('ul', { class: 'tif-file-list' })
    this.message = h('div', { class: 'tif-file-message', role: 'alert', hidden: true })
    this.frame = h('div', { class: 'tif tif-file' })
    control.before(this.frame)
    this.frame.append(control, this.drop, this.list, this.message)
    const listeners = new AbortController()
    this.listeners = listeners
    const signal = listeners.signal
    browse.addEventListener('click', () => control.click(), { signal })
    this.drop.addEventListener('click', (event) => event.target === this.drop && control.click(), { signal })
    // Fichiers choisis dans la fenêtre du système : ils s'ajoutent à la liste (ou la remplacent sans multiple).
    control.addEventListener(
      'change',
      (event) => {
        if (this.syncing) {
          return
        }
        event.stopImmediatePropagation()
        this.addFiles([...(control.files ?? [])])
      },
      { signal, capture: true },
    )
    for (const type of ['dragenter', 'dragover'] as const) {
      this.drop.addEventListener(
        type,
        (event) => {
          if (control.disabled) {
            return
          }
          event.preventDefault()
          this.drop!.classList.add('tif-dragover')
        },
        { signal },
      )
    }
    this.drop.addEventListener('dragleave', () => this.drop!.classList.remove('tif-dragover'), { signal })
    this.drop.addEventListener(
      'drop',
      (event) => {
        event.preventDefault()
        this.drop!.classList.remove('tif-dragover')
        if (!control.disabled) {
          this.addFiles([...(event.dataTransfer?.files ?? [])])
        }
      },
      { signal },
    )
    this.applyOptions(['accept', 'multiple', 'quiet'])
    this.render()
  }

  protected override classes(): string[] {
    return ['tif-file-input']
  }

  protected override prepare(control: HTMLInputElement): void {
    control.type = 'file'
  }

  protected override quietTarget(): HTMLElement {
    return this.frame ?? this.control
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'accept':
        if (value) {
          this.control.accept = String(value)
        } else {
          this.control.removeAttribute('accept')
        }
        return true
      case 'multiple':
        this.control.multiple = Boolean(value)
        return true
      case 'maxSize':
      case 'maxFiles':
      case 'placeholder':
      case 'readonly':
      case 'value':
        return true
      case 'quiet':
        if (!this.frame) {
          return true
        }
        return super.applyOption(key, value)
      default:
        return super.applyOption(key, value)
    }
  }

  /** Fichiers retenus. */
  override get value(): File[] {
    return [...(this.files ?? [])]
  }

  override set value(value: unknown) {
    this.files = Array.isArray(value) ? value.filter((f): f is File => f instanceof File) : []
    this.sync(false)
  }

  /** Ajoute des fichiers, en écartant ceux qui ne conviennent pas ; rend les fichiers retenus. */
  addFiles(incoming: File[]): File[] {
    const errors: string[] = []
    const accept = String(this.options.accept || '')
    const maxSize = parseSize(this.options.maxSize)
    const maxFiles = Number(this.options.maxFiles) || 0
    const kept: File[] = []
    for (const file of incoming) {
      if (!accepts(file, accept)) {
        errors.push(t('file.wrongType', { name: file.name }))
      } else if (maxSize && file.size > maxSize) {
        errors.push(t('file.tooBig', { name: file.name, max: formatSize(maxSize) }))
      } else {
        kept.push(file)
      }
    }
    let next = this.options.multiple ? [...(this.files ?? [])] : []
    for (const file of this.options.multiple ? kept : kept.slice(-1)) {
      // Le même fichier déposé deux fois n'apparaît qu'une fois.
      if (!next.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
        next.push(file)
      }
    }
    if (maxFiles && next.length > maxFiles) {
      errors.push(t('file.tooMany', { max: maxFiles }))
      next = next.slice(0, maxFiles)
    }
    this.files = next
    this.showErrors(errors)
    this.sync(true)
    return kept
  }

  /** Retire un fichier. */
  removeFile(file: File): void {
    this.files = (this.files ?? []).filter((f) => f !== file)
    this.showErrors([])
    this.sync(true)
  }

  /** Recopie la liste dans le champ natif (pour l'envoi du formulaire), redessine, et prévient si demandé. */
  protected sync(notify: boolean): void {
    const control = this.control
    try {
      const transfer = new DataTransfer()
      for (const file of this.files ?? []) {
        transfer.items.add(file)
      }
      control.files = transfer.files
    } catch {
      // Navigateur sans DataTransfer constructible : la liste reste affichée, le champ garde son dernier choix.
    }
    this.render()
    if (notify) {
      this.syncing = true
      dispatchChange(control)
      this.syncing = false
    }
  }

  protected showErrors(errors: string[]): void {
    if (!this.message) {
      return
    }
    this.message.hidden = errors.length === 0
    this.message.replaceChildren(...errors.map((e) => h('div', {}, e)))
  }

  protected render(): void {
    if (!this.list || !this.drop) {
      return
    }
    const disabled = this.control.disabled
    this.frame?.toggleAttribute('aria-disabled', disabled)
    this.frame?.classList.toggle('tif-missing', Boolean(this.options.required) && !(this.files ?? []).length)
    this.list.replaceChildren(
      ...(this.files ?? []).map((file) => {
        const remove = h('button', { type: 'button', class: 'tif-icon-btn', title: t('file.remove', { name: file.name }), 'aria-label': t('file.remove', { name: file.name }), hidden: disabled }, icon('close'))
        remove.addEventListener('click', () => this.removeFile(file))
        return h('li', { class: 'tif-file-item' }, icon('file'), h('span', { class: 'tif-file-name', title: file.name }, file.name), h('span', { class: 'tif-file-size' }, formatSize(file.size)), remove)
      }),
    )
    this.list.hidden = !(this.files ?? []).length
  }

  protected override localeChanged(): void {
    const text = this.drop?.querySelector('.tif-file-drop-text')
    const browse = this.drop?.querySelector('.tif-file-browse')
    if (text && browse) {
      browse.textContent = t('file.browse')
      text.replaceChildren(t('file.drop'), ' ', browse)
    }
    this.render()
  }

  override dispose(): void {
    this.listeners?.abort()
    if (this.created) {
      this.frame?.remove()
    } else if (this.frame) {
      this.frame.replaceWith(this.control)
    }
    super.dispose()
  }
}
