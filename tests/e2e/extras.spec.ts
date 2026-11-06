import { expect, test } from '@playwright/test'

// Composants du lot 6, sur leurs pages de documentation.
const docs = 'http://localhost:5181/'

test.describe('range', () => {
  test('moves with the keyboard and shows the value with its unit', async ({ page }) => {
    await page.goto(`${docs}#/range`)
    const block = page.locator('.bd-example-block').first()
    const discount = block.locator('tif-range').nth(1)
    const input = discount.locator('input[type="range"]')
    await input.focus()
    await page.keyboard.press('ArrowRight')
    await expect(discount.locator('output')).toHaveText('20 %')
    await page.keyboard.press('End')
    await expect(discount.locator('output')).toHaveText('50 %')
    const fill = await discount.locator('.tif-range').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--tif-range-fill'))
    expect(fill).toBe('100%')
  })
})

test.describe('tags', () => {
  test('creates, suggests, removes, and the form sends one value per tag', async ({ page }) => {
    await page.goto(`${docs}#/tags`)
    const block = page.locator('.bd-example-block').first()
    const output = block.locator('output')
    await expect(output).toHaveText('{"keywords":["crm","sales"],"skills":[]}')
    const keywords = block.locator('tif-tags').first().locator('input.tif-tags-input')
    await keywords.click()
    await page.keyboard.type('support, ')
    await expect(output).toHaveText('{"keywords":["crm","sales","support"],"skills":[]}')
    await page.keyboard.press('Backspace')
    await expect(output).toHaveText('{"keywords":["crm","sales"],"skills":[]}')
    const skills = block.locator('tif-tags').nth(1).locator('input.tif-tags-input')
    await skills.click()
    await page.keyboard.type('scr')
    await page.locator('.tif-tags-panel').getByRole('option', { name: 'TypeScript' }).click()
    await expect(output).toHaveText('{"keywords":["crm","sales"],"skills":["ts"]}')
    await expect(skills).toBeFocused()
  })
})
