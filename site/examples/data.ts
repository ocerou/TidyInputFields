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
