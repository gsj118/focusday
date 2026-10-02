import { test, expect } from '@playwright/test'

test('모바일 터치·작은 가시 영역 편집·알림과 하단 탐색 분리', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
  })
  const page = await context.newPage()
  await page.goto(baseURL!)
  await page.getByLabel('새 할 일 제목').fill('터치 테스트')
  await page.getByRole('button', { name: '+ 할 일 추가', exact: true }).tap()
  await page.getByRole('button', { name: '터치 테스트 편집', exact: true }).tap()
  await page.setViewportSize({ width: 390, height: 480 })
  await page.getByLabel('분류 선택').fill('모바일')
  await page.getByLabel('분류 선택').scrollIntoViewIfNeeded()
  await expect(page.getByLabel('분류 선택')).toBeInViewport()
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeInViewport()
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  )
  expect((await page.getByRole('dialog').boundingBox())!.height).toBeLessThanOrEqual(480)
  await page.getByRole('button', { name: '저장', exact: true }).tap()
  await page.setViewportSize({ width: 390, height: 844 })
  const target = page.locator('.check-target').first()
  const bounds = (await target.boundingBox())!
  expect(bounds.width).toBeGreaterThanOrEqual(44)
  expect(bounds.height).toBeGreaterThanOrEqual(44)
  await target.tap()
  const toast = (await page.locator('.undo-toast').boundingBox())!
  const navigation = (await page.getByRole('navigation', { name: '모바일 보기' }).boundingBox())!
  expect(toast.y + toast.height).toBeLessThanOrEqual(navigation.y)
  await page.getByRole('button', { name: '실행 취소', exact: true }).tap()
  await expect(page.getByText('모바일', { exact: true })).toBeVisible()
  await context.close()
})

test('실제 렌더링 색·hover·포커스·접근 가능한 입력과 버튼 이름', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '예시로 둘러보기', exact: true }).last().click()
  const luminance = (rgb: string) =>
    rgb
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => v / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0)
  const contrast = (a: string, b: string) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  const samples = await page.evaluate(() =>
    [
      '.task-title',
      '.meta-overdue',
      '.category',
      '.focus-label',
      '.primary-button',
      '.header-date',
    ].map((selector) => {
      const element = document.querySelector(selector)!
      let parent: Element | null = element
      let background = 'rgb(255, 255, 255)'
      while (parent) {
        const color = getComputedStyle(parent).backgroundColor
        if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          background = color
          break
        }
        parent = parent.parentElement
      }
      return { selector, color: getComputedStyle(element).color, background }
    }),
  )
  for (const sample of samples)
    expect(contrast(sample.color, sample.background), sample.selector).toBeGreaterThanOrEqual(4.5)
  const add = page.getByRole('button', { name: '추가', exact: true })
  await add.hover()
  const hovered = await add.evaluate((el) => ({
    color: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor,
  }))
  expect(contrast(hovered.color, hovered.background)).toBeGreaterThanOrEqual(4.5)
  await page.getByLabel('새 할 일 제목').focus()
  await page.keyboard.press('Tab')
  const outline = await add.evaluate((el) => ({
    style: getComputedStyle(el).outlineStyle,
    width: getComputedStyle(el).outlineWidth,
    color: getComputedStyle(el).outlineColor,
  }))
  expect(outline.style).toBe('solid')
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(3)
  expect(contrast(outline.color, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3)
  await page.getByRole('button', { name: '발표 자료 최종 확인 편집', exact: true }).click()
  expect(
    await page.locator('input, textarea, select, button').evaluateAll((elements) =>
      elements
        .filter((el) => {
          if (!(el instanceof HTMLElement) || el.getClientRects().length === 0) return false
          if (el.getAttribute('aria-label') || el.textContent?.trim()) return false
          return !('labels' in el && (el as HTMLInputElement).labels?.length)
        })
        .map((el) => el.outerHTML),
    ),
  ).toEqual([])
  await page.getByRole('button', { name: '저장', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '편집 닫기' })).toBeFocused()
})
