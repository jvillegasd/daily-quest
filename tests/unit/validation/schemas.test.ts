import { describe, expect, it } from 'vitest'
import { HouseholdPatchSchema, NotificationPreferenceSchema, TaskCreateSchema } from '@/lib/validation/schemas'

const recurringTask = {
  categoryId: 'category-1',
  title: 'Take out trash',
  points: 10,
  pointsType: 'PERSONAL' as const,
  type: 'RECURRING' as const,
}

describe('recurrence validation', () => {
  it('requires a supported schedule for new recurring quests', () => {
    expect(TaskCreateSchema.safeParse({ ...recurringTask, recurrenceRule: '' }).success).toBe(false)
    expect(TaskCreateSchema.safeParse({ ...recurringTask, recurrenceRule: '0 9 * * 0' }).success).toBe(true)
    expect(TaskCreateSchema.safeParse({ ...recurringTask, recurrenceRule: '*/5 * * * *' }).success).toBe(false)
  })

  it('accepts only real IANA household timezones', () => {
    expect(HouseholdPatchSchema.safeParse({ timezone: 'America/Bogota' }).success).toBe(true)
    expect(HouseholdPatchSchema.safeParse({ timezone: 'Middle/Earth' }).success).toBe(false)
  })
})

describe('NotificationPreferenceSchema', () => {
  const ok = (body: unknown) => NotificationPreferenceSchema.safeParse(body).success

  it('accepts what the settings page sends', () => {
    expect(ok({ eventType: 'TASK_ASSIGNED', enabled: false })).toBe(true)
  })

  it('accepts valid optional fields', () => {
    expect(ok({ eventType: 'DAILY_SUMMARY', dailyDigestTime: '23:59', reminderHoursBefore: 0 })).toBe(true)
  })

  it('rejects unknown or missing event types', () => {
    expect(ok({ eventType: 'NOT_AN_EVENT', enabled: true })).toBe(false)
    expect(ok({ enabled: true })).toBe(false)
  })

  it('rejects wrong types and out-of-range values', () => {
    expect(ok({ eventType: 'TASK_ASSIGNED', enabled: 'false' })).toBe(false)
    expect(ok({ eventType: 'DAILY_SUMMARY', dailyDigestTime: '24:00' })).toBe(false)
    expect(ok({ eventType: 'DAILY_SUMMARY', dailyDigestTime: '8am' })).toBe(false)
    expect(ok({ eventType: 'TASK_PENDING', reminderHoursBefore: -1 })).toBe(false)
    expect(ok({ eventType: 'TASK_PENDING', reminderHoursBefore: 1.5 })).toBe(false)
    expect(ok({ eventType: 'TASK_PENDING', reminderHoursBefore: 100000 })).toBe(false)
  })
})
