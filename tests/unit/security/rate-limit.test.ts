import { describe, expect, it } from 'vitest'
import { clientIp } from '@/lib/security/rate-limit'

const req = (headers: Record<string, string>) => new Request('http://localhost/api/x', { headers })

describe('clientIp', () => {
  it('uses cf-connecting-ip and ignores a spoofed x-forwarded-for', () => {
    expect(clientIp(req({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe('9.9.9.9')
  })

  it('does not fall back to spoofable headers when cf-connecting-ip is missing', () => {
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '7.7.7.7' }))).toBe('unknown')
    expect(clientIp(req({}))).toBe('unknown')
  })
})
