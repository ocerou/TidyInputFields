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

  test('every component example is shown in three ways, each one building a real component', async ({ page }) => {
    test.setTimeout(120000)
    const pages = ['text', 'select', 'switch', 'unit', 'selector', 'date', 'time', 'date-time', 'period', 'search-select', 'multi-select', 'lookup', 'sortable-list']
    for (const id of pages) {
      await page.goto(`${docs}#/${id}`)
      const blocks = page.locator('.bd-example-block').filter({ has: page.getByRole('tab', { name: 'data-tif attributes' }) })
      expect(await blocks.count(), id).toBeGreaterThan(0)
      for (let i = 0; i < (await blocks.count()); i++) {
        const block = blocks.nth(i)
        await expect(block.getByRole('tab')).toHaveText(['Tag', 'data-tif attributes', 'JavaScript API', 'React'])
        for (const tab of ['Tag', 'data-tif attributes', 'JavaScript API', 'React']) {
          await block.getByRole('tab', { name: tab, exact: true }).click()
          // Chaque façon construit le composant : ses éléments .tif sont là.
          await expect(block.locator('.bd-example .tif').first(), `${id} ${i} ${tab}`).toBeAttached()
        }
      }
    }
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
