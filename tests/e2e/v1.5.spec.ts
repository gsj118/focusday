import { test, expect, type Page } from '@playwright/test'
import { createTask, type Task } from '../../src/domain'
import { AUTO_STORAGE_KEY, defaultAutomation, type AutoState } from '../../src/automation'
import { UI_STORAGE_KEY, defaultPreferences } from '../../src/preferences'
import { STORAGE_KEY } from '../../src/storage'
import { readFile } from 'node:fs/promises'
import { createBackup } from '../../src/backup'

const day = '2026-11-20'
const stamp = '2026-11-20T01:00:00.000Z'
const make = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', day, stamp, id),
  ...extra,
})
const stored = (page: Page): Promise<Task[]> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1') || '{"tasks":[]}').tasks)
const snapshot = (page: Page) =>
  page.evaluate(() =>
    ['focusday:v1', 'focusday:ui:v1', 'focusday:auto:v1'].map((key) => localStorage.getItem(key)),
  )
const card = (page: Page) => page.getByRole('region', { name: '지금 할 하나', exact: true })
async function add(page: Page, title: string) {
  await page.getByLabel('새 할 일 제목').fill(title)
  await page.getByLabel('새 할 일 제목').press('Enter')
}
async function seed(page: Page, tasks: Task[], auto?: AutoState | string) {
  await page.addInitScript(
    ({ tasks, auto, keys, prefs }) => {
      if (localStorage.getItem(keys[0]) !== null) return
      localStorage.setItem(keys[0], JSON.stringify({ version: 1, tasks }))
      localStorage.setItem(keys[1], JSON.stringify(prefs))
      if (auto !== undefined)
        localStorage.setItem(keys[2], typeof auto === 'string' ? auto : JSON.stringify(auto))
    },
    {
      tasks,
      auto,
      keys: [STORAGE_KEY, UI_STORAGE_KEY, AUTO_STORAGE_KEY],
      prefs: defaultPreferences(),
    },
  )
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(stamp) })
})

test('새 방문 기본 자동 계획·무기록 읽기·여러 줄/중복/날짜 인식과 실제 저장', async ({ page }) => {
  await page.goto('./')
  expect(await snapshot(page)).toEqual([null, null, null])
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeChecked()
  await page.getByLabel('새 할 일 제목').fill('내일 발표 자료 제출 #학교 !높음\n장보기\n장보기')
  await expect(page.getByLabel('입력 인식 결과')).toContainText('기한 2026-11-21')
  await page.getByLabel('새 할 일 제목').press('Enter')
  const tasks = await stored(page)
  expect(tasks).toHaveLength(3)
  expect(tasks[0]).toMatchObject({
    title: '발표 자료 제출',
    dueDate: '2026-11-21',
    category: '학교',
    priority: 'high',
    focusDate: null,
  })
  expect(tasks.filter((t) => t.title === '장보기')).toHaveLength(2)
  expect(new Set(tasks.map((t) => t.id)).size).toBe(3)
  await expect(card(page)).toContainText('발표 자료 제출')
  await page.reload()
  expect(await stored(page)).toEqual(tasks)
})

test('잘못된 여러 줄은 전체 보류·원문 유지·인식 끄기·Shift+Enter', async ({ page }) => {
  await page.goto('./')
  const input = page.getByLabel('새 할 일 제목')
  await add(page, '유효한 항목\n2026-02-30 잘못된 날짜')
  expect(await stored(page)).toHaveLength(0)
  await expect(input).toHaveValue('유효한 항목\n2026-02-30 잘못된 날짜')
  await expect(page.locator('#quick-error')).toContainText('2행')
  await page.getByRole('checkbox', { name: '날짜·분류 자동 인식' }).uncheck()
  await add(page, '내일 원문 유지 #학교 !높음')
  expect((await stored(page))[0]).toMatchObject({
    title: '내일 원문 유지 #학교 !높음',
    dueDate: null,
    category: null,
    priority: 'none',
  })
  await input.fill('두 번째')
  await input.press('End')
  await input.press('Shift+Enter')
  await page.keyboard.insertText('세')
  await expect(input).toHaveValue('두 번째\n세')
  expect(await stored(page)).toHaveLength(1)
})

