import { test, expect } from '@playwright/test'

test('B03/B05/B06/B07: 네 우선순위·날짜·분류 경계·Enter/Space 실제 저장', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
  await page.goto('./')
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
  await page.getByLabel('새 할 일 제목').fill('상세 경계')
  await page.keyboard.press('Enter')
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1')!).tasks[0])
  const original = await read()
  for (const [priority, due] of [
    ['none', '2026-10-03'],
    ['low', '2026-10-02'],
    ['medium', '2026-10-01'],
    ['high', ''],
  ] as const) {
    await page.locator('.task-body').click()
    await page.getByLabel('기한', { exact: true }).fill(due)
    await page.getByLabel('우선순위').selectOption(priority)
    await page.getByLabel('분류 선택').fill(priority === 'high' ? '   ' : '분'.repeat(24))
    if (priority === 'none') await page.getByLabel('분류 선택').press('Enter')
    else {
      await page.getByRole('button', { name: '저장', exact: true }).focus()
      await page.keyboard.press('Space')
    }
    expect(await read()).toMatchObject({
      id: original.id,
      createdAt: original.createdAt,
      priority,
      dueDate: due || null,
      category: priority === 'high' ? null : '분'.repeat(24),
    })
  }
  await page.locator('.task-body').click()
  await page.getByLabel('제목', { exact: true }).fill('여러 줄\n제목')
  const date = page.getByLabel('기한', { exact: true })
  await date.fill('2026-10-03')
  await date.press('Enter')
  // The native date control may accept Enter without submitting; explicitly activate Save when still open.
  if (await page.getByRole('dialog').count())
    await page.getByRole('button', { name: '저장', exact: true }).press('Space')
  expect(await read()).toMatchObject({
    title: '여러 줄\n제목',
    dueDate: '2026-10-03',
    id: original.id,
  })
  await page.locator('.task-body').click()
  // Chrome sanitizes impossible native date values to empty. Domain/backup invalid-date guards are separately tested.
  await date.evaluate((el) => {
    const input = el as HTMLInputElement
    input.value = '2026-02-30'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(date).toHaveValue('')
  await expect(page.getByRole('button', { name: '해제', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await read()).dueDate).toBeNull()
  const final = await read()
  await page.reload()
  expect(await read()).toEqual(final)
})
