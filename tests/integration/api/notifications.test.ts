import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { GET } from '@/app/api/notifications/route'
import { POST as POST_READ } from '@/app/api/notifications/read/route'
import { notificationsService } from '@/lib/services/notifications.service'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'
import { seedFullHousehold, createTask } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

describe('notificationsService inbox', () => {
  useTestDb()

  it('creates a TASK_ASSIGNED notification for the assignee', async () => {
    const { household, profile, category } = await seedFullHousehold()
    const task = await createTask(household.id, category.id, profile.id, { assignedToId: profile.id })

    await notificationsService.sendTaskAssigned(task as never)

    const notifs = await prisma.notification.findMany({ where: { profileId: profile.id } })
    expect(notifs).toHaveLength(1)
    expect(notifs[0].type).toBe('TASK_ASSIGNED')
    expect(notifs[0].readAt).toBeNull()
  })

  it('suppresses the notification when the preference is disabled', async () => {
    const { household, profile, category } = await seedFullHousehold()
    await prisma.notificationPreference.create({
      data: { profileId: profile.id, eventType: 'TASK_ASSIGNED', enabled: false },
    })
    const task = await createTask(household.id, category.id, profile.id, { assignedToId: profile.id })

    await notificationsService.sendTaskAssigned(task as never)

    const notifs = await prisma.notification.findMany({ where: { profileId: profile.id } })
    expect(notifs).toHaveLength(0)
  })
})

describe('GET /api/notifications + POST /api/notifications/read', () => {
  useTestDb()

  it('lists notifications with unread count, then marks them read (scoped to caller)', async () => {
    const { user, profile } = await seedFullHousehold()
    await prisma.notification.create({
      data: { profileId: profile.id, type: 'TASK_ASSIGNED', title: 'T', body: 'B' },
    })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const listRes = await GET()
    expect(listRes.status).toBe(200)
    const data = await listRes.json()
    expect(data.items).toHaveLength(1)
    expect(data.unread).toBe(1)

    const readReq = makeRequest('POST', 'http://localhost/api/notifications/read', {})
    const readRes = await POST_READ(readReq as never)
    expect(readRes.status).toBe(200)
    expect(
      await prisma.notification.count({ where: { profileId: profile.id, readAt: null } })
    ).toBe(0)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
