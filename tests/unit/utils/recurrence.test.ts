import { describe, expect, it } from 'vitest'
import {
  buildRecurrenceRule,
  parseSupportedRecurrenceRule,
} from '@/lib/utils/recurrence'
import { isValidRecurrenceRule, nextRecurrenceAt } from '@/lib/server/recurrence'

describe('recurrence schedules', () => {
  it('builds the supported user-facing presets', () => {
    expect(buildRecurrenceRule({ frequency: 'DAILY', time: '09:30' })).toBe('30 9 * * *')
    expect(buildRecurrenceRule({ frequency: 'WEEKDAYS', time: '08:00' })).toBe('0 8 * * 1-5')
    expect(buildRecurrenceRule({ frequency: 'WEEKLY', time: '17:45', weekday: 0 })).toBe('45 17 * * 0')
    expect(buildRecurrenceRule({ frequency: 'MONTHLY', time: '07:15', monthDay: 'L' })).toBe('15 7 L * *')
  })

  it('recognizes presets without treating valid custom cron as a preset', () => {
    expect(parseSupportedRecurrenceRule('0 9 * * 0')).toEqual({ frequency: 'WEEKLY', time: '09:00', weekday: 0 })
    expect(parseSupportedRecurrenceRule('*/15 * * * *')).toBeNull()
    expect(isValidRecurrenceRule('*/15 * * * *')).toBe(true)
    expect(isValidRecurrenceRule('')).toBe(false)
  })

  it('calculates the next occurrence in the household timezone', () => {
    expect(nextRecurrenceAt('0 9 * * 0', new Date('2026-07-05T06:15:00Z'), 'America/Bogota'))
      .toEqual(new Date('2026-07-05T14:00:00Z'))
  })

  it('supports the last day of a month', () => {
    expect(nextRecurrenceAt('0 9 L * *', new Date('2026-02-01T00:00:00Z'), 'UTC'))
      .toEqual(new Date('2026-02-28T09:00:00Z'))
  })
})
