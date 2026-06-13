import { prisma } from './prisma'
import type { Database } from './index'
import { DEFAULT_CATEGORIES, getLevelFromPoints } from '@/lib/types'
import { TIME } from '@/lib/constants'

export const db: Database = {
  households: {
    async findById(id) {
      return prisma.household.findUnique({ where: { id } })
    },
    async findByInviteCode(code) {
      return prisma.household.findUnique({ where: { inviteCode: code } })
    },
    async create(name) {
      return prisma.household.create({ data: { name } })
    },
    async addSharedPoints(id, points) {
      return prisma.household.update({
        where: { id },
        data: { sharedPoints: { increment: points } },
      })
    },
    async deductSharedPoints(id, points) {
      return prisma.household.update({
        where: { id },
        data: { sharedPoints: { decrement: points } },
      })
    },
  },

  profiles: {
    async findById(id) {
      return prisma.profile.findUnique({ where: { id } })
    },
    async findByUserId(userId) {
      return prisma.profile.findUnique({ where: { userId } })
    },
    async findByHousehold(householdId) {
      return prisma.profile.findMany({ where: { householdId } })
    },
    async create(data) {
      return prisma.profile.create({ data })
    },
    async joinHousehold(profileId, householdId) {
      return prisma.profile.update({
        where: { id: profileId },
        data: { householdId },
      })
    },
    async addPersonalPoints(profileId, points) {
      const profile = await prisma.profile.update({
        where: { id: profileId },
        data: { personalPoints: { increment: points } },
      })
      const newLevel = getLevelFromPoints(profile.personalPoints)
      if (newLevel !== profile.level) {
        return prisma.profile.update({
          where: { id: profileId },
          data: { level: newLevel },
        })
      }
      return profile
    },
    async deductPersonalPoints(profileId, points) {
      return prisma.profile.update({
        where: { id: profileId },
        data: { personalPoints: { decrement: points } },
      })
    },
    async update(profileId, data) {
      return prisma.profile.update({ where: { id: profileId }, data })
    },
  },

  categories: {
    async findByHousehold(householdId) {
      const rows = await prisma.category.findMany({
        where: { householdId },
        include: { _count: { select: { tasks: true } } },
      })
      return rows.map(({ _count, ...cat }) => ({ ...cat, taskCount: _count.tasks }))
    },
    async create(data) {
      return prisma.category.create({ data })
    },
    async update(id, data) {
      return prisma.category.update({ where: { id }, data })
    },
    async delete(id) {
      await prisma.category.delete({ where: { id } })
    },
    async seedDefaults(householdId) {
      const cats = DEFAULT_CATEGORIES.map((c) => ({ ...c, householdId, isDefault: true }))
      await prisma.category.createMany({ data: cats })
      return prisma.category.findMany({ where: { householdId, isDefault: true } })
    },
  },

  tasks: {
    async findByHousehold(householdId) {
      return prisma.task.findMany({
        where: { householdId },
        include: { category: true, assignedTo: true, completedBy: true, createdBy: true },
        orderBy: { createdAt: 'desc' },
      })
    },
    async findById(id) {
      return prisma.task.findUnique({
        where: { id },
        include: { category: true, assignedTo: true, completedBy: true, createdBy: true },
      })
    },
    async create(data) {
      return prisma.task.create({
        data,
        include: { category: true, assignedTo: true },
      })
    },
    async update(id, data) {
      return prisma.task.update({
        where: { id },
        data,
        include: { category: true, assignedTo: true },
      })
    },
    async complete(taskId, userId) {
      return prisma.task.update({
        where: { id: taskId },
        data: { status: 'DONE', completedById: userId, completedAt: new Date() },
        include: { category: true },
      })
    },
    async skip(taskId) {
      return prisma.task.update({
        where: { id: taskId },
        data: { status: 'SKIPPED' },
      })
    },
    async delete(id) {
      await prisma.task.delete({ where: { id } })
    },
    async findPendingDue(householdId, withinHours) {
      const deadline = new Date(Date.now() + withinHours * TIME.HOUR_MS)
      return prisma.task.findMany({
        where: { householdId, status: 'PENDING', dueAt: { lte: deadline } },
        include: { assignedTo: true },
      })
    },
  },

  rewards: {
    async findByHousehold(householdId) {
      return prisma.reward.findMany({
        where: { householdId },
        include: { claims: { orderBy: { claimedAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      })
    },
    async findById(id) {
      return prisma.reward.findUnique({ where: { id } })
    },
    async create(data) {
      return prisma.reward.create({ data })
    },
    async update(id, data) {
      return prisma.reward.update({ where: { id }, data })
    },
    async delete(id) {
      await prisma.reward.delete({ where: { id } })
    },
    async claim(rewardId, claimedById) {
      const [claim] = await prisma.$transaction([
        prisma.rewardClaim.create({ data: { rewardId, claimedById } }),
        prisma.reward.update({
          where: { id: rewardId },
          data: { timesClaimed: { increment: 1 } },
        }),
      ])
      return claim
    },
    async getLastClaim(rewardId, userId) {
      return prisma.rewardClaim.findFirst({
        where: { rewardId, claimedById: userId },
        orderBy: { claimedAt: 'desc' },
      })
    },
  },

  notifications: {
    async findByProfile(profileId) {
      return prisma.notificationPreference.findMany({ where: { profileId } })
    },
    async upsert(data) {
      return prisma.notificationPreference.upsert({
        where: { profileId_eventType: { profileId: data.profileId, eventType: data.eventType } },
        create: data,
        update: data,
      })
    },
    async savePushSubscription(profileId, endpoint, keys) {
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: { profileId, endpoint, keysJson: JSON.stringify(keys) },
        update: { keysJson: JSON.stringify(keys) },
      })
    },
    async deletePushSubscription(endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    },
    async getPushSubscriptions(profileId) {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { locale: true, pushSubscriptions: true },
      })
      if (!profile) return []
      return profile.pushSubscriptions.map((s: { endpoint: string; keysJson: string }) => ({
        ...s,
        locale: profile.locale,
      }))
    },
    async getHouseholdPushSubscriptions(householdId) {
      const profiles = await prisma.profile.findMany({
        where: { householdId },
        select: { id: true, locale: true, pushSubscriptions: true },
      })
      return profiles.flatMap((p: { id: string; locale: string; pushSubscriptions: { endpoint: string; keysJson: string }[] }) =>
        p.pushSubscriptions.map((s) => ({
          endpoint: s.endpoint,
          keysJson: s.keysJson,
          profileId: p.id,
          locale: p.locale,
        }))
      )
    },
  },
}
