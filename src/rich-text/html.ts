// HTML de l'éditeur riche (repris de MyCRM, richText.ts) : nettoyage de ce qu'on affiche ou charge (seules les
// mises en forme de l'éditeur passent), nettoyage de ce qu'on colle (Word, Google Docs, Outlook, pages web), texte brut.
// Le HTML est lu dans un document détaché (DOMParser) puis recopié élément par élément : aucun script ne s'exécute.

const TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'PRE', 'CODE', 'HR',
  'IMG', 'SPAN', 'LABEL', 'INPUT', 'DIV', 'TABLE', 'TBODY', 'TR', 'TH', 'TD', 'MARK',
])
/** Styles gardés sur le texte (barre de sélection) : couleur, fond, taille, police, aux valeurs vérifiées. */
const STYLES: [string, RegExp][] = [
  ['color', /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i],
  ['background-color', /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i],
  ['font-size', /^\d{1,3}(\.\d+)?(px|pt|em|rem|%)$/],
  ['font-family', /^[\w\s,'"-]{1,120}$/],
]
/** Attributs gardés sur toute balise autorisée (listes de tâches, mentions, emojis). */
const ATTRIBUTES = ['data-type', 'data-checked', 'data-id', 'data-label', 'data-kind', 'data-name']
const SAFE_URL = /^(https?:|mailto:)/i
/** Adresse d'image admise : web, image intégrée (data:) ou locale (blob:). */
const SAFE_IMAGE = /^(https?:|blob:|data:image\/(png|jpeg|gif|webp);base64,)/i
/** Identifiant d'une image stockée par l'application (data-image-id). */
const IMAGE_ID = /^[\w.:-]{1,100}$/

/** Le texte est-il déjà du HTML ? Sinon c'est du texte brut (reprise, ancienne saisie). */
export const isHtml = (text: string) => /^\s*<(p|h[1-3]|ul|ol|blockquote|pre|table|hr|img|div|html|head|body|meta|!doctype)[\s>]/i.test(text)

/** Texte brut → paragraphes HTML, une ligne par paragraphe. */
function fromPlainText(text: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .split(/\r?\n/)
    .map((row) => `<p>${escape(row)}</p>`)
    .join('')
}

/** Recopie un nœud en ne gardant que les balises autorisées ; le texte des balises refusées est conservé. */
function copyAllowed(source: Node, target: Node, document: Document): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent ?? ''))
    } else if (child instanceof Element) {
      if (['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT'].includes(child.tagName)) {
        continue
      }
      if (!TAGS.has(child.tagName)) {
        copyAllowed(child, target, document)
        continue
      }
      // Seules les cases des listes de tâches sont des champs ; une image a une adresse sûre ou un identifiant.
      const src = child.getAttribute('src') ?? ''
      const imageId = child.getAttribute('data-image-id') ?? ''
      if (
        (child.tagName === 'INPUT' && child.getAttribute('type') !== 'checkbox') ||
        (child.tagName === 'IMG' && !SAFE_IMAGE.test(src) && !IMAGE_ID.test(imageId))
      ) {
        continue
      }
      const copy = document.createElement(child.tagName.toLowerCase())
      for (const name of ATTRIBUTES) {
        const v = child.getAttribute(name)
        if (v !== null) {
          copy.setAttribute(name, v)
        }
      }
      if (child.tagName === 'TH' || child.tagName === 'TD') {
        for (const name of ['colspan', 'rowspan']) {
          const v = child.getAttribute(name)
          if (v && /^\d{1,3}$/.test(v)) {
            copy.setAttribute(name, v)
          }
        }
        // Largeur des colonnes réglée dans l'éditeur, en pixels (une valeur par colonne couverte).
        const width = child.getAttribute('colwidth')
        if (width && /^\d{1,4}(,\d{1,4})*$/.test(width)) {
          copy.setAttribute('colwidth', width)
        }
      }
      // Alignement d'un paragraphe ou d'un titre : centré ou à droite (à gauche par défaut).
      if (['P', 'H1', 'H2', 'H3'].includes(child.tagName) && child instanceof HTMLElement && ['center', 'right'].includes(child.style.textAlign)) {
        copy.style.textAlign = child.style.textAlign
      }
      if ((child.tagName === 'SPAN' || child.tagName === 'MARK') && child instanceof HTMLElement) {
        for (const [property, pattern] of STYLES) {
          const v = child.style.getPropertyValue(property).trim()
          if (v && pattern.test(v)) {
            copy.style.setProperty(property, v)
          }
        }
        const color = child.getAttribute('data-color')
        if (child.tagName === 'MARK' && color && STYLES[1][1].test(color)) {
          copy.setAttribute('data-color', color)
        }
      }
      if (child.tagName === 'IMG') {
        if (SAFE_IMAGE.test(src)) {
          copy.setAttribute('src', src)
        }
        if (IMAGE_ID.test(imageId)) {
          copy.setAttribute('data-image-id', imageId)
        }
        copy.setAttribute('alt', child.getAttribute('alt') ?? '')
        // Largeur réglée par les poignées de l'éditeur, en pixels.
        if (/^[0-9]{1,4}$/.test(child.getAttribute('width') ?? '')) {
          copy.setAttribute('width', child.getAttribute('width')!)
        }
      }
      if (child.tagName === 'INPUT') {
        copy.setAttribute('type', 'checkbox')
        if (child.hasAttribute('checked')) {
          copy.setAttribute('checked', '')
        }
      }
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') ?? ''
        if (SAFE_URL.test(href)) {
          copy.setAttribute('href', href)
        }
        copy.setAttribute('target', '_blank')
        copy.setAttribute('rel', 'noopener noreferrer')
      }
      copyAllowed(child, copy, document)
      target.appendChild(copy)
    }
  }
}

