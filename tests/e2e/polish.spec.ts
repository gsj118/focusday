import { test, expect } from '@playwright/test'

for (const [width, height] of [
  [1366, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
]) {
  test(`메모 접근·긴 정리 결과·키보드 편집·탐색 복귀 ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('./?demo=1')
    const memo = page.getByLabel('할 일 메모', { exact: true })
    if (width < 900) {
      const nav = page.getByRole('navigation', { name: '모바일 보기', exact: true })
      for (const button of await nav.getByRole('button').all()) {
        const box = await button.boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
        const labelLines = await button
          .locator('span')
          .first()
          .evaluate(
            (el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight),
          )
        expect(labelLines).toBeLessThanOrEqual(1.05)
      }
      await nav.getByRole('button', { name: '메모 입력', exact: true }).click()
    } else {
      const box = await memo.boundingBox()
      expect(box!.width).toBeGreaterThan(400)
      await page.getByRole('button', { name: '메모 담기', exact: true }).click()
    }
    await expect(memo).toBeFocused()
    const memoBox = await memo.boundingBox()
    expect(memoBox!.y).toBeGreaterThanOrEqual(0)
    expect(memoBox!.y + memoBox!.height).toBeLessThan(height - (width < 900 ? 68 : 0))
    await memo.fill(Array.from({ length: 10 }, (_, i) => `내일 검토할 일 ${i + 1}`).join('\n'))
    await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
    const list = page.locator('.capture-review-list')
    const bounds = await list.evaluate((el) => ({
      client: el.clientHeight,
      scroll: el.scrollHeight,
    }))
    expect(bounds.scroll).toBeGreaterThan(bounds.client)
    expect(bounds.client).toBeLessThanOrEqual(340)
    const last = page.getByLabel('정리한 제목 10', { exact: true })
    await last.fill('마지막 항목도 수정')
    await last.press('Tab')
    await expect(
      page.getByRole('button', { name: '마지막 항목도 수정 정리 결과에서 제외', exact: true }),
    ).toBeFocused()
    await page.getByRole('button', { name: '10개 담기', exact: true }).click()
    if (width < 900) {
      const nav = page.getByRole('navigation', { name: '모바일 보기', exact: true })
      await nav.getByRole('button', { name: /^오늘/ }).click()
      await expect(page.getByRole('heading', { name: '오늘 할 일', exact: true })).toBeInViewport()
      expect(await page.evaluate(() => scrollY)).toBe(0)
      await nav.getByRole('button', { name: /전체 할 일/ }).click()
    } else {
      await page
        .getByRole('navigation', { name: '할 일 보기', exact: true })
        .getByRole('button', { name: /전체 할 일/ })
        .click()
    }
    await expect(
      page.getByRole('button', { name: '마지막 항목도 수정 편집', exact: true }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('완료와 남은 기한은 문구·아이콘·표면 색으로 구별한다', async ({ page }) => {
  await page.goto('./?demo=1')
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: '완료했어요', exact: true }).click()
  const done = page.getByRole('region', { name: '오늘 계획 완료 안내', exact: true })
  await expect(done).toContainText('오늘 분량을 다 마쳤어요.')
  const success = await done.evaluate((el) => ({
    color: getComputedStyle(el).backgroundColor,
    icon: el.querySelector('.finish-mark')!.innerHTML,
  }))
  await page.getByLabel('할 일 메모').fill('오늘 반드시 제출하기')
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
  await page.getByRole('button', { name: '1개 담기', exact: true }).click()
  await page
    .getByRole('region', { name: '지금 할 일', exact: true })
    .getByRole('button', { name: /편집$/ })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('checkbox', { name: '오늘에서 빼기', exact: true })
    .uncheck()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  const warning = page.getByRole('region', { name: '오늘 기한 확인 안내', exact: true })
  await expect(warning).toContainText('오늘까지 할 일이 남아 있어요.')
  await expect(
    warning.getByRole('button', { name: '남은 일 오늘에 넣기', exact: true }),
  ).toBeVisible()
  const attention = await warning.evaluate((el) => ({
    color: getComputedStyle(el).backgroundColor,
    icon: el.querySelector('.finish-mark')!.innerHTML,
  }))
  expect(attention.color).not.toBe(success.color)
  expect(attention.icon).not.toBe(success.icon)
  await expect(done).toHaveCount(0)
})
