import { expect, test } from '@playwright/test'

// Le sélecteur de couleur, sur sa page de documentation (onglet « JavaScript API »).
test.describe('colour picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5181/#/color-picker')
    await page.getByRole('tab', { name: 'JavaScript API' }).first().click()
  })

  test('drags in the range, loops with Tab, cancels with Escape and applies with Enter', async ({ page }) => {
    const button = page.locator('#brand .tif-color-picker')
    await expect(button).toContainText('#062B6F')
    await button.click()
    const panel = page.locator('.tif-color-panel')
    const red = panel.getByLabel('Red', { exact: true })
    await expect(red).toBeFocused()

    // Glisser dans la gamme change la couleur ; Échap referme sans rien changer.
    const field = panel.locator('.tif-color-field')
    const box = (await field.boundingBox())!
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + 10)
    await page.mouse.up()
    await expect(panel.getByLabel('Hex')).not.toHaveValue('#062B6F')
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(button).toBeFocused()
    await expect(button).toContainText('#062B6F')

    // Tab boucle dans le panneau ; Entrée applique la couleur saisie.
    await button.click()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
    }
    await expect(panel.locator(':focus')).toHaveCount(1)
    await red.focus()
    await page.keyboard.type('255')
    await panel.getByLabel('Transparency in percent').fill('25')
    await page.keyboard.press('Enter')
    await expect(panel).toHaveCount(0)
    await expect(page.locator('.bd-example output')).toHaveText('brand = "#FF2B6FBF"')
  })
})
