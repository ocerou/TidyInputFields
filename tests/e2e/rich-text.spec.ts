import { expect, test } from '@playwright/test'

// Éditeur riche (tidyinputfields/rich-text), sur sa page de documentation.
const docs = 'http://localhost:5181/'

test.describe('rich text editor', () => {
  test('formats a selection from the toolbar and sends the HTML with the form', async ({ page }) => {
    await page.goto(`${docs}#/rich-text`)
    const block = page.locator('.bd-example-block').first()
    const content = block.locator('.tif-rich-content')
    await content.locator('h2').selectText()
    const toolbar = page.locator('.tif-rich-toolbar')
    await expect(toolbar).toBeVisible()
    await toolbar.getByRole('button', { name: /^Italic/ }).click()
    await expect(content.locator('h2 em')).toHaveText('Agenda')
    // Quitter l'éditeur : « change », le formulaire reçoit le HTML.
    await page.locator('h1').click()
    await expect(block.locator('pre.bd-output')).toContainText('<h2><em>Agenda</em></h2>')
  })

  test('opens the blocks menu with a slash and inserts a table', async ({ page }) => {
    await page.goto(`${docs}#/rich-text`)
    const block = page.locator('.bd-example-block').first()
    const content = block.locator('.tif-rich-content')
    await content.locator('p').last().click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('/')
    const menu = page.locator('.tif-rich-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem').first()).toContainText('Text')
    await page.keyboard.type('table')
    await expect(menu.getByRole('menuitem')).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(menu).toHaveCount(0)
    await expect(content.locator('table tr')).toHaveCount(3)
    await expect(content.locator('table th')).toHaveCount(3)
  })

  test('inserts an emoji and moves a block from its grip menu', async ({ page }) => {
    await page.goto(`${docs}#/rich-text`)
    const block = page.locator('.bd-example-block').first()
    const content = block.locator('.tif-rich-content')
    await content.locator('p').last().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' /:smile')
    const picker = page.locator('.tif-rich-emojis')
    await expect(picker).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(picker).toHaveCount(0)
    await expect(content.locator('span[data-type="emoji"]')).toHaveCount(1)

    // Poignée du titre : son menu le descend sous la liste.
    await content.locator('h2').hover()
    await block.locator('.tif-rich-grip').first().click()
    await page.locator('.tif-rich-menu').getByRole('menuitem', { name: 'Move down' }).click()
    await expect(content.locator('> *').first()).toHaveJSProperty('tagName', 'UL')
  })

  test('mentions a person and offers no image without uploadImage', async ({ page }) => {
    await page.goto(`${docs}#/rich-text`)
    const block = page.locator('.bd-example-block').first()
    await block.getByRole('tab', { name: 'JavaScript API' }).click()
    const content = block.locator('.tif-rich-content')
    await content.locator('p').last().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' @gra')
    const menu = page.locator('.tif-rich-menu')
    await expect(menu.getByRole('menuitem')).toHaveCount(1)
    await expect(menu).toContainText('Guests')
    await page.keyboard.press('Enter')
    await expect(content.locator('span[data-type="mention"]')).toHaveText('@Grace Hopper')
    await expect(block.locator('pre.bd-output')).toContainText('data-id="grace"')

    // L'exemple « Tag » n'a pas d'envoi d'image : pas de bloc Image dans « / ».
    await block.getByRole('tab', { name: 'Tag', exact: true }).click()
    await block.locator('.tif-rich-content p').last().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' /ima')
    await expect(page.locator('.tif-rich-menu')).toContainText('No matches.')
  })
})
