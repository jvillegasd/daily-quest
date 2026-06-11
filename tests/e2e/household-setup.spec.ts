import { test, expect } from '@playwright/test'

async function registerAndLogin(page: any, email: string) {
  await page.goto('/signup')
  await page.fill('input[placeholder="Hero Name"]', 'Test Hero')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/signup\?step=household/, { timeout: 10000 })
}

test.describe('Household setup', () => {
  test('creates household and seeds default categories', async ({ page }) => {
    await registerAndLogin(page, `hh-test-${Date.now()}@test.com`)

    // Fill household name using evaluate to trigger React state
    await page.locator('input[placeholder*="Brave House"]').click()
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Brave House"]') as HTMLInputElement
      const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      nativeInputSetter.call(input, 'My Test Household')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.click('button:has-text("Establish Household")')
    await page.waitForURL('/dashboard', { timeout: 10000 })

    await expect(page.getByText('My Test Household')).toBeVisible()
  })
})
