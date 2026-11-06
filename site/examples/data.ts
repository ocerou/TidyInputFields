// Sample data shared by the examples.
import type { ListOption, ListSource } from 'tidyinputfields'

export const countries: ListOption[] = [
  { value: 'be', label: 'Belgium' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'it', label: 'Italy' },
  { value: 'pt', label: 'Portugal' },
  { value: 'es', label: 'Spain' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'gb', label: 'United Kingdom' },
]

export const owners: ListOption[] = [
  { value: 'ada', label: 'Ada Lovelace', group: 'Users', pill: 'User' },
  { value: 'alan', label: 'Alan Turing', group: 'Users', pill: 'User' },
  { value: 'eric', label: 'Éric Dupont', group: 'Users', pill: 'User', inactive: true },
  { value: 'grace', label: 'Grace Hopper', group: 'Users', pill: 'User' },
  { value: 'sales', label: 'Sales', group: 'Teams', pill: 'Team' },
  { value: 'support', label: 'Support', group: 'Teams', pill: 'Team' },
]

/** 300 contacts, too many for a plain list. */
const contacts: ListOption[] = Array.from({ length: 300 }, (_, i) => ({
  value: `c${i + 1}`,
  label: `Contact ${String(i + 1).padStart(3, '0')} — ${['Paris', 'Lyon', 'Nantes', 'Lille', 'Bordeaux'][i % 5]}`,
}))

/** A remote source, as your API would answer it: the first matches and the total. */
export const searchContacts: ListSource = (query, { limit, signal }) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean)
      const found = contacts.filter((c) => words.every((w) => c.label.toLowerCase().includes(w)))
      resolve({ options: found.slice(0, limit), total: found.length })
    }, 200)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

/** Label of a contact, as GET /contacts/{id} would give it. */
export const contactLabel = async (value: string) => contacts.find((c) => c.value === value)?.label ?? null

/** People of the demo API: name, city, company; one in seven has left (inactive). */
const cities = ['Paris', 'Lyon', 'Nantes', 'Lille', 'Bordeaux']
const firstNames = ['Alice', 'Bruno', 'Chloé', 'David', 'Emma', 'Félix', 'Gabrielle', 'Hugo', 'Inès', 'Jules', 'Léa', 'Marc']
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia', 'Roux']
const people = Array.from({ length: 180 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
  city: cities[i % cities.length],
  active: i % 7 !== 6,
}))

/**
 * The documentation has no server: the page answers the requests to /api/demo/ itself, a few hundred milliseconds
 * later, as your API would.
 *   GET /api/demo/people?search=&city=&active=true&limit=20 → { items: [{ id, name, city, active }], total }
 *   GET /api/demo/people/{id}                               → { id, name, city, active }, or 404
 */
function installDemoApi() {
  const realFetch = window.fetch.bind(window)
  const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
    if (!url.pathname.startsWith('/api/demo/people')) {
      return realFetch(input, init)
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 250)
      init?.signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    const id = url.pathname.split('/')[4]
    if (id) {
      const person = people.find((p) => p.id === id)
      return person ? json(person) : json({ error: 'Not found' }, 404)
    }
    const words = fold(url.searchParams.get('search') ?? '').split(/\s+/).filter(Boolean)
    const city = url.searchParams.get('city')
    const found = people.filter(
      (p) => (!city || p.city === city) && (url.searchParams.get('active') !== 'true' || p.active) && words.every((w) => fold(`${p.name} ${p.city}`).includes(w)),
    )
    return json({ items: found.slice(0, Number(url.searchParams.get('limit')) || 20), total: found.length })
  }
}

if (typeof window !== 'undefined' && !(window as { tifDemoApi?: boolean }).tifDemoApi) {
  ;(window as { tifDemoApi?: boolean }).tifDemoApi = true
  installDemoApi()
}

export const demoCities = cities