test('기한·직접 선택 보존·분량 초과 안내·시작한 작업 유지·완료 후 다음 후보', async ({ page }) => {
  await seed(page, [
    make('기한 초과', { dueDate: '2026-11-18' }),
    make('오늘 제출', { dueDate: day }),
    make('직접 고른 일', { focusDate: day }),
    make('남은 일'),
  ])
  await page.goto('./')
  const before = await stored(page)
  await page.getByLabel('오늘 기본 분량').selectOption('1')
  await expect(page.locator('.task-row')).toHaveCount(3)
  await expect(
    page.getByText('기한이 된 일과 직접 고른 일은 기본 분량을 넘어도 유지합니다.'),
  ).toBeVisible()
  expect(await stored(page)).toEqual(before)
  await card(page).getByRole('button', { name: '이것부터 시작' }).click()
  await add(page, '2026-11-01 새로 들어온 급한 일')
  await expect(card(page)).toContainText('기한 초과')
  await expect(
    card(page).getByRole('button', { name: '기한 초과 편집', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(card(page).getByRole('heading', { name: '지금 하는 일' })).toBeVisible()
  await card(page).getByRole('button', { name: '이 일 완료하기' }).click()
  await expect(card(page)).toContainText('새로 들어온 급한 일')
  await expect(card(page).getByRole('button', { name: '이것부터 시작' })).toBeVisible()
  await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  expect((await stored(page)).find((t) => t.id === '기한 초과')?.completedAt).toBeNull()
})

test('추천 건너뛰기는 원본 불변·모두 건너뛴 뒤 복구·다음 날 재추천', async ({ page }) => {
  await seed(page, [make('해야 할 일', { dueDate: day })])
  await page.goto('./')
  const before = await stored(page)
  await card(page).getByRole('button', { name: '다른 일 보기' }).click()
  await expect(page.getByRole('button', { name: '추천 다시 보기' })).toBeVisible()
  await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  expect(await stored(page)).toEqual(before)
  await page.getByRole('button', { name: '추천 다시 보기' }).click()
  await expect(card(page)).toContainText('해야 할 일')
  await card(page).getByRole('button', { name: '다른 일 보기' }).click()
  await page.clock.setSystemTime(new Date('2026-11-21T01:00:00.000Z'))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(card(page)).toContainText('기한 초과')
  expect(await stored(page)).toEqual(before)
})

test('자동 설정 손상 시 기존 할 일·문구 보존, 자동 설정만 명시적 초기화', async ({ page }) => {
  await seed(page, [make('사용자 기록', { focusDate: day })], '{broken')
  await page.goto('./')
  const before = await snapshot(page)
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '사용자 기록 편집', exact: true })).toBeVisible()
  expect(await snapshot(page)).toEqual(before)
  await page.getByText('자동 계획 설정 초기화…', { exact: true }).click()
  await page.getByRole('button', { name: '자동 계획 설정만 초기화', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeChecked()
  expect((await snapshot(page)).slice(0, 2)).toEqual(before.slice(0, 2))
})

test('예시 체험의 입력·완료·설정·백업/복원·초기화가 개인 저장소 세 개를 보존', async ({ page }) => {
  await seed(page, [make('개인 원본')], { ...defaultAutomation(day), limit: 5, enabled: false })
  await page.goto('./?demo=1')
  const before = await snapshot(page)
  await expect(page.getByLabel('오늘 기본 분량')).toHaveValue('3')
  await add(page, '내일 체험 입력 #학교 !높음')
  await card(page).getByRole('button', { name: '이것부터 시작' }).click()
  await card(page).getByRole('button', { name: '이 일 완료하기' }).click()
  await expect(page.locator('.day-overview')).toContainText('오늘 마친 일 1개')
  await page.getByLabel('오늘 기본 분량').selectOption('1')
  await page.locator('.sidebar .app-menu summary').click()
  await page.getByRole('button', { name: '문구와 격려 설정', exact: true }).click()
  await page.getByRole('radio', { name: '끄기', exact: true }).check()
  await page.getByRole('button', { name: '설정 저장', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '백업·복원', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  const download = await pending
  expect(download.suggestedFilename()).toContain('demo-backup')
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(backup.data.tasks).toHaveLength(6)
  expect(backup.data.tasks.some((t: Task) => t.title === '개인 원본')).toBe(false)
  await page.locator('#backup-file').setInputFiles({
    name: 'demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks: [make('체험 복원')] }))),
  })
  await expect(page.getByRole('heading', { name: '복원 미리보기', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(before)
  await page.getByRole('button', { name: '처음부터 체험' }).click()
  await expect(page.getByLabel('오늘 기본 분량')).toHaveValue('3')
  await expect(page.locator('.day-overview')).toContainText('오늘 마친 일 0개')
  expect(await snapshot(page)).toEqual(before)
  await page.getByRole('button', { name: '내 할 일 사용하기' }).click()
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).not.toBeChecked()
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
  await expect(page.getByRole('button', { name: '개인 원본 편집', exact: true })).toBeVisible()
  expect(await snapshot(page)).toEqual(before)
})

test('브라우저 저장소 접근 자체가 차단되어도 체험은 사용 가능', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked')
      },
    }),
  )
  await page.goto('./?demo=1')
  await expect(card(page)).toBeVisible()
  await add(page, '체험에서도 입력')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
  await expect(
    page.getByRole('button', { name: '체험에서도 입력 편집', exact: true }),
  ).toBeVisible()
})

test('자동 설정 쓰기 실패는 경고·메모리 유지·재시도하고 할 일을 바꾸지 않음', async ({ page }) => {
  await seed(page, [make('저장 보존')])
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (
        key === 'focusday:auto:v1' &&
        !(window as Window & { allowAutoWrite?: boolean }).allowAutoWrite
      )
        throw new Error('quota')
      original.call(this, key, value)
    }
  })
  await page.goto('./')
  const before = await stored(page)
  await page.getByLabel('오늘 기본 분량').selectOption('5')
  await expect(page.getByRole('alert')).toContainText('이번 탭에는 적용')
  await expect(page.getByLabel('오늘 기본 분량')).toHaveValue('5')
  expect(await page.evaluate((key) => localStorage.getItem(key), AUTO_STORAGE_KEY)).toBeNull()
  await page.evaluate(() => {
    ;(window as Window & { allowAutoWrite?: boolean }).allowAutoWrite = true
  })
  await page.getByRole('button', { name: '자동 계획 설정 다시 읽기·저장', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).limit, AUTO_STORAGE_KEY),
  ).toBe(5)
  expect(await stored(page)).toEqual(before)
})

