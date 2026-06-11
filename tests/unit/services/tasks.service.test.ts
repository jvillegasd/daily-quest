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

const mockDb = vi.mocked(db)

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
    status: 'PENDING' as const,
    createdAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  mockDb.tasks.create.mockResolvedValue(makeTask() as any)
  mockDb.tasks.complete.mockResolvedValue(makeTask({ status: 'DONE' }) as any)
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
    expect(mockDb.tasks.create).toHaveBeenCalledWith(input)
  })

  it('does NOT send assignment notification when assignedToId is null', async () => {
    await tasksService.create({ householdId: 'hh-1', categoryId: 'cat-1', createdById: 'p1', title: 'Task', points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF' })
    expect(vi.mocked(notificationsService).sendTaskAssigned).not.toHaveBeenCalled()
  })

  it('sends assignment notification when assignedToId is set', async () => {
    const assignedTask = makeTask({ assignedToId: 'profile-2' })
    mockDb.tasks.create.mockResolvedValue(assignedTask as any)
    await tasksService.create({ householdId: 'hh-1', categoryId: 'cat-1', createdById: 'p1', title: 'Task', points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF', assignedToId: 'profile-2' })
    expect(vi.mocked(notificationsService).sendTaskAssigned).toHaveBeenCalledTimes(1)
  })
})

describe('tasksService.complete', () => {
  it('calls db.tasks.complete with taskId and userId', async () => {
    await tasksService.complete('task-1', 'profile-1')
    expect(mockDb.tasks.complete).toHaveBeenCalledWith('task-1', 'profile-1')
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
