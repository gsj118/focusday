import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const phase = process.argv[2] || 'final'
const url = process.argv[3] || 'http://127.0.0.1:4173/'
const dir = `docs/screenshots/v1.4/features-${phase}`
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' })
const report = {
  phase,
  url,
  checkedAt: new Date().toISOString(),
  browser: browser.version(),
  screens: [],
  observations: [],
}
const day = '2026-10-08',
  stamp = '2026-10-08T01:00:00.000Z'
const make = (id, extra = {}) => ({
  id,
  title: id,
  createdAt: stamp,
  updatedAt: stamp,
  dueDate: null,
  focusDate: day,
  priority: 'none',
  category: null,
  completedAt: null,
  isDemo: false,
  ...extra,
})
const original = [
  make('발표 자료 정리', { dueDate: '2026-10-10', category: '업무', priority: 'high' }),
  make('산책하기'),
  make('읽던 책 한 쪽'),
  make('기한 없는 일', { focusDate: null }),
  make('어제 완료', { completedAt: '2026-10-06T15:30:00.000Z' }),
]
const ui = {
  version: 1,
  sentenceMode: 'calm',
  customSentence: '',
  encouragementEnabled: true,
  processed: {},
}
const menu = (page, width) =>
  page.locator(width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
async function open(page, width, name = '문구와 격려 설정') {
  await menu(page, width).locator('summary').click()
  await menu(page, width).getByRole('button', { name, exact: true }).click()
}
async function shot(page, name) {
  await page.screenshot({ path: `${dir}/${name}.png` })
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
    await page.clock.install({ time: new Date(stamp) })
    await page.addInitScript(
      ({ list, ui }) => {
        localStorage.setItem('focusday:v1', JSON.stringify({ version: 1, tasks: list }))
        localStorage.setItem('focusday:ui:v1', JSON.stringify(ui))
      },
      { list: original, ui },
    )
    await page.goto(url)
    await shot(page, `today-${width}x${height}`)
    await open(page, width)
    await page.getByRole('radio', { name: '유머', exact: true }).check()
    await page.getByRole('button', { name: '설정 저장', exact: true }).click()
    await page.keyboard.press('Escape')
    await shot(page, `humor-${width}x${height}`)
    await open(page, width)
    await page.getByRole('radio', { name: '내 문장', exact: true }).check()
    await page.getByLabel('내 문장 입력').fill('한글과EnglishWithoutSpaces'.repeat(8).slice(0, 120))
    await page.getByLabel('내 문장 입력').scrollIntoViewIfNeeded()
    await shot(page, `settings-${width}x${height}`)
    const box = await page.getByRole('dialog').boundingBox()
    const footer = await page.locator('.editor-footer').boundingBox()
    const overflow = await page
      .getByRole('dialog')
      .evaluate((el) => el.scrollWidth > el.clientWidth)
    const fullMobileSheet = width >= 900 || Math.abs(box.width - width) < 2
    report.observations.push({
      caseId: `V14-sheet-${width}`,
      expected: 'existing full width mobile sheet below 900px',
      actual: { width: box.width, viewport: width },
      status: fullMobileSheet ? 'PASS' : 'FAIL',
      screenshot: `${dir}/settings-${width}x${height}.png`,
    })
    await page.getByRole('button', { name: '설정 저장', exact: true }).click()
    await page.keyboard.press('Escape')
    await shot(page, `custom-${width}x${height}`)
    await page.getByRole('checkbox', { name: '발표 자료 정리 완료', exact: true }).click()
    await expect(page.locator('.encouragement')).toContainText('첫 한 가지')
    await shot(page, `encouragement-${width}x${height}`)
    await page.locator('.achievements-section > summary').click()
    await shot(page, `achievements-${width}x${height}`)
    await page.getByRole('checkbox', { name: '발표 자료 정리 미완료로 복원', exact: true }).click()
    await expect(page.locator('.achievements-section > summary')).toBeFocused()
    await open(page, width, '백업·복원')
    await page
      .locator('#backup-file')
      .setInputFiles({
        name: 'v1-backup.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({
            format: 'focusday-backup',
            formatVersion: 1,
            exportedAt: stamp,
            data: { version: 1, tasks: [make('불러온 완료', { completedAt: stamp })] },
          }),
        ),
      })
    await page.getByRole('button', { name: '합치기 적용', exact: true }).scrollIntoViewIfNeeded()
    await shot(page, `restore-${width}x${height}`)
    await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
    await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
    await expect(page.locator('.achievements-section > summary')).toHaveText('오늘 마친 일 1개')
    report.screens.push({
      width,
      height,
      dialogBox: box,
      footerBox: footer,
      overflow,
      documentOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      errors,
      condition:
        width === 720
          ? '200% equivalent CSS reflow, not native zoom'
          : height === 480
            ? 'reduced viewport, not OS keyboard'
            : 'CSS viewport / touch emulation below 500px',
    })
    await context.close()
  }
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
  })
  const page = await context.newPage()
  await page.clock.install({ time: new Date(stamp) })
  await page.addInitScript(
    ({ original, ui }) => {
      localStorage.setItem('focusday:v1', JSON.stringify({ version: 1, tasks: original }))
      localStorage.setItem('focusday:ui:v1', JSON.stringify(ui))
      window.v14Fail = false
      const set = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key === 'focusday:ui:v1' && window.v14Fail) throw new Error('injected')
        return set.call(this, key, value)
      }
    },
    { original, ui },
  )
  await page.goto(url)
  await open(page, 320)
  await page.getByRole('radio', { name: '유머', exact: true }).check()
  await page.evaluate(() => {
    window.v14Fail = true
  })
  await page.getByRole('button', { name: '설정 저장', exact: true }).click()
  await shot(page, 'settings-write-failure-320')
  await page.evaluate(() => {
    window.v14Fail = false
  })
  await page
    .locator('.storage-banner')
    .getByRole('button', { name: '설정 저장 재시도', exact: true })
    .click()
  await shot(page, 'settings-retry-draft-320')
  const message = await page.locator('.panel-feedback').textContent()
  report.observations.push({
    caseId: 'V14-retry-draft',
    expected: 'retry of applied settings distinguishes unsaved draft',
    actual: {
      message,
      selectedDraftHumor: await page.getByRole('radio', { name: '유머', exact: true }).isChecked(),
      applied: await page.evaluate(
        () => JSON.parse(localStorage.getItem('focusday:ui:v1')).sentenceMode,
      ),
    },
    status: /초안/.test(message) ? 'PASS' : 'FAIL',
    screenshot: `${dir}/settings-retry-draft-320.png`,
  })
  await context.close()
} finally {
  await browser.close()
  await writeFile(
    `docs/evidence/v1.4/features-${phase}.json`,
    JSON.stringify(report, null, 2) + '\n',
  )
}
console.log(
  JSON.stringify(
    {
      screens: report.screens.length,
      failedObservations: report.observations.filter((o) => o.status === 'FAIL'),
      overflow: report.screens.filter((s) => s.overflow || s.documentOverflow),
      errors: report.screens.flatMap((s) => s.errors),
    },
    null,
    2,
  ),
)
