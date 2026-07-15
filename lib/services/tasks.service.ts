import { db } from '@/lib/db/implementation'
import { notificationsService } from './notifications.service'
import { pointsService } from './points.service'
import type { LevelUpResult } from './points.service'
import type { CreateTaskInput, Task } from '@/lib/types'
import { nextRecurrenceAt } from '@/lib/server/recurrence'

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

  async complete(taskId: string, userId: string): Promise<{ task: Task; levelUp: LevelUpResult | null }> {
    const task = await db.tasks.complete(taskId, userId)
    const levelUp = await pointsService.awardForTask(task, userId)
    await notificationsService.sendTaskCompleted(task, userId)
    return { task, levelUp }
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

  async generateDueRecurrences(now = new Date()): Promise<{ scanned: number; generated: number; invalid: number; failed: number }> {
    const candidates = await db.tasks.findCompletedRecurring()
    const result = { scanned: candidates.length, generated: 0, invalid: 0, failed: 0 }

    for (const source of candidates) {
      let next: Date
      try {
        next = nextRecurrenceAt(source.recurrenceRule ?? '', source.completedAt!, source.household.timezone)
      } catch {
        result.invalid++
        console.warn(`[recurrences] invalid schedule for task ${source.id}`)
        continue
      }
      if (next > now) continue

      try {
        const successor = await db.tasks.generateRecurringSuccessor(source.id, now)
        if (!successor) continue
        result.generated++
        await notificationsService.sendTaskAssigned(successor)
      } catch (error) {
        result.failed++
        console.error(`[recurrences] failed to generate task ${source.id}`, error)
      }
    }

    return result
  },
}
