import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

function loadSw(origin = 'https://daily-quest.test') {
  const context = {
    URL,
    module: { exports: {} as { shouldHandleRequest?: (request: Request) => boolean } },
    self: { location: { origin }, addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
    caches: { open() {}, keys() {} },
    fetch() {},
  }
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), context)
  return context.module.exports.shouldHandleRequest!
}

describe('service worker request filter', () => {
  it('ignores cross-origin avatar requests', () => {
    expect(loadSw()(new Request('https://lh3.googleusercontent.com/avatar.png'))).toBe(false)
  })

  it('ignores Next static assets', () => {
    expect(loadSw()(new Request('https://daily-quest.test/_next/static/chunks/app.css'))).toBe(false)
  })

  it('handles same-origin pages', () => {
    expect(loadSw()(new Request('https://daily-quest.test/dashboard'))).toBe(true)
  })
})
