// tests/e2e/restaurantes.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/restaurantes', '/en/restaurantes']) {
  test(`${path} renders, is noindex, and passes a11y`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await checkA11y(page)
  })
}

test('restaurant page pitches weekly nights, marketing help, and a tagged form', async ({
  page,
}) => {
  await page.goto('/en/restaurantes')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/every week/i)
  for (const night of ['Taco Tuesday', 'Tequila Thursday', 'Sunday Brunch']) {
    await expect(page.getByText(night, { exact: true })).toBeVisible()
  }
  await expect(page.getByText(/no substitutes/i)).toBeVisible()
  await expect(page.getByText(/lead software engineer/i).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /see my engineering portfolio/i })).toHaveAttribute(
    'href',
    'https://cesar-portfolio-mu.vercel.app/',
  )
  await expect(page.getByRole('img', { name: /meta ads summary/i })).toBeVisible()
  await expect(page.locator('form input[name="source"]')).toHaveValue('restaurants')
})

for (const path of ['/restaurantes', '/en/restaurantes']) {
  test(`${path} sends an X-Robots-Tag noindex header`, async ({ request }) => {
    const res = await request.get(path)
    expect(res.headers()['x-robots-tag']).toMatch(/noindex/)
    expect(res.headers()['x-robots-tag']).toMatch(/nofollow/)
  })
}

test('restaurant page is not in the sitemap, llms.txt, or the site nav', async ({
  page,
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain('/restaurantes')
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).not.toContain('/restaurantes')
  await page.goto('/en')
  await expect(
    page.locator('header a[href*="restaurantes"], footer a[href*="restaurantes"]'),
  ).toHaveCount(0)
})
