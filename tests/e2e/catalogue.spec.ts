import { expect, test } from '@playwright/test'

test.describe('catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the version', async ({ page }) => {
    await expect(page.locator('#version')).toHaveText('0.0.0')
  })

  test('confirms with Enter and cancels with Escape', async ({ page }) => {
    await page.click('[data-demo=confirm]')
    const dialog = page.locator('dialog.tif-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.tif-btn-primary')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('#confirm-result')).toHaveText('Cancelled')
    await page.click('[data-demo=confirm-danger]')
    await expect(dialog.locator('.tif-btn-danger')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#confirm-result')).toHaveText('Confirmed')
  })

  test('closes the floating panel on outside click and on Escape', async ({ page }) => {
    const button = page.locator('[data-demo=panel]')
    await button.click()
    const panel = page.locator('.tif-panel')
    await expect(panel).toBeVisible()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    const box = (await panel.boundingBox())!
    const anchor = (await button.boundingBox())!
    // Sous le champ, ou au-dessus s'il manque de place en bas : jamais dessus, et toujours dans la fenêtre.
    const below = box.y >= anchor.y + anchor.height
    const above = box.y + box.height <= anchor.y
    expect(below || above).toBe(true)
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    await page.mouse.click(5, 5)
    await expect(panel).toHaveCount(0)
    await expect(page.locator('#panel-result')).toHaveText('Closed: outside')
    await button.click()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(page.locator('#panel-result')).toHaveText('Closed: escape')
    await expect(button).toBeFocused()
    await button.click()
    await page.waitForTimeout(300)
    await expect(panel).toBeVisible()
    await page.mouse.wheel(0, 200)
    await expect(panel).toHaveCount(0)
    await expect(page.locator('#panel-result')).toHaveText('Closed: scroll')
  })

  test('translates when the language changes', async ({ page }) => {
    await page.selectOption('#language', 'fr')
    await expect(page.getByRole('cell', { name: 'Annuler' })).toBeVisible()
    await page.click('[data-demo=confirm]')
    await expect(page.locator('dialog .tif-btn-primary')).toHaveText('Confirmer')
  })

  test('switches to the dark theme', async ({ page }) => {
    const surface = () => page.locator('.tif').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--_surface').trim())
    await page.selectOption('#theme', 'light')
    expect(await surface()).toBe('#fff')
    await page.selectOption('#theme', 'dark')
    expect(await surface()).toBe('#1a2026')
  })
})

test.describe('simple fields', () => {
  const sent = async (page: import('@playwright/test').Page) => JSON.parse((await page.locator('#form-data').textContent()) ?? '{}')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('send their values with the form', async ({ page }) => {
    expect(await sent(page)).toEqual({
      title: '',
      email: '',
      quantity: '3',
      notes: '',
      active: 'on',
      duration: '12',
      price: '1250',
      mode: 'keep',
      size: 'M',
    })
    await page.fill('#f-title', 'Offer')
    await page.selectOption('#f-country', 'it')
    await page.click('#f-active')
    expect(await sent(page)).toMatchObject({ title: 'Offer', country: 'it' })
    expect((await sent(page)).active).toBeUndefined()
  })

  test('keep the unit right after the digits, agreed with the number', async ({ page }) => {
    const input = page.locator('#f-duration')
    const label = page.locator('#f-duration').locator('xpath=following-sibling::span')
    await expect(label).toHaveText('months')
    await input.fill('1')
    await expect(label).toHaveText('month')
    const inputBox = (await input.boundingBox())!
    const labelBox = (await label.boundingBox())!
    expect(labelBox.x - (inputBox.x + inputBox.width)).toBeLessThan(10)
    await label.click()
    await expect(input).toBeFocused()
  })

  test('choose with the keyboard in a selector', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Mode' })
    await group.getByRole('radio', { name: 'Keep' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(group.getByRole('radio', { name: 'Update' })).toBeFocused()
    await expect(group.getByRole('radio', { name: 'Update' })).toHaveAttribute('aria-checked', 'true')
    expect((await sent(page)).mode).toBe('update')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    expect((await sent(page)).mode).toBe('ask')
    const widths = await group.getByRole('radio').evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().width)))
    expect(new Set(widths).size).toBe(1)
  })

  test('turn quiet', async ({ page }) => {
    // toHaveCSS attend la fin de la transition de couleur.
    const title = page.locator('#f-title')
    const before = await title.evaluate((el) => getComputedStyle(el).borderTopColor)
    await page.click('#quiet-fields')
    await expect(title).toHaveClass(/tif-quiet/)
    await expect(title).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
    await expect(page.locator('#f-duration').locator('xpath=..')).toHaveClass(/tif-quiet/)
    await page.click('#quiet-fields')
    await expect(title).toHaveCSS('border-top-color', before)
  })
})

test.describe('with Bootstrap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bootstrap.html')
  })

  test('takes the look of Bootstrap', async ({ page }) => {
    const field = page.locator('.tif-field').first()
    expect(await field.evaluate((el) => getComputedStyle(el).height)).toBe('38px')
    const button = page.locator('[data-demo=confirm]')
    expect(await button.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('6px')
    expect(await page.locator('.tif').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--_accent').trim())).toBe('#0d6efd')
  })

  test('keeps panels and confirmations inside a modal', async ({ page }) => {
    await page.click('[data-demo=open-modal]')
    const modal = page.locator('#demo-modal')
    await expect(modal).toBeVisible()
    const button = modal.locator('[data-demo=panel]')
    await button.click()
    const panel = modal.locator('.tif-panel')
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(modal).toBeVisible()
    await expect(button).toBeFocused()

    await modal.locator('[data-demo=confirm-danger]').click()
    const dialog = modal.locator('dialog.tif-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.tif-btn-danger')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.locator('.tif-btn').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(modal).toBeVisible()
  })

  test('loads next to jQuery', async ({ page }) => {
    expect(await page.evaluate(() => typeof (window as unknown as { jQuery: unknown }).jQuery)).toBe('function')
  })
})
