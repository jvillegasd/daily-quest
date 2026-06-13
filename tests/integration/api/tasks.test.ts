import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import { GET, POST } from '@/app/api/tasks/route'
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route'
import { useTestDb } from '../helpers/db'
import { makeRequest, makeParams } from '../helpers/route-caller'
import { seedFullHousehold, createTask } from '@/tests/factories'

vi.mock('@/lib/services/notifications.service', () => ({
  notificationsService: {
    sendTaskAssigned: vi.fn(),
    sendTaskCompleted: vi.fn(),
  },
}))

vi.mock('@/lib/services/points.service', () => ({
  pointsService: { awardForTask: vi.fn() },
}))

describe('GET /api/tasks', () => {
  useTestDb()

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 401 when profile has no household', async () => {
    const { user } = await seedFullHousehold()
    // Profile without household — create a fresh one
    const { prisma } = await import('@/lib/db/prisma')
    const u2 = await prisma.user.create({ data: { email: 'nohh@test.com', name: 'No HH' } })
    await prisma.profile.create({ data: { userId: u2.id, email: u2.email!, displayName: 'No HH User' } })
    vi.mocked(auth).mockResolvedValue({ user: { id: u2.id }, expires: '' } as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns tasks for authenticated user with household', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    await createTask(household.id, category.id, profile.id)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tasks).toHaveLength(1)
  })
})

describe('POST /api/tasks', () => {
  useTestDb()

  it('creates a task and returns 201', async () => {
    const { user, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    const req = makeRequest('POST', 'http://localhost/api/tasks', {
      categoryId: category.id,
      title: 'New Quest',
      points: 20,
      pointsType: 'PERSONAL',
      type: 'ONE_OFF',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.task.title).toBe('New Quest')
  })
})

describe('PATCH /api/tasks/[id]', () => {
  useTestDb()

  it('completes a task', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id)

    const req = makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'complete' })
    const res = await PATCH(req as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.task.status).toBe('DONE')
  })
})

describe('DELETE /api/tasks/[id]', () => {
  useTestDb()

  it('deletes a task', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id)

    const req = makeRequest('DELETE', `http://localhost/api/tasks/${task.id}`)
    const res = await DELETE(req as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(200)
  })
})
