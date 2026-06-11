import { db } from '@/lib/db/implementation'
import { notificationsService } from './notifications.service'
import { pointsService } from './points.service'
import type { CreateTaskInput, Task } from '@/lib/types'

export const tasksService = {
  async getByHousehold(householdId: string): Promise<Task[]> {
    return db.tasks.findByHousehold(householdId)
  },

  async create(data: CreateTaskInput): Promise<Task> {
    const task = await db.tasks.create(data)
    if (task.assignedToId) {
      await notificationsService.sendTaskAssigned(task)
    }
    return task
  },

  async complete(taskId: string, userId: string): Promise<Task> {
    const task = await db.tasks.complete(taskId, userId)
    await pointsService.awardForTask(task, userId)
    await notificationsService.sendTaskCompleted(task, userId)
    return task
  },

  async update(id: string, data: Partial<CreateTaskInput>): Promise<Task> {
    return db.tasks.update(id, data)
  },

  async delete(id: string): Promise<void> {
    return db.tasks.delete(id)
  },

  async skip(taskId: string): Promise<Task> {
    return db.tasks.skip(taskId)
  },
}
