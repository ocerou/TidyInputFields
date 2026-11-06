import { afterEach, describe, expect, it, vi } from 'vitest'
import { addTranslations, getLocale, onLocaleChange, setLocale, setTranslator, t } from '../../src/i18n/i18n.ts'

afterEach(() => {
  setLocale(null)
  setTranslator(null)
  document.documentElement.lang = ''
})

describe('i18n', () => {
  it('reads the language from the page, then from setLocale', () => {
    document.documentElement.lang = 'de'
    expect(getLocale()).toBe('de')
    expect(t('common.cancel')).toBe('Abbrechen')
    setLocale('fr')
    expect(getLocale()).toBe('fr')
    expect(t('common.cancel')).toBe('Annuler')
  })

  it('falls back from region to language, then to English, then to the key', () => {
    setLocale('fr-CA')
    expect(t('common.cancel')).toBe('Annuler')
    setLocale('pt-BR')
    expect(t('common.cancel')).toBe('Cancel')
    expect(t('missing.key')).toBe('missing.key')
  })

  it('adds nested or flat translations, with variables and plurals', () => {
    addTranslations('en', { test: { hello: 'Hello {{name}}', items_one: '{{count}} item', items_other: '{{count}} items' } })
    setLocale('en')
    expect(t('test.hello', { name: 'Ada' })).toBe('Hello Ada')
    expect(t('test.items', { count: 1 })).toBe('1 item')
    expect(t('test.items', { count: 3 })).toBe('3 items')
    addTranslations('fr', { 'test.hello': 'Bonjour {{name}}' })
    setLocale('fr')
    expect(t('test.hello', { name: 'Ada' })).toBe('Bonjour Ada')
  })

  it('uses a plugged translator, and the built-in text when it has none', () => {
    setTranslator((key) => (key === 'common.ok' ? 'Vale' : key))
    expect(t('common.ok')).toBe('Vale')
    setLocale('en')
    expect(t('common.cancel')).toBe('Cancel')
  })

  it('notifies listeners and the document', () => {
    const listener = vi.fn()
    const event = vi.fn()
    const off = onLocaleChange(listener)
    document.addEventListener('localechange.tif', event)
    setLocale('it')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(event).toHaveBeenCalledTimes(1)
    off()
    document.removeEventListener('localechange.tif', event)
    setLocale('es')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
