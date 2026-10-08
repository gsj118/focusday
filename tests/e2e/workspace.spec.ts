import { test, expect } from '@playwright/test'

test('사이드바 검색·직접 백업·초점 복귀와 목록 집중 상태/동작 분리', async ({ page }) => {
  await page.goto('./')
  const input = page.getByLabel('새 할 일 제목')
  await input.fill('속성을 유지할 일')
  await input.press('Enter')
  await page.getByRole('button', { name: '속성을 유지할 일 편집', exact: true }).click()
  await page.getByLabel('기한', { exact: true }).fill('2099-12-31')
  await page.getByLabel('우선순위').selectOption('high')
  await page.getByLabel('분류 선택').fill('업무')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  const row = page.locator('.task-row')
  await expect(row).toContainText('높음')
  await expect(row).toContainText('업무')
  await expect(row.locator('.focus-label')).toHaveText('오늘 집중')
  await expect(row.locator('.focus-button')).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '속성을 유지할 일 집중 해제', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const nav = page.getByRole('navigation', { name: '할 일 보기', exact: true })
  await nav.getByRole('button', { name: /전체 할 일/ }).click()
  await expect(row.locator('.focus-label')).toHaveCount(0)
  await expect(row.locator('.focus-button')).toHaveAttribute('aria-pressed', 'false')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1')!).tasks[0].dueDate),
  ).toBe('2099-12-31')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByLabel('제목·분류 검색')).toBeFocused()
  await page.keyboard.type('업무')
  await expect(page.locator('.task-row')).toHaveCount(1)
  const backup = page.locator('.sidebar').getByRole('button', { name: '백업·복원', exact: true })
  await backup.click()
  await expect(page.getByRole('dialog', { name: '백업·복원', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(backup).toBeFocused()
})

for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
  [720, 450],
]) {
  test(`작업 UI ${width}×${height}: 긴 정보·독립 조작 영역·내부 스크롤`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('./')
    const input = page.getByLabel('새 할 일 제목')
    const title = '공백없는한글English'.repeat(10)
    await input.fill(title)
    await input.press('Enter')
    await expect(input).toBeFocused()
    const edit = page.getByRole('button', { name: `${title} 편집`, exact: true })
    await edit.click()
    await page.getByLabel('분류 선택').fill('가나다라마바사아자차카타파하ABCDEFGHIJ')
    await page.getByLabel('우선순위').selectOption('high')
    await page.getByLabel('기한', { exact: true }).fill('2099-12-31')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeInViewport()
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await expect(edit).toBeFocused()
    await expect(page.locator('.task-meta')).toContainText('높음')
    await expect(page.locator('.category')).toHaveText('가나다라마바사아자차카타파하ABCDEFGHIJ')
    const targets = await page.locator('.task-row').evaluate((row) => {
      return ['.check-target', '.task-body', '.focus-button'].map((selector) => {
        const box = row.querySelector(selector)!.getBoundingClientRect()
        return { x: box.x, right: box.right, width: box.width, height: box.height }
      })
    })
    for (const box of targets) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    expect(targets[0].right).toBeLessThanOrEqual(targets[1].x)
    expect(targets[1].right).toBeLessThanOrEqual(targets[2].x)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await edit.click()
    await page.getByLabel('분류 선택').focus()
    await expect(page.getByLabel('분류 선택')).toBeInViewport()
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeInViewport()
    await expect(page.getByRole('button', { name: '취소', exact: true })).toBeInViewport()
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.keyboard.press('Escape')
    await expect(edit).toBeFocused()
  })
}

test('필수 입력 경계·체크박스·집중 상태의 실제 대비', async ({ page }) => {
  await page.goto('./')
  await page.getByLabel('새 할 일 제목').fill('대비 확인')
  await page.getByLabel('새 할 일 제목').press('Enter')
  const pairs = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement)
    return [
      ['--control-border', '--surface'],
      ['--control-border', '--quiet'],
      ['--focus', '--surface'],
      ['--accent', '--quiet'],
    ].map((pair) => pair.map((token) => css.getPropertyValue(token).trim()))
  })
  const luminance = (hex: string) =>
    (hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex)
      .slice(1)
      .match(/../g)!
      .map((value) => parseInt(value, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0)
  for (const [a, b] of pairs)
    expect(
      (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05),
    ).toBeGreaterThanOrEqual(3)
})
