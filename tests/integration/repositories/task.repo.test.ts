import { describe, it, expect } from 'vitest'
import { useTestDb } from '../helpers/db'
import { seedFullHousehold, createTask } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

describe('TaskRepository', () => {
  const db = useTestDb()

  it('creates a task and finds it by household', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    const tasks = await db.tasks.findByHousehold(household.id)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe(task.id)
  })

  it('complete sets status to DONE and records completedById', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    const completed = await db.tasks.complete(task.id, profile.id)
    expect(completed.status).toBe('DONE')
    expect(completed.completedById).toBe(profile.id)
    expect(completed.completedAt).not.toBeNull()
  })

  it('skip sets status to SKIPPED', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    const skipped = await db.tasks.skip(task.id)
    expect(skipped.status).toBe('SKIPPED')
  })

  it('findPendingDue returns only tasks due within the window', async () => {
    const { household, profile, category } = await seedFullHousehold()

    // Due in 1 hour — should be found with a 2-hour window
    await createTask(household.id, category.id, profile.id, {
      dueAt: new Date(Date.now() + 60 * 60 * 1000),
    })
    // Due in 5 hours — should NOT be found with a 2-hour window
    await createTask(household.id, category.id, profile.id, {
      dueAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
    })
    // No due date — should NOT be found
    await createTask(household.id, category.id, profile.id)

    const pending = await db.tasks.findPendingDue(household.id, 2)
    expect(pending).toHaveLength(1)
  })

  it('generates a recurring successor only once', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const source = await createTask(household.id, category.id, profile.id, {
      type: 'RECURRING',
      recurrenceRule: '0 9 * * 0',
      status: 'DONE',
      completedAt: new Date('2026-07-05T06:15:00Z'),
      dueAt: new Date('2026-07-05T12:00:00Z'),
    })

    const [first, second] = await Promise.all([
      db.tasks.generateRecurringSuccessor(source.id, new Date('2026-07-05T14:00:00Z')),
      db.tasks.generateRecurringSuccessor(source.id, new Date('2026-07-05T14:00:00Z')),
    ])

    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect(first ?? second).toMatchObject({ status: 'PENDING', recurrenceRule: '0 9 * * 0', dueAt: null })
    await expect(prisma.task.count({ where: { title: source.title } })).resolves.toBe(2)
  })

  it('delete removes the task', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    await db.tasks.delete(task.id)
    const tasks = await db.tasks.findByHousehold(household.id)
    expect(tasks).toHaveLength(0)
  })
})