/** HTML sûr à afficher ou à charger dans l'éditeur, quelle que soit l'origine du texte (HTML ou texte brut). */
export function sanitizeHtml(text: string | null | undefined): string {
  if (!text) {
    return ''
  }
  const raw = isHtml(text) ? text : fromPlainText(text)
  const parsed = new DOMParser().parseFromString(`<body>${raw}</body>`, 'text/html')
  const clean = document.implementation.createHTMLDocument('')
  copyAllowed(parsed.body, clean.body, clean)
  return clean.body.innerHTML
}

/** Texte sans mise en forme, pour un résumé ou une recherche. */
export function plainText(text: string | null | undefined): string {
  if (!text || !isHtml(text)) {
    return text ?? ''
  }
  const parsed = new DOMParser().parseFromString(text.replace(/<\/(p|h[1-3]|li)>/gi, '</$1> '), 'text/html')
  return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * HTML collé dans l'éditeur (Word, Google Docs, Outlook, pages web) ramené aux mises en forme de l'éditeur, avant que
 * celui-ci ne le lise : styles, classes et polices retirés ; gras, italique, souligné et barré des styles traduits en
 * balises ; titres 4 à 6 ramenés au titre 3 ; listes de Word reconstruites ; paragraphes vides en série supprimés.
 */
export function cleanPastedHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const body = parsed.body

  // Commentaires, styles, métadonnées et balises de Word (<o:p>…) n'ont rien à afficher.
  const iterator = parsed.createNodeIterator(body, NodeFilter.SHOW_COMMENT)
  const comments: Node[] = []
  for (let n = iterator.nextNode(); n; n = iterator.nextNode()) {
    comments.push(n)
  }
  comments.forEach((n) => n.parentNode?.removeChild(n))
  body.querySelectorAll('style, script, meta, link, title, xml, template').forEach((n) => n.remove())
  // Marqueurs des listes de Word (« · », « 1. ») : la liste reconstruite les remplace.
  body.querySelectorAll('[style*="mso-list:Ignore" i], [style*="mso-list: Ignore" i]').forEach((n) => n.remove())

  const unwrap = (el: Element) => el.replaceWith(...Array.from(el.childNodes))
  const rename = (el: Element, tag: string) => {
    const next = parsed.createElement(tag)
    next.append(...Array.from(el.childNodes))
    el.replaceWith(next)
    return next
  }

  // Listes de Word : paragraphes « mso-list » consécutifs → ul / ol, imbriqués selon leur niveau.
  for (const p of Array.from(body.querySelectorAll('p[style*="mso-list" i]'))) {
    if (!p.isConnected || p.previousElementSibling?.matches('p[style*="mso-list" i]')) {
      continue
    }
    const series: Element[] = []
    for (let x: Element | null = p; x?.matches('p[style*="mso-list" i]'); x = x.nextElementSibling) {
      series.push(x)
    }
    const numbered = /^\s*[\da-z]{1,3}[.)]/i.test(p.textContent ?? '') && !/^\s*[·•o§]/.test(p.textContent ?? '')
    const root = parsed.createElement(numbered ? 'ol' : 'ul')
    const stacks: Element[] = [root]
    for (const item of series) {
      const level = Math.max(1, Number(/level(\d)/i.exec(item.getAttribute('style') ?? '')?.[1] ?? 1))
      while (stacks.length < level) {
        const parent = stacks[stacks.length - 1]
        const sub = parsed.createElement(root.tagName)
        ;(parent.lastElementChild ?? parent.appendChild(parsed.createElement('li'))).append(sub)
        stacks.push(sub)
      }
      stacks.length = level
      const li = parsed.createElement('li')
      li.append(...Array.from(item.childNodes))
      stacks[level - 1].append(li)
    }
    series[0].replaceWith(root)
    series.slice(1).forEach((x) => x.remove())
  }

  for (const el of Array.from(body.querySelectorAll('*'))) {
    if (!el.isConnected) {
      continue
    }
    const style = (el.getAttribute('style') ?? '').toLowerCase()
    const tag = el.tagName
    // Google Docs entoure tout le texte d'un <b style="font-weight:normal"> : ce n'est pas du gras.
    if ((tag === 'B' || tag === 'STRONG') && /font-weight\s*:\s*(normal|[1-4]00)\b/.test(style)) {
      unwrap(el)
      continue
    }
    // Mises en forme données par le style (Google Docs, pages web) → balises.
    if (tag === 'SPAN' || tag === 'FONT') {
      if (el.hasAttribute('data-type')) {
        continue
      }
      let inner: Node[] = Array.from(el.childNodes)
      const wrap = (b: string) => {
        const e = parsed.createElement(b)
        e.append(...inner)
        inner = [e]
      }
      if (/font-weight\s*:\s*(bold|[6-9]00)\b/.test(style)) wrap('strong')
      if (/font-style\s*:\s*italic/.test(style)) wrap('em')
      if (/text-decoration[^;]*underline/.test(style)) wrap('u')
      if (/text-decoration[^;]*line-through/.test(style)) wrap('s')
      el.replaceWith(...inner)
      continue
    }
    if (/^H[4-6]$/.test(tag)) {
      rename(el, 'h3')
      continue
    }
    if (tag.includes(':')) {
      unwrap(el)
      continue
    }
    for (const attribute of ['style', 'class', 'id', 'lang', 'dir', 'align', 'face', 'size', 'color', 'bgcolor', 'width', 'height', 'border', 'cellpadding', 'cellspacing']) {
      if (!(tag === 'IMG' && attribute === 'width')) {
        el.removeAttribute(attribute)
      }
    }
  }

  // Espaces insécables en série (Word, Outlook) → espaces ordinaires.
  const texts = parsed.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  for (let n = texts.nextNode(); n; n = texts.nextNode()) {
    n.textContent = (n.textContent ?? '').replace(/ /g, ' ')
  }

  // Saut de ligne isolé entre deux blocs (Google Docs) : il deviendrait un paragraphe vide.
  Array.from(body.children)
    .filter((x) => x.tagName === 'BR')
    .forEach((br) => br.remove())
  // Paragraphes vides : au plus un entre deux blocs, aucun au début ni à la fin.
  const isEmptyBlock = (el: Element | null) => !!el && /^(P|DIV)$/.test(el.tagName) && !el.querySelector('img') && !(el.textContent ?? '').trim()
  for (const p of Array.from(body.querySelectorAll('p, div'))) {
    if (isEmptyBlock(p) && (isEmptyBlock(p.previousElementSibling) || !p.previousElementSibling || !p.nextElementSibling)) {
      p.remove()
    }
  }
  // Un saut de ligne en fin de paragraphe ne sert à rien.
  body.querySelectorAll('p > br:last-child, li > br:last-child').forEach((br) => br.remove())
  return body.innerHTML
}
