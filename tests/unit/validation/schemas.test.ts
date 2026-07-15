import { describe, expect, it } from 'vitest'
import { HouseholdPatchSchema, TaskCreateSchema } from '@/lib/validation/schemas'

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