test('편집 빠른 날짜는 저장 전 초안·취소 보존·오늘 선택과 독립', async ({ page }) => {
  await seed(page, [make('빠른 날짜', { focusDate: day })])
  await page.goto('./')
  await page.getByRole('button', { name: '빠른 날짜 편집', exact: true }).click()
  await page.locator('.date-shortcuts').getByRole('button', { name: '내일', exact: true }).click()
  await expect(page.getByLabel('기한', { exact: true })).toHaveValue('2026-11-21')
  expect((await stored(page))[0].dueDate).toBeNull()
  await page.keyboard.press('Escape')
  expect((await stored(page))[0].dueDate).toBeNull()
  await page.getByRole('button', { name: '빠른 날짜 편집', exact: true }).click()
  await page
    .locator('.date-shortcuts')
    .getByRole('button', { name: '일주일 뒤', exact: true })
    .click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await stored(page))[0]).toMatchObject({ dueDate: '2026-11-27', focusDate: day })
})

for (const [width, height] of [
  [1366, 768],
  [390, 844],
  [320, 568],
  [768, 1024],
  [720, 450],
]) {
  test('자동화 체험 반응형 ' + width + '×' + height, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await page.goto('./?demo=1')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    const start = card(page).getByRole('button', { name: '이것부터 시작' })
    if (width === 1366 || width === 390) {
      const bounds = (await start.boundingBox())!
      expect(bounds.y + bounds.height).toBeLessThan(height - (width === 390 ? 80 : 0))
    }
    await start.click()
    await expect(card(page).getByRole('button', { name: '이 일 완료하기' })).toBeVisible()
    await page.screenshot({ path: info.outputPath('automation.png'), fullPage: true })
  })
}
