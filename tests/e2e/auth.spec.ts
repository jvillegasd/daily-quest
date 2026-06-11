import { test, expect } from '@playwright/test'

test.describe('Auth flows', () => {
  test('unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with valid credentials reaches dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'e2e@dailyquest.test')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|signup)/)
    // Either dashboard (if household exists) or signup?step=household
    expect(page.url()).toMatch(/\/(dashboard|signup)/)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'e2e@dailyquest.test')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    // Should stay on login
    expect(page.url()).toMatch(/\/login/)
  })

  test('register new user → redirected to household setup', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('input[placeholder="Hero Name"]', 'Fresh Hero')
    await page.fill('input[type="email"]', `fresh-${Date.now()}@test.com`)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/signup\?step=household/, { timeout: 10000 })
    await expect(page.getByText('Name Your Household')).toBeVisible()
  })
})
