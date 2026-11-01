import { expect, horizontalOverflow, test, unexpectedErrors } from '../support/fixtures'

// The current site has no WebGL scene: no public page creates a WebGL context
// (the only canvases are 2D, in the QR scanner and the media upload helper).
// These tests prove the public pages work when WebGL is unavailable and fail
// loudly if a page starts requesting WebGL, so a real rendering test gets
// added alongside it instead of the feature going untested.

declare global {
  interface Window { __contextRequests?: string[] }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const requests: string[] = []
    window.__contextRequests = requests
    const original = HTMLCanvasElement.prototype.getContext as (...args: unknown[]) => unknown
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      requests.push(type)
      if (/webgl/i.test(type)) return null
      return original.apply(this, [type, ...rest])
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = OffscreenCanvas.prototype.getContext as (...args: unknown[]) => unknown
      OffscreenCanvas.prototype.getContext = function (this: OffscreenCanvas, type: string, ...rest: unknown[]) {
        requests.push(`offscreen:${type}`)
        if (/webgl/i.test(type)) return null
        return offscreen.apply(this, [type, ...rest])
      } as unknown as typeof OffscreenCanvas.prototype.getContext
    }
  })
})

for (const path of ['/', '/congres', '/despre', '/proiecte']) {
  test(`${path} stays usable with WebGL disabled and never requests WebGL`, async ({ page, pageErrors }) => {
    await page.goto(path, { waitUntil: 'load' })

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('main#site-main')).toBeVisible()
    await expect(page.getByRole('link', { name: 'ASMM — Acasă' }).first()).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    expect(unexpectedErrors(pageErrors)).toEqual([])

    const requests = await page.evaluate(() => window.__contextRequests ?? [])
    expect(
      requests.filter(type => /webgl/i.test(type)),
      'A public page requested WebGL. Add a real rendering test for it (see docs/testing.md).'
    ).toEqual([])
  })
}
