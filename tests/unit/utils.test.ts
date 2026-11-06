import { describe, expect, it } from 'vitest'
import { dateOrder, formatDateInput, parseDateInput } from '../../src/utils/date.ts'
import { DragOrder } from '../../src/utils/drag-order.ts'
import { periodOffsets, periodRange, samePeriod, unitName } from '../../src/utils/period.ts'
import { byGroup, highlight, highlightSegments, matchesWords, wordsOf } from '../../src/utils/search.ts'
import { formatTime, minutesOf, parseTimeInput } from '../../src/utils/time.ts'
import { numberOf, unitLabel } from '../../src/utils/unit.ts'

const now = new Date(2026, 10, 6) // 6 novembre 2026

describe('date', () => {
  it('follows the order of the language', () => {
    expect(dateOrder('fr')).toEqual(['d', 'm', 'y'])
    expect(dateOrder('en-US')).toEqual(['m', 'd', 'y'])
  })

  it('formats with two-digit day and month', () => {
    expect(formatDateInput('2027-01-05', 'fr')).toBe('05/01/2027')
    expect(formatDateInput('2027-01-05', 'en-US')).toBe('01/05/2027')
    expect(formatDateInput('nope', 'fr')).toBe('')
  })

  it('reads quick entries', () => {
    expect(parseDateInput('', 'fr', now)).toBe('')
    expect(parseDateInput('1/2/27', 'fr', now)).toBe('2027-02-01')
    expect(parseDateInput('1/2/27', 'en-US', now)).toBe('2027-01-02')
    expect(parseDateInput('1.1.2027', 'fr', now)).toBe('2027-01-01')
    expect(parseDateInput('3-4', 'fr', now)).toBe('2026-04-03')
    expect(parseDateInput('15', 'fr', now)).toBe('2026-11-15')
    expect(parseDateInput('010127', 'fr', now)).toBe('2027-01-01')
    expect(parseDateInput('01012027', 'fr', now)).toBe('2027-01-01')
    expect(parseDateInput('2027-1-1', 'en-US', now)).toBe('2027-01-01')
    expect(parseDateInput('1/1/75', 'fr', now)).toBe('1975-01-01')
  })

  it('rejects impossible dates', () => {
    expect(parseDateInput('31/2/2027', 'fr', now)).toBeNull()
    expect(parseDateInput('abc', 'fr', now)).toBeNull()
    expect(parseDateInput('1/13/2027', 'fr', now)).toBeNull()
  })
})

describe('time', () => {
  it('reads quick entries', () => {
    expect(parseTimeInput('2')).toBe('02:00')
    expect(parseTimeInput('14')).toBe('14:00')
    expect(parseTimeInput('930')).toBe('09:30')
    expect(parseTimeInput('1430')).toBe('14:30')
    expect(parseTimeInput('14h30')).toBe('14:30')
    expect(parseTimeInput('9.5')).toBe('09:05')
    expect(parseTimeInput(' ')).toBe('')
    expect(parseTimeInput('25')).toBeNull()
    expect(parseTimeInput('12:75')).toBeNull()
  })

  it('converts minutes', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(14 * 60 + 5)).toBe('14:05')
    expect(minutesOf('01:30')).toBe(90)
    expect(minutesOf('1:30')).toBeNull()
  })
})

describe('period', () => {
  it('offers offsets around the current unit', () => {
    expect(periodOffsets('month', now)).toEqual([-22, 13])
    expect(periodOffsets('quarter', now)).toEqual([-7, 4])
    expect(periodOffsets('year', now)).toEqual([-10, 1])
  })

  it('computes ranges', () => {
    expect(periodRange({ operator: 'period', unit: 'month', from: 0, to: 0 }, now)).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodRange({ operator: 'period', unit: 'quarter', from: 1, to: 1 }, now)).toEqual({ from: '2027-01-01', to: '2027-03-31' })
    expect(periodRange({ operator: 'period', unit: 'month', from: 0, to: 2 }, now)).toEqual({ from: '2026-11-01', to: '2027-01-31' })
    expect(periodRange({ operator: 'past' }, now)).toEqual({ to: '2026-11-05' })
    expect(periodRange({ operator: 'between', from: '2026-01-01', to: '2026-02-01' }, now)).toEqual({ from: '2026-01-01', to: '2026-02-01' })
  })

  it('names units', () => {
    const quarter = (q: number, y: number) => `Q${q} ${y}`
    expect(unitName('quarter', 0, 'en', quarter, now)).toBe('Q4 2026')
    expect(unitName('year', 1, 'en', quarter, now)).toBe('2027')
    expect(unitName('month', 0, 'en', quarter, now)).toBe('November 2026')
  })

  it('compares periods', () => {
    expect(samePeriod({ operator: 'past' }, { operator: 'past' })).toBe(true)
    expect(samePeriod({ operator: 'past' }, null)).toBe(false)
  })
})

describe('search', () => {
  it('matches every word, without accents or case', () => {
    const words = wordsOf('  Éric  dup ')
    expect(words).toEqual(['eric', 'dup'])
    expect(matchesWords('Dupont Éric', words)).toBe(true)
    expect(matchesWords('Durand Éric', words)).toBe(false)
  })

  it('highlights found words on the original label', () => {
    expect(highlightSegments('Éric Dupont', ['eric'])).toEqual([
      { text: 'Éric', marked: true },
      { text: ' Dupont', marked: false },
    ])
    const fragment = highlight('Éric Dupont', ['dup'])
    const div = document.createElement('div')
    div.append(fragment)
    expect(div.innerHTML).toBe('Éric <mark>Dup</mark>ont')
  })

  it('groups options in the requested order', () => {
    const options = [
      { value: '1', label: 'a', group: 'Teams' },
      { value: '2', label: 'b', group: 'Users' },
      { value: '3', label: 'c', group: 'Teams' },
    ]
    expect(byGroup(options, ['Users']).map((o) => o.value)).toEqual(['2', '1', '3'])
    expect(byGroup(options).map((o) => o.value)).toEqual(['1', '3', '2'])
  })
})

describe('unit', () => {
  it('reads numbers and agrees the unit', () => {
    expect(numberOf('1,5')).toBe(1.5)
    expect(numberOf('')).toBeNull()
    expect(numberOf('x')).toBeNull()
    const days = (n: number | null) => (n === 1 ? 'day' : 'days')
    expect(unitLabel(days, '1')).toBe('day')
    expect(unitLabel(days, '3')).toBe('days')
    expect(unitLabel('€', '3')).toBe('€')
  })
})

describe('drag order', () => {
  it('drops before when moving up and after when moving down', () => {
    const keys = ['a', 'b', 'c', 'd']
    const order = new DragOrder(() => keys)
    order.start('c')
    order.over('a')
    expect(order.side('a')).toBe('before')
    expect(order.classes('a')).toEqual(['tif-drop-before'])
    expect(order.classes('c')).toEqual(['tif-dragging'])
    expect(order.result()).toEqual(['c', 'a', 'b', 'd'])
    order.start('a')
    order.over('c')
    expect(order.side('c')).toBe('after')
    expect(order.result()).toEqual(['b', 'c', 'a', 'd'])
    order.end()
    expect(order.result()).toBeNull()
  })
})
