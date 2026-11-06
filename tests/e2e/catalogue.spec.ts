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

test.describe('dates and times', () => {
  const sent = async (page: import('@playwright/test').Page) => JSON.parse((await page.locator('#dates-data').textContent()) ?? '{}')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.selectOption('#language', 'fr')
  })

  test('type a date quickly, validated when leaving the field', async ({ page }) => {
    const due = page.locator('#d-due')
    await expect(due).toHaveAttribute('placeholder', 'jj/mm/aaaa')
    await due.fill('15/3/27')
    expect((await sent(page)).due).toBe('')
    await page.keyboard.press('Tab')
    await expect(due).toHaveValue('15/03/2027')
    expect((await sent(page)).due).toBe('2027-03-15')
  })

  test('choose a day in the calendar, keeping the focus in the field', async ({ page }) => {
    const start = page.locator('#d-start')
    await expect(start).toHaveValue('06/11/2026')
    await start.locator('xpath=following-sibling::button').click()
    const panel = page.locator('.tif-date-panel')
    await expect(panel).toBeVisible()
    await expect(start).toBeFocused()
    await panel.locator('[data-date="2026-11-24"]').click()
    await expect(panel).toHaveCount(0)
    await expect(start).toHaveValue('24/11/2026')
    await expect(start).toBeFocused()
    expect((await sent(page)).start).toBe('2026-11-24')
  })

  test('pick a time with the clock', async ({ page }) => {
    const at = page.locator('#d-at')
    await at.click()
    await page.keyboard.press('Alt+ArrowDown')
    const panel = page.locator('.tif-time-panel')
    await panel.locator('.tif-time-column').first().getByRole('button', { name: '08', exact: true }).click()
    await expect(panel).toBeVisible()
    await panel.locator('.tif-time-column').nth(1).getByRole('button', { name: '45', exact: true }).click()
    await expect(panel).toHaveCount(0)
    expect((await sent(page)).at).toBe('08:45')
  })

  test('choose a relative period with the keyboard', async ({ page }) => {
    const button = page.locator('#d-signature button')
    await button.focus()
    await page.keyboard.press('ArrowDown')
    const panel = page.locator('.tif-period-panel')
    await expect(panel).toBeVisible()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await page.keyboard.press('ArrowRight')
    await expect(panel.locator('.tif-listbox-search-input')).toBeFocused()
    await page.keyboard.type('janvier 2027')
    await page.keyboard.press('Enter')
    await expect(panel).toHaveCount(0)
    await expect(button).toHaveText('Signature : janvier 2027')
    await expect(button).toBeFocused()
    expect(JSON.parse((await sent(page)).signature)).toEqual({ operator: 'period', unit: 'month', from: 2, to: 2 })
  })

  test('apply specific dates through a calendar opened inside the panel', async ({ page }) => {
    await page.locator('#d-signature button').click()
    const panel = page.locator('.tif-period-panel')
    await panel.getByRole('option', { name: 'Dates précises' }).click()
    const from = panel.locator('.tif-picker-input').first()
    await expect(from).toBeFocused()
    await panel.locator('.tif-picker-button').first().click()
    const calendar = page.locator('.tif-date-panel')
    await expect(calendar).toBeVisible()
    await calendar.locator('[data-date="2026-11-02"]').click()
    await expect(calendar).toHaveCount(0)
    await expect(panel).toBeVisible()
    await panel.locator('.tif-picker-input').nth(1).fill('30/11/2026')
    await panel.getByRole('button', { name: 'Appliquer' }).click()
    await expect(panel).toHaveCount(0)
    await expect(page.locator('#d-signature button')).toHaveText('Signature : 02/11/2026 – 30/11/2026')
  })

  test('close nested panels one at a time with Escape', async ({ page }) => {
    await page.locator('#d-signature button').click()
    const panel = page.locator('.tif-period-panel')
    await panel.getByRole('option', { name: 'Dates précises' }).click()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(page.locator('.tif-date-panel')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.tif-date-panel')).toHaveCount(0)
    await expect(panel.locator('.tif-period-between')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel.getByRole('option', { name: 'Mois en cours' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
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
