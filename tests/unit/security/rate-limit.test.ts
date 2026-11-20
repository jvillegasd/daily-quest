import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientIp } from '@/lib/security/rate-limit'

const req = (headers: Record<string, string>) => new Request('http://localhost/api/x', { headers })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('clientIp', () => {
  describe('default (no trusted proxy)', () => {
    it('uses the first x-forwarded-for entry', () => {
      expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1')
    })

    it('falls back to x-real-ip, then unknown', () => {
      expect(clientIp(req({ 'x-real-ip': '3.3.3.3' }))).toBe('3.3.3.3')
      expect(clientIp(req({}))).toBe('unknown')
    })

    it('ignores cf-connecting-ip', () => {
      expect(clientIp(req({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1')
    })
  })

  describe('TRUST_PROXY=cloudflare', () => {
    it('uses cf-connecting-ip and ignores a spoofed x-forwarded-for', () => {
      vi.stubEnv('TRUST_PROXY', 'cloudflare')
      expect(clientIp(req({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe('9.9.9.9')
    })

    it('does not fall back to spoofable headers when cf-connecting-ip is missing', () => {
      vi.stubEnv('TRUST_PROXY', 'cloudflare')
      expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '7.7.7.7' }))).toBe('unknown')
    })
  })
})
