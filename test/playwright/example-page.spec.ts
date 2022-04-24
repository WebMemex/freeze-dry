import { test, expect, Page } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  // Prevent appending OS name to snapshot files.
  testInfo.snapshotSuffix = ''
})

async function prechecks(page: Page) {
  await expect(page.locator('h1'), 'Precheck failed: Page not loaded?').toContainText('Test page')
  await expect(await page.evaluate('typeof freezeDry'), 'Precheck failed: freezeDry is not a function').toBe('function')
}

test('Freeze-dry output on page page-with-links matches reference snapshot.', async ({ page }) => {
  await page.goto('/pages/page-with-links.html')
  await prechecks(page)
  const html = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await expect(html).toMatchSnapshot('page-with-links.html')
})

test('Freeze-dry output on page page-with-images matches reference snapshot.', async ({ page }) => {
  await page.goto('/pages/page-with-images.html')
  await prechecks(page)
  const html = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await expect(html).toMatchSnapshot('page-with-images.html')
})

test('Freeze-dry output on page page-with-scripts matches reference snapshot.', async ({ page }) => {
  await page.goto('/pages/page-with-scripts.html')
  await prechecks(page)
  const html = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await expect(html).toMatchSnapshot('page-with-scripts.html')
})

test('Freeze-dry output on page page-with-styles matches reference snapshot.', async ({ page }) => {
  await page.goto('/pages/page-with-styles.html')
  await prechecks(page)
  const html = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await expect(html).toMatchSnapshot('page-with-styles.html')
})

test('Freeze-dry output on page page-with-frames matches reference snapshot.', async ({ page }) => {
  await page.goto('/pages/page-with-frames.html')
  await prechecks(page)
  const html = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await expect(html).toMatchSnapshot('page-with-frames.html')
})

test('should capture current state of documents inside frames', async ({ page }) => {
  await page.goto('/pages/page-with-frames.html')
  await prechecks(page)

  // Modify the iframe contents: add an <hr> element.
  const addAnElementScript = `
    for (const iframe of document.querySelectorAll('iframe')) {
      const innerDoc = iframe.contentDocument
      innerDoc.body.appendChild(innerDoc.createElement('hr'))
    }
  `
  await page.evaluate(addAnElementScript)

  // Start freeze-dry and modify the DOM before it finishes.
  // Multiple steps are run in one evaluate() call to ensure the modification is done directly.
  const dryHtml: string = await page.evaluate(`
    (async () => {
      // Start freeze-dry.
      const resultP = freezeDry(document, { now: new Date(1534615340948) })
      // Directly add a second <hr> element inside the frame.
      ${addAnElementScript}
      // Wait for freeze-dry to finish.
      return await resultP
    })()
  `)

  // To facilitate verifying the output, load it into the page.
  await page.setContent(dryHtml)
  // Check that each frame contains exactly one <hr> element.
  await expect(page.frame('src').locator('hr').count()).resolves.toBe(1)
  await expect(page.frame('src-srcdoc').locator('hr').count()).resolves.toBe(1)
  await expect(page.frame('srcdoc').locator('hr').count()).resolves.toBe(1)
  await expect(page.frame('empty').locator('hr').count()).resolves.toBe(1)
})

test('should be idempotent (freeze-drying a second time makes no difference).', async ({ page }) => {
  await page.goto('/pages/page-with-frames.html') // an arbitrary page.
  await prechecks(page)

  const dryHtml: string = await page.evaluate('freezeDry(document, { now: new Date(1534615340948) })')
  await page.setContent(dryHtml)

  // Freeze-dry the freeze-dried page. Adding metadata would of course break idempotency.
  const extraDryHtml: string = await page.evaluate('freezeDry(document, { addMetadata: false })')

  expect(extraDryHtml).toEqual(dryHtml)
})
