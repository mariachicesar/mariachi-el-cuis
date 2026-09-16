import { describe, expect, test } from 'vitest'
import {
  buildAgreementText,
  CONTRACT_VERSION,
  formatStartTime,
  getClauses,
  type ContractBooking,
} from './terms'

const booking: ContractBooking = {
  name: 'María García',
  email: 'maria@example.com',
  phone: '6265551234',
  eventDate: '2026-10-03',
  startTime: '18:00',
  enforcedHours: 2,
  packageType: 'hourly',
  address: '123 Main St, Los Angeles, CA 90011',
  total: 1000,
  deposit: 100,
  balanceDue: 900,
  locale: 'es',
  signatureName: 'María García',
  signedAt: '2026-09-15T12:00:00.000Z',
}

test('CONTRACT_VERSION is a dated version string', () => {
  expect(CONTRACT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

describe('formatStartTime', () => {
  test('converts 24h to 12h with AM/PM', () => {
    expect(formatStartTime('16:30', 'en')).toBe('4:30 PM')
    expect(formatStartTime('07:00', 'en')).toBe('7:00 AM')
    expect(formatStartTime('00:00', 'en')).toBe('12:00 AM')
    expect(formatStartTime('12:00', 'en')).toBe('12:00 PM')
  })

  test('uses a. m./p. m. in Spanish', () => {
    expect(formatStartTime('16:30', 'es')).toBe('4:30 p. m.')
    expect(formatStartTime('07:00', 'es')).toBe('7:00 a. m.')
  })
})

describe('getClauses', () => {
  test('both locales return all clauses with headings and bodies', () => {
    for (const locale of ['es', 'en'] as const) {
      const clauses = getClauses(locale)
      expect(clauses.length).toBe(8)
      for (const clause of clauses) {
        expect(clause.heading.length).toBeGreaterThan(0)
        expect(clause.body.length).toBeGreaterThan(0)
      }
    }
  })

  test('clauses cover the owner-required terms', () => {
    const es = buildAgreementText(booking)
    expect(es).toContain('Zelle')
    expect(es).toContain('3 días hábiles')
    expect(es).toContain('15 minutos')
    expect(es).toContain('45 minutos')
    expect(es).toContain('80%')
    expect(es).toContain('igual o superior')
    expect(es).toContain('costo adicional') // insurance
    expect(es).toContain('Televisión')
  })
})

describe('buildAgreementText', () => {
  test('interpolates booking values, signature, and version', () => {
    const text = buildAgreementText(booking)
    expect(text).toContain('María García')
    expect(text).toContain('maria@example.com')
    expect(text).toContain('2026-10-03')
    expect(text).toContain('123 Main St, Los Angeles, CA 90011')
    expect(text).toContain('$1000')
    expect(text).toContain('$100')
    expect(text).toContain('$900')
    expect(text).toContain(CONTRACT_VERSION)
    expect(text).toContain('2026-09-15T12:00:00.000Z')
  })

  test('renders in English', () => {
    const text = buildAgreementText({ ...booking, locale: 'en' })
    expect(text).toContain('Performance Agreement')
    expect(text).toContain('3 business days')
    expect(text).toContain('equal or greater talent')
  })
})
