import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

// Only fresh isolated contexts; no user browser profile or persistent test data.
const phase = process.argv[2] || 'after'
const url = process.argv[3] || 'http://127.0.0.1:4173/'
const dir = `docs/screenshots/v1.3/${phase}`
await mkdir(dir, { recursive: true })
await mkdir('docs/evidence/v1.3', { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' })
const report = {
  phase,
  url,
  checkedAt: new Date().toISOString(),
  browser: browser.version(),
  screens: [],
}
try {
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [320, 568],
    [720, 450],
    [390, 480],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      timezoneId: 'Asia/Seoul',
      locale: 'ko-KR',
      hasTouch: width < 500,
      isMobile: width < 500,
      deviceScaleFactor: width === 720 ? 2 : 1,
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(url)
    await page.screenshot({ path: `${dir}/empty-${width}x${height}.png`, fullPage: true })
    await page.getByRole('button', { name: '예시로 둘러보기', exact: true }).last().click()
    // Add yesterday and long-title states through a test-only init script, then reload.
    const tasks = await page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1')).tasks)
    const today = tasks.find((t) => t.focusDate)?.focusDate
    const previous = tasks.find((t) => t.dueDate && t.dueDate < today).dueDate
    const stamp = new Date().toISOString()
    tasks.push({
      id: 'ui-yesterday',
      title: '어제 시작한 글 이어서 쓰기',
      createdAt: stamp,
      updatedAt: stamp,
      dueDate: null,
      focusDate: previous,
      priority: 'medium',
      category: '개인',
      completedAt: null,
      isDemo: false,
    })
    await page.addInitScript((data) => localStorage.setItem('focusday:v1', JSON.stringify(data)), {
      version: 1,
      tasks,
    })
    await page.reload()
    await page.screenshot({ path: `${dir}/today-${width}x${height}.png`, fullPage: true })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    const rowHeights = await page
      .locator('.task-row')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    await page.screenshot({ path: `${dir}/plan-${width}x${height}.png` })
    const planOverflow = await page
      .getByRole('dialog')
      .evaluate((el) => el.scrollWidth > el.clientWidth)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '발표 자료 최종 확인 편집', exact: true }).click()
    await page.screenshot({ path: `${dir}/editor-${width}x${height}.png` })
    await page.getByLabel('분류 선택').fill('공백없는긴분류ABCDEFGHIJKLMNOP'.slice(0, 24))
    await page
      .getByLabel('제목', { exact: true })
      .fill('긴한글제목과 EnglishWithoutSpaces'.repeat(6).slice(0, 200))
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.screenshot({ path: `${dir}/long-${width}x${height}.png`, fullPage: true })
    const nav = page.getByRole('navigation', {
      name: width < 900 ? '모바일 보기' : '할 일 보기',
      exact: true,
    })
    await nav.getByRole('button', { name: /전체/ }).click()
    await page.getByRole('checkbox', { name: '주말 장보기 완료', exact: true }).click()
    await page.locator('.completed-section summary').click()
    await page.screenshot({ path: `${dir}/all-${width}x${height}.png`, fullPage: true })
    const menu = page.locator(width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
    await menu.locator('summary').click()
    await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
    await page.screenshot({ path: `${dir}/data-${width}x${height}.png` })
    await page.locator('#backup-file').setInputFiles({
      name: 'preview.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          format: 'focusday-backup',
          formatVersion: 1,
          exportedAt: stamp,
          data: { version: 1, tasks },
        }),
      ),
    })
    await expect(page.getByRole('heading', { name: '복원 미리보기', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '합치기 적용', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${dir}/restore-${width}x${height}.png` })
    const dataOverflow = await page
      .getByRole('dialog')
      .evaluate((el) => el.scrollWidth > el.clientWidth)
    report.screens.push({
      width,
      height,
      overflow,
      planOverflow,
      dataOverflow,
      rowHeights,
      errors,
      condition:
        width === 720
          ? '200% equivalent reflow, not native zoom'
          : width === 390 && height === 480
            ? 'reduced viewport, not OS keyboard'
            : 'CSS viewport',
    })
    await context.close()
  }
} finally {
  await browser.close()
  await writeFile(`docs/evidence/v1.3/${phase}-visual.json`, JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify(report, null, 2))
