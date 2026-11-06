import { expect, test } from '@playwright/test'

test('the catalogue loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#version')).toHaveText('0.0.0')
})
