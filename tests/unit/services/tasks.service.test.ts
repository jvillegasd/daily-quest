import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/implementation', () => ({
  db: {
    tasks: {
      create: vi.fn(),
      complete: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      skip: vi.fn(),
      findByHousehold: vi.fn(),
      findCompletedRecurring: vi.fn(),
      generateRecurringSuccessor: vi.fn(),
    },
  },
}))

vi.mock('@/lib/services/notifications.service', () => ({
  notificationsService: {
    sendTaskAssigned: vi.fn(),
    sendTaskCompleted: vi.fn(),
  },
}))

vi.mock('@/lib/services/points.service', () => ({
  pointsService: { awardForTask: vi.fn() },
}))

import { tasksService } from '@/lib/services/tasks.service'
import { db } from '@/lib/db/implementation'
import { notificationsService } from '@/lib/services/notifications.service'
import { pointsService } from '@/lib/services/points.service'

function makeTask(overrides = {}) {
  return {
    id: 'task-1',
    householdId: 'hh-1',
    categoryId: 'cat-1',
    createdById: 'profile-1',
    assignedToId: null,
    completedById: null,
    title: 'Do dishes',
    description: null,
    points: 15,
    pointsType: 'PERSONAL' as const,
    type: 'ONE_OFF' as const,
    recurrenceRule: null,
    dueAt: null,
    completedAt: null,
    recurrenceGeneratedAt: null,
    status: 'PENDING' as const,
    createdAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(db.tasks.create).mockResolvedValue(makeTask() as any)
  vi.mocked(db.tasks.complete).mockResolvedValue(makeTask({ status: 'DONE' }) as any)
})

describe('tasksService.create', () => {
  it('calls db.tasks.create with input data', async () => {
    const input = {
      householdId: 'hh-1',
      categoryId: 'cat-1',
      createdById: 'profile-1',
      title: 'Do dishes',
      points: 15,
      pointsType: 'PERSONAL' as const,
      type: 'ONE_OFF' as const,
    }
    await tasksService.create(input)
    expect(vi.mocked(db.tasks.create)).toHaveBeenCalledWith(input)
  })

  it('does NOT send assignment notification when assignedToId is null', async () => {
    await tasksService.create({ householdId: 'hh-1', categoryId: 'cat-1', createdById: 'p1', title: 'Task', points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF' })
    expect(vi.mocked(notificationsService).sendTaskAssigned).not.toHaveBeenCalled()
  })

  it('sends assignment notification when assignedToId is set', async () => {
    const assignedTask = makeTask({ assignedToId: 'profile-2' })
    vi.mocked(db.tasks.create).mockResolvedValue(assignedTask as any)
    await tasksService.create({ householdId: 'hh-1', categoryId: 'cat-1', createdById: 'p1', title: 'Task', points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF', assignedToId: 'profile-2' })
    expect(vi.mocked(notificationsService).sendTaskAssigned).toHaveBeenCalledTimes(1)
  })
})

describe('tasksService.complete', () => {
  it('calls db.tasks.complete with taskId and userId', async () => {
    await tasksService.complete('task-1', 'profile-1')
    expect(vi.mocked(db.tasks.complete)).toHaveBeenCalledWith('task-1', 'profile-1')
  })

  it('calls pointsService.awardForTask after completing', async () => {
    await tasksService.complete('task-1', 'profile-1')
    expect(vi.mocked(pointsService).awardForTask).toHaveBeenCalled()
  })

  it('calls notificationsService.sendTaskCompleted after completing', async () => {
    await tasksService.complete('task-1', 'profile-1')
    expect(vi.mocked(notificationsService).sendTaskCompleted).toHaveBeenCalled()
  })
})

describe('tasksService.generateDueRecurrences', () => {
  it('generates one due successor and sends its assignment notification', async () => {
    const source = makeTask({
      type: 'RECURRING',
      status: 'DONE',
      assignedToId: 'profile-2',
      recurrenceRule: '0 9 * * 0',
      completedAt: new Date('2026-07-05T06:15:00Z'),
      household: { timezone: 'America/Bogota' },
    })
    const successor = makeTask({ id: 'task-2', type: 'RECURRING', assignedToId: 'profile-2' })
    vi.mocked(db.tasks.findCompletedRecurring).mockResolvedValue([source] as any)
    vi.mocked(db.tasks.generateRecurringSuccessor).mockResolvedValue(successor as any)

    const result = await tasksService.generateDueRecurrences(new Date('2026-07-05T14:00:00Z'))

    expect(db.tasks.generateRecurringSuccessor).toHaveBeenCalledWith('task-1', new Date('2026-07-05T14:00:00Z'))
    expect(notificationsService.sendTaskAssigned).toHaveBeenCalledWith(successor)
    expect(result).toEqual({ scanned: 1, generated: 1, invalid: 0, failed: 0 })
  })

  it('does not generate before the next scheduled time', async () => {
    vi.mocked(db.tasks.findCompletedRecurring).mockResolvedValue([makeTask({
      type: 'RECURRING', status: 'DONE', recurrenceRule: '0 9 * * 0',
      completedAt: new Date('2026-07-05T06:15:00Z'), household: { timezone: 'America/Bogota' },
    })] as any)

    const result = await tasksService.generateDueRecurrences(new Date('2026-07-05T13:59:00Z'))

    expect(db.tasks.generateRecurringSuccessor).not.toHaveBeenCalled()
    expect(result.generated).toBe(0)
  })
})
