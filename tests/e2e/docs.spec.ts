import { expect, test } from '@playwright/test'

const docs = 'http://localhost:5181/'

test.describe('documentation', () => {
  test('every page and every example tab renders without error', async ({ page }) => {
    test.setTimeout(120000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`${page.url()} ${e.message}`))
    await page.goto(`${docs}#/introduction`)
    const links = await page.locator('.bd-sidebar a').evaluateAll((a) => a.map((link) => link.getAttribute('href')!))
    expect(links.length).toBeGreaterThan(20)
    for (const href of links) {
      await page.goto(`${docs}${href}`)
      await expect(page.locator('h1')).toBeVisible()
      const blocks = page.locator('.bd-example-block')
      for (let i = 0; i < (await blocks.count()); i++) {
        const tabs = blocks.nth(i).getByRole('tab')
        for (let j = (await tabs.count()) - 1; j >= 0; j--) {
          await tabs.nth(j).click()
          await expect(blocks.nth(i).locator('.bd-example > *').first()).toBeAttached()
        }
      }
    }
    expect(errors).toEqual([])
  })

  test('the React example works like the HTML one', async ({ page }) => {
    await page.goto(`${docs}#/introduction`)
    const block = page.locator('.bd-example-block').first()
    await block.getByRole('tab', { name: 'React' }).click()
    await block.locator('tif-text input').fill('Grace')
    await block.locator('tif-text input').press('Tab')
    await block.getByRole('radio', { name: 'Team' }).click()
    await expect(block.locator('output')).toHaveText('{"name":"Grace","start":"","plan":"team"}')
    await block.getByRole('tab', { name: 'HTML' }).click()
    await expect(block.locator('.bd-example')).toHaveAttribute('data-mode', 'vanilla')
  })
})
