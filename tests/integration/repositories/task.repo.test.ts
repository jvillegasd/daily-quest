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

    const { task: completed } = await db.tasks.complete(task.id, profile.id)
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
    const hidden = await createTask(household.id, category.id, profile.id, {
      availableAt: new Date(Date.now() + 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 60 * 60 * 1000),
    })
    // No due date — should NOT be found
    await createTask(household.id, category.id, profile.id)

    const pending = await db.tasks.findPendingDue(household.id, 2)
    expect(pending).toHaveLength(1)

    await prisma.task.update({ where: { id: hidden.id }, data: { availableAt: new Date(0) } })
    expect(await db.tasks.findPendingDue(household.id, 2)).toHaveLength(2)
  })

  it('creates one hidden successor when a recurring quest is completed', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const source = await createTask(household.id, category.id, profile.id, {
      type: 'RECURRING',
      recurrenceRule: '* * * * *',
    })

    const { task: completed, successor } = await db.tasks.complete(source.id, profile.id)

    expect(successor).toMatchObject({ status: 'PENDING', recurrenceRule: '* * * * *', dueAt: null })
    expect(successor!.availableAt.getTime()).toBeGreaterThan(completed.completedAt!.getTime())
    await expect(prisma.task.count({ where: { title: source.title } })).resolves.toBe(2)

    expect(await db.tasks.findByHousehold(household.id)).toHaveLength(1)
    await prisma.task.update({ where: { id: successor!.id }, data: { availableAt: new Date(0) } })
    expect(await db.tasks.findByHousehold(household.id)).toHaveLength(2)
  })

  it('reconciles one legacy successor at its actual scheduled time', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const completedAt = new Date()
    const source = await createTask(household.id, category.id, profile.id, {
      type: 'RECURRING',
      recurrenceRule: '* * * * *',
      status: 'DONE',
      completedAt,
    })

    const [successor] = await db.tasks.reconcileLegacyRecurrences(household.id)

    expect(successor.availableAt.getTime()).toBeGreaterThan(completedAt.getTime())
    await expect(db.tasks.reconcileLegacyRecurrences(household.id)).resolves.toEqual([])
    await expect(prisma.task.findUniqueOrThrow({ where: { id: source.id } })).resolves.not.toMatchObject({ recurrenceGeneratedAt: null })
  })

  it('delete removes the task', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    await db.tasks.delete(task.id)
    const tasks = await db.tasks.findByHousehold(household.id)
    expect(tasks).toHaveLength(0)
  })
})
