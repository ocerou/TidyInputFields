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

test.describe('rating', () => {
  test('previews on hover, chooses by click and keyboard', async ({ page }) => {
    await page.goto(`${docs}#/rating`)
    const block = page.locator('.bd-example-block').first()
    const rating = block.locator('tif-rating').first()
    await rating.getByRole('radio', { name: '5 stars out of 5' }).hover()
    await expect(rating.locator('.tif-rating')).toHaveClass(/tif-rating-hover/)
    await rating.getByRole('radio', { name: '4 stars out of 5' }).click()
    await expect(rating.getByRole('radio', { name: '4 stars out of 5' })).toHaveAttribute('aria-checked', 'true')
    await expect(rating.getByRole('radio', { name: '4 stars out of 5' })).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(rating.getByRole('radio', { name: '3 stars out of 5' })).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('money', () => {
  test('edits raw, shows the format of the language, and sends a number and its currency', async ({ page }) => {
    await page.goto(`${docs}#/money`)
    const block = page.locator('.bd-example-block').first()
    const price = block.locator('tif-money').first().locator('input.tif-money-input')
    await expect(price).toHaveValue('1,234.50')
    await price.click()
    await expect(price).toHaveValue('1234.5')
    await page.keyboard.type('9876.543')
    await page.keyboard.press('Tab')
    await expect(price).toHaveValue('9,876.54')
    const budget = block.locator('tif-money').nth(1)
    await budget.locator('select').selectOption('GBP')
    await budget.locator('input.tif-money-input').fill('2500')
    await budget.locator('input.tif-money-input').press('Enter')
    await expect(block.locator('output')).toHaveText('{"price":"9876.54","budget":"2500","budget_currency":"GBP"}')
  })
})

test.describe('file', () => {
  test('adds chosen and dropped files, sets aside the wrong ones, and the form sends them', async ({ page }) => {
    await page.goto(`${docs}#/file`)
    const block = page.locator('.bd-example-block').first()
    const component = block.locator('tif-file')
    // Choisis dans la fenêtre du système (le champ natif).
    await component.locator('input[type="file"]').setInputFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('png') },
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('txt') },
    ])
    await expect(component.locator('.tif-file-name')).toHaveText(['photo.png'])
    await expect(component.locator('.tif-file-message')).toContainText('notes.txt')
    // Déposés sur la zone.
    const transfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer()
      dt.items.add(new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' }))
      return dt
    })
    await component.locator('.tif-file-drop').dispatchEvent('drop', { dataTransfer: transfer })
    await expect(component.locator('.tif-file-name')).toHaveText(['photo.png', 'invoice.pdf'])
    await expect(block.locator('output')).toHaveText('["photo.png","invoice.pdf"]')
    await component.getByRole('button', { name: 'Remove photo.png' }).click()
    await expect(block.locator('output')).toHaveText('["invoice.pdf"]')
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

test.describe('search-select fed by fetch', () => {
  test('asks the API at each search, and again with the React filter', async ({ page }) => {
    await page.goto(`${docs}#/search-select`)
    const block = page.locator('#example-search-fetch')
    // Libellé de la valeur de départ, lu par sourceLabel.
    await expect(block.locator('.bd-example button').first()).toHaveText(/Hugo Martin/)
    await block.locator('.bd-example button').first().click()
    const panel = page.locator('.tif-listbox-panel:visible')
    await expect(panel).toContainText('First 20 of 155')
    await page.keyboard.type('chloe dubois')
    await expect(panel.getByRole('option')).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(block.locator('output')).toHaveText('p27')

    await block.getByRole('tab', { name: 'React' }).click()
    await block.locator('.bd-example select').selectOption('Lyon')
    await block.locator('.bd-example button').first().click()
    await expect(page.locator('.tif-listbox-panel:visible')).toContainText('First 20 of 31')
  })
})
