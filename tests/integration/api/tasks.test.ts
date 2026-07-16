import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { GET, POST } from '@/app/api/tasks/route'
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route'
import { useTestDb } from '../helpers/db'
import { makeRequest, makeParams } from '../helpers/route-caller'
import { seedFullHousehold, createTask, createHousehold, createCategory, createUser, createProfile } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

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
    await seedFullHousehold()
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
    const { user, profile, category } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
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

  it('forbids members', async () => {
    const { user, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    const res = await POST(makeRequest('POST', 'http://localhost/api/tasks', {
      categoryId: category.id, title: 'Nope', points: 20, pointsType: 'PERSONAL', type: 'ONE_OFF',
    }) as any)

    expect(res.status).toBe(403)
  })

  it('rejects a recurring quest without a supported schedule', async () => {
    const { user, profile, category } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    const res = await POST(makeRequest('POST', 'http://localhost/api/tasks', {
      categoryId: category.id, title: 'Recurring', points: 10, pointsType: 'PERSONAL', type: 'RECURRING', recurrenceRule: '',
    }) as any)

    expect(res.status).toBe(400)
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

  it('cannot complete a task twice', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id, { type: 'RECURRING', recurrenceRule: '* * * * *' })
    const request = () => makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'complete' })

    const responses = await Promise.all([
      PATCH(request() as any, { params: makeParams({ id: task.id }) }),
      PATCH(request() as any, { params: makeParams({ id: task.id }) }),
    ])

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    await expect(prisma.task.count({ where: { title: task.title } })).resolves.toBe(2)
  })

  it('cannot complete or skip an occurrence before it is available', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id, {
      availableAt: new Date(Date.now() + 60 * 60 * 1000),
    })

    const complete = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'complete' }) as any, { params: makeParams({ id: task.id }) })
    const skip = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'skip' }) as any, { params: makeParams({ id: task.id }) })

    expect(complete.status).toBe(404)
    expect(skip.status).toBe(404)
    await expect(prisma.task.findUniqueOrThrow({ where: { id: task.id } })).resolves.toMatchObject({ status: 'PENDING' })
  })


  it('lets admins edit a task and forbids members', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id)

    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    let req = makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { title: 'Member edit' })
    expect((await PATCH(req as any, { params: makeParams({ id: task.id }) })).status).toBe(403)

    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    req = makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { title: 'Admin edit' })
    const res = await PATCH(req as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(200)
    await expect(prisma.task.findUniqueOrThrow({ where: { id: task.id } })).resolves.toMatchObject({ title: 'Admin edit' })
  })

  it('preserves an existing custom schedule but only replaces it with a preset', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id, { type: 'RECURRING', recurrenceRule: '*/15 * * * *' })

    const titleEdit = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { title: 'Keep custom' }) as any, { params: makeParams({ id: task.id }) })
    expect(titleEdit.status).toBe(200)
    await expect(prisma.task.findUniqueOrThrow({ where: { id: task.id } })).resolves.toMatchObject({ recurrenceRule: '*/15 * * * *' })

    const customReplacement = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { recurrenceRule: '*/30 * * * *' }) as any, { params: makeParams({ id: task.id }) })
    expect(customReplacement.status).toBe(400)

    const presetReplacement = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { recurrenceRule: '0 9 * * 0' }) as any, { params: makeParams({ id: task.id }) })
    expect(presetReplacement.status).toBe(200)
  })

  it('keeps member skip allowed', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id)

    const res = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'skip' }) as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.task.status).toBe('SKIPPED')
  })

  it('cannot skip a completed recurring occurrence', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id, { type: 'RECURRING', recurrenceRule: '0 9 * * 0' })
    await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'complete' }) as any, { params: makeParams({ id: task.id }) })

    const res = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { action: 'skip' }) as any, { params: makeParams({ id: task.id }) })

    expect(res.status).toBe(409)
    await expect(prisma.task.findUniqueOrThrow({ where: { id: task.id } })).resolves.toMatchObject({ status: 'DONE' })
  })

  it('forbids cross-household edits', async () => {
    const { user, profile } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    const otherHousehold = await createHousehold('Other')
    const otherUser = await createUser({ email: 'other-task@test.com' })
    const otherProfile = await createProfile(otherUser.id, otherHousehold.id, { role: 'ADMIN' })
    const otherCategory = await createCategory(otherHousehold.id)
    const task = await createTask(otherHousehold.id, otherCategory.id, otherProfile.id)

    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const res = await PATCH(makeRequest('PATCH', `http://localhost/api/tasks/${task.id}`, { title: 'Bad' }) as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/tasks/[id]', () => {
  useTestDb()



  it('forbids members', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id)

    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/tasks/${task.id}`) as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(403)
  })

  it('deletes a task', async () => {
    const { user, household, profile, category } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const task = await createTask(household.id, category.id, profile.id)

    const req = makeRequest('DELETE', `http://localhost/api/tasks/${task.id}`)
    const res = await DELETE(req as any, { params: makeParams({ id: task.id }) })
    expect(res.status).toBe(200)
  })
})
