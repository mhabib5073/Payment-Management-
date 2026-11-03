export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
// frontend/src/format.test.ts
import { describe, expect, it } from 'vitest'
import { buildQuery, errorMessage } from './api'


describe('formatMoney', () => {
  it('formats whole amounts with the currency', () => {
    expect(formatMoney(95000, 'USD')).toBe('$95,000')
  })
})

describe('buildQuery', () => {
  it('skips empty values', () => {
    expect(buildQuery({ country: 'India', search: '', page: 2, department: undefined })).toBe('?country=India&page=2')
  })
  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({})).toBe('')
  })
})

describe('errorMessage', () => {
  it('flattens FastAPI validation errors', () => {
    expect(errorMessage([{ loc: ['body', 'salary'], msg: 'must be > 0' }], 'x')).toBe('salary: must be > 0')
  })
  it('falls back when detail is missing', () => {
    expect(errorMessage(undefined, 'Bad Request')).toBe('Bad Request')
  })
})