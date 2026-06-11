import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function createUser(overrides: { email?: string; name?: string } = {}) {
  const email = overrides.email ?? `user-${Date.now()}@test.com`
  const name = overrides.name ?? 'Test User'
  const user = await prisma.user.create({ data: { email, name } })
  await prisma.account.create({
    data: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: email,
      passwordHash: await bcrypt.hash('password123', 4),
    },
  })
  return user
}

export async function createProfile(userId: string, householdId?: string, overrides: Record<string, unknown> = {}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  return prisma.profile.create({
    data: {
      userId,
      email: user.email!,
      displayName: user.name ?? 'Test User',
      householdId: householdId ?? null,
      ...overrides,
    },
  })
}

export async function createHousehold(name = 'Test Household') {
  return prisma.household.create({ data: { name } })
}

export async function createCategory(householdId: string, overrides: Record<string, unknown> = {}) {
  return prisma.category.create({
    data: {
      householdId,
      name: 'Test Category',
      icon: '🧹',
      color: '#e67e22',
      defaultPoints: 15,
      ...overrides,
    },
  })
}

export async function createTask(householdId: string, categoryId: string, createdById: string, overrides: Record<string, unknown> = {}) {
  return prisma.task.create({
    data: {
      householdId,
      categoryId,
      createdById,
      title: 'Test Task',
      points: 15,
      pointsType: 'PERSONAL',
      type: 'ONE_OFF',
      status: 'PENDING',
      ...overrides,
    },
  })
}

export async function createReward(householdId: string, createdById: string, overrides: Record<string, unknown> = {}) {
  return prisma.reward.create({
    data: {
      householdId,
      createdById,
      title: 'Test Reward',
      icon: '🎉',
      type: 'VIRTUAL',
      cost: 100,
      costType: 'PERSONAL',
      repeatable: false,
      cooldownHours: 24,
      ...overrides,
    },
  })
}

export async function seedFullHousehold() {
  const user = await createUser()
  const household = await createHousehold()
  const profile = await createProfile(user.id, household.id)
  const category = await createCategory(household.id)
  return { user, household, profile, category }
}
