import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/webhooks/cron/route'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'

vi.mock('@/lib/services/notifications.service', () => ({
  notificationsService: {
    sendDailyDigest: vi.fn().mockResolvedValue(undefined),
    sendPendingReminder: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('POST /api/webhooks/cron', () => {
  useTestDb()

  it('returns 401 without authorization header', async () => {
    const req = makeRequest('POST', 'http://localhost/api/webhooks/cron')
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const req = makeRequest('POST', 'http://localhost/api/webhooks/cron', undefined, {
      authorization: 'Bearer wrong-secret',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 200 with correct CRON_SECRET', async () => {
    const req = makeRequest('POST', 'http://localhost/api/webhooks/cron', undefined, {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
