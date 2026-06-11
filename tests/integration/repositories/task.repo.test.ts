import { describe, it, expect } from 'vitest'
import { useTestDb } from '../helpers/db'
import { seedFullHousehold, createTask } from '@/tests/factories'

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

  it('delete removes the task', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    await db.tasks.delete(task.id)
    const tasks = await db.tasks.findByHousehold(household.id)
    expect(tasks).toHaveLength(0)
  })
})
