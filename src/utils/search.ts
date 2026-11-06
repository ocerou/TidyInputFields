// Recherche en texte plein dans les options d'une liste (repris de MyCRM, optionSearch.ts, sans React).

/**
 * Une option ; avec un groupe, les options sont présentées par groupe, sous un intitulé. Dans une liste à choix multiple,
 * une option avec `selects` est un raccourci, sans case : elle remplace la sélection par ces valeurs (ou la vide si
 * c'était déjà exactement elles).
 */
export type SearchOption = { value: string; label: string; group?: string; pill?: string; inactive?: boolean; selects?: string[] }

/**
 * Options rangées par groupe : les groupes de `order` d'abord, dans cet ordre, puis les autres dans l'ordre où ils
 * apparaissent ; l'ordre des options est gardé dans chaque groupe. Sans groupe, la liste est rendue telle quelle.
 */
export function byGroup<T extends { group?: string }>(options: T[], order: string[] = []): T[] {
  if (!options.some((o) => o.group)) {
    return options
  }
  const seen: string[] = []
  for (const o of options) {
    const g = o.group ?? ''
    if (!seen.includes(g)) {
      seen.push(g)
    }
  }
  const rank = (g: string) => (order.includes(g) ? order.indexOf(g) : order.length + seen.indexOf(g))
  return [...options].sort((a, b) => rank(a.group ?? '') - rank(b.group ?? ''))
}

/** Texte comparable : sans accents ni majuscules. */
export const comparable = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Mots de la recherche : séparés par les espaces, chacun doit se trouver dans le libellé, dans n'importe quel ordre. */
export const wordsOf = (search: string) => comparable(search).split(/\s+/).filter(Boolean)

/** Le libellé contient tous les mots. */
export function matchesWords(label: string, words: string[]): boolean {
  const text = comparable(label)
  return words.every((w) => text.includes(w))
}

/**
 * Morceaux du libellé, marqués quand ils correspondent à un mot cherché. Le texte sans accents garde la longueur de
 * l'original (un caractère accentué se décompose puis perd son accent), ce qui permet de reporter les positions.
 */
export function highlightSegments(label: string, words: string[]): { text: string; marked: boolean }[] {
  if (words.length === 0 || label === '') {
    return [{ text: label, marked: false }]
  }
  const text = comparable(label)
  const marked = Array.from({ length: label.length }, () => false)
  for (const word of words) {
    for (let i = text.indexOf(word); i >= 0; i = text.indexOf(word, i + word.length)) {
      marked.fill(true, i, i + word.length)
    }
  }
  const pieces: { text: string; marked: boolean }[] = []
  let start = 0
  for (let i = 1; i <= label.length; i++) {
    if (i === label.length || marked[i] !== marked[start]) {
      pieces.push({ text: label.slice(start, i), marked: marked[start] })
      start = i
    }
  }
  return pieces
}

/** Libellé avec les mots trouvés dans des balises <mark>. */
export function highlight(label: string, words: string[]): DocumentFragment {
  const fragment = document.createDocumentFragment()
  for (const piece of highlightSegments(label, words)) {
    if (piece.marked) {
      const mark = document.createElement('mark')
      mark.textContent = piece.text
      fragment.append(mark)
    } else {
      fragment.append(piece.text)
    }
  }
  return fragment
}
