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
const card = (page: Page) => page.getByRole('region', { name: '지금 할 일', exact: true })
const undo = (page: Page) => page.getByRole('button', { name: '최근 작업 되돌리기', exact: true })
async function options(page: Page, open = true) {
  const details = page.locator('.plan-options')
  const isOpen = (await details.getAttribute('open')) !== null
  if (isOpen !== open) await details.locator('summary').click()
}
async function add(page: Page, title: string) {
  await page.getByLabel('할 일 메모').fill(title)
  await page.getByLabel('할 일 메모').press('Enter')
  await page.getByRole('button', { name: /^\d+개 담기$/ }).click()
}
async function all(page: Page) {
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
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

test('한국어 메모 → 수정 가능한 미리보기 → 저장과 원문 되돌리기', async ({ page }) => {
  await page.goto('./')
  expect(await snapshot(page)).toEqual([null, null, null])
  await options(page)
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeChecked()
  await options(page, false)
  await page.getByRole('button', { name: '예시 넣기' }).click()
  const raw = await page.getByLabel('할 일 메모').inputValue()
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
  expect(await stored(page)).toHaveLength(0)
  await expect(page.getByLabel('정리한 제목 1', { exact: true })).toHaveValue('빨래 돌리기')
  await expect(page.getByLabel('정리한 기한 2', { exact: true })).toHaveValue('2026-11-21')
  await expect(page.getByLabel('정리한 기한 3', { exact: true })).toHaveValue('2026-11-23')
  await expect(page.getByLabel('정리한 분류 2', { exact: true })).toHaveValue('학교')
  await page.getByLabel('정리한 제목 2', { exact: true }).fill('인공지능 과제 제출')
  await page.getByLabel('할 일 2 기한·분류 수정', { exact: true }).click()
  await page.getByLabel('정리한 우선순위 2', { exact: true }).selectOption('high')
  await page.getByRole('button', { name: '3개 담기', exact: true }).click()
  const tasks = await stored(page)
  expect(tasks).toHaveLength(3)
  expect(tasks[1]).toMatchObject({
    title: '인공지능 과제 제출',
    dueDate: '2026-11-21',
    category: '학교',
    priority: 'high',
    focusDate: null,
  })
  expect(new Set(tasks.map((task) => task.id)).size).toBe(3)
  await expect(card(page)).toContainText('빨래 돌리기')
  await page.clock.fastForward(9000)
  await expect(page.locator('.undo-toast')).toHaveCount(0)
  await undo(page).click()
  expect(await stored(page)).toHaveLength(0)
  await expect(page.getByLabel('할 일 메모')).toHaveValue(raw)
  await add(page, '내일 발표 자료 제출 #학교 !높음\n장보기\n장보기')
  expect((await stored(page)).filter((task) => task.title === '장보기')).toHaveLength(2)
  const saved = await stored(page)
  await page.reload()
  expect(await stored(page)).toEqual(saved)
})

test('잘못된 여러 줄은 전체 보류·원문 유지·인식 끄기·Shift+Enter', async ({ page }) => {
  await page.goto('./')
  const input = page.getByLabel('할 일 메모')
  await input.fill('유효한 항목\n2026-02-30 잘못된 날짜')
  await input.press('Enter')
  expect(await stored(page)).toHaveLength(0)
  await expect(input).toHaveValue('유효한 항목\n2026-02-30 잘못된 날짜')
  await expect(page.locator('#quick-error')).toContainText('2번째 줄')
  await page.getByRole('checkbox', { name: '문장 자동 정리' }).uncheck()
  await input.fill('내일 원문 유지 #학교 !높음')
  await input.press('Enter')
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

test('가상 학생의 자유 메모: 행동 분리·공유 날짜·반복 원문·첫 계획 안내', async ({ page }) => {
  await page.goto('./')
  await page
    .getByLabel('할 일 메모')
    .fill('내일 과제 제출하고 우유 사기\n다음 주 월요일 발표 준비\n매주 금요일 운동 30분')
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
  await expect(page.getByRole('heading', { name: '할 일 4개로 정리했어요' })).toBeVisible()
  await expect(page.getByLabel('정리한 제목 1', { exact: true })).toHaveValue('과제 제출하기')
  await expect(page.getByLabel('정리한 기한 2', { exact: true })).toHaveValue('2026-11-21')
  await expect(page.getByLabel('정리한 제목 4', { exact: true })).toHaveValue(
    '매주 금요일 운동 30분',
  )
  await expect(page.getByLabel('정리한 기한 4', { exact: true })).toHaveValue('')
  await expect(page.locator('.capture-destination')).toHaveText(
    '전체 목록에 담고, 이 중에서 오늘 할 분량을 자동으로 골라요.',
  )
  await expect(page.getByText(/반복 일정은 만들지 않아요/)).toBeVisible()
  await page.getByRole('button', { name: '4개 담기', exact: true }).click()
  expect(await stored(page)).toHaveLength(4)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
  await page.getByLabel('할 일 메모').fill('다음 주 화요일 도서 반납')
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
  await expect(page.locator('.capture-destination')).toContainText(
    '이미 정한 오늘 분량은 바뀌지 않아요.',
  )
})

test('예시 덧붙이기는 작성 중인 원문을 보존하고 최대 길이를 넘기지 않음', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 620 })
  await page.goto('./')
  const memo = page.getByLabel('할 일 메모')
  const draft = '내일 보고서 제출\n회의 준비  '
  await memo.fill(draft)
  await page.getByRole('button', { name: '예시 덧붙이기', exact: true }).click()
  expect(await memo.inputValue()).toBe(
    draft + '\n오늘은 빨래 돌리고 내일 과제 제출해야 돼.\n다음 주 월요일 발표 준비도 해놔야 하고.',
  )
  expect(await stored(page)).toHaveLength(0)
  const longDraft = '가'.repeat(24000)
  await memo.fill(longDraft)
  await page.getByRole('button', { name: '예시 덧붙이기', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    '메모가 길어 예시를 덧붙일 수 없어요. 현재 메모를 먼저 담아 주세요.',
  )
  await expect(memo).toHaveValue(longDraft)
  await expect(memo).toBeFocused()
  expect(await stored(page)).toHaveLength(0)
})

test('정한 3개 완료 후 종료·무기한 입력이나 새로고침으로 채우지 않음·완료 되돌리기', async ({
  page,
}) => {
  await seed(
    page,
    ['가', '나', '다', '라', '마'].map((id) => make(id)),
  )
  await page.goto('./')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await add(page, '새로 담은 일')
  await expect(card(page)).toContainText('나')
  await expect(page.locator('.outside-due')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await expect(page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.' })).toBeFocused()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  await expect(card(page)).toHaveCount(0)
  expect((await stored(page)).filter((task) => !task.completedAt)).toHaveLength(3)
  await page.clock.fastForward(9000)
  await undo(page).click()
  await expect(card(page)).toContainText('다')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.' })).toBeVisible()
  await page.getByRole('button', { name: '하나 더 하기', exact: true }).click()
  await expect(card(page)).toContainText('라')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4')
  await undo(page).click()
  await expect(card(page)).toHaveCount(0)
})

test('오늘·내일·다음 주 메모 중 오늘 일은 기존 계획에 자동 반영하고 완료 전에 종료하지 않음', async ({
  page,
}) => {
  const original = ['기존 하나', '기존 둘', '기존 셋'].map((id) => make(id))
  await seed(page, original)
  await page.goto('./')
  const raw = '오늘 새로 요청한 일\n내일 할 일\n다음 주 월요일 할 일'
  await add(page, raw)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4')
  await expect(card(page)).toContainText('새로 요청한 일')
  await undo(page).click()
  expect(await stored(page)).toEqual(original)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
  await expect(page.getByLabel('할 일 메모')).toHaveValue(raw)
  await add(page, raw)
  await page.reload()
  await expect(card(page)).toContainText('새로 요청한 일')
  for (let completed = 0; completed < 4; completed++) {
    await expect(
      page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
    ).toHaveCount(0)
    await card(page).getByRole('button', { name: '완료했어요', exact: true }).click()
  }
  await expect(
    page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
  ).toBeVisible()
  expect(
    (await stored(page)).filter((task) => !task.completedAt).map((task) => task.dueDate),
  ).toEqual(['2026-11-21', '2026-11-23'])
  await add(page, '오늘 마감 직전 추가\n내일 나중에 할 일')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5')
  await expect(card(page)).toContainText('마감 직전 추가')
  await expect(
    page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
  ).toHaveCount(0)
  await undo(page).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4')
  await expect(
    page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
  ).toBeVisible()
})

test('이전 저장·수동 제외로 계획 밖에 오늘 기한이 남으면 종료 대신 확인·계획 복구를 제공', async ({
  page,
}) => {
  await seed(
    page,
    [
      make('기존 완료', { completedAt: stamp }),
      make('남은 오늘 일', { dueDate: day }),
      make('남은 지난 일', { dueDate: '2026-11-18' }),
      make('미래 일', { dueDate: '2026-11-23' }),
    ],
    { ...defaultAutomation(day), planTaskIds: ['기존 완료'] },
  )
  await page.goto('./')
  await expect(
    page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: '오늘까지 할 일이 남아 있어요.', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '남은 일 오늘에 넣기', exact: true }).click()
  await expect(card(page)).toContainText('남은 지난 일')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await expect(card(page)).toContainText('남은 오늘 일')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await expect(
    page.getByRole('heading', { name: '오늘 분량을 다 마쳤어요.', exact: true }),
  ).toBeVisible()
  expect(
    (await stored(page)).filter((task) => !task.completedAt).map((task) => task.title),
  ).toEqual(['미래 일'])
})

test('분량 변경은 명시적 재계획·되돌리기·기한 밖 안내·원본 속성 유지', async ({ page }) => {
  await seed(page, [
    make('기한 초과', { dueDate: '2026-11-18' }),
    make('오늘 제출', { dueDate: day }),
    make('직접 고른 일', { focusDate: day }),
    make('남은 일'),
  ])
  await page.goto('./')
  const before = await stored(page)
  await options(page)
  await page.getByLabel('오늘 기본 분량').selectOption('1')
  await options(page, false)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '1')
  await expect(page.locator('.outside-due')).toContainText('1개')
  expect(await stored(page)).toEqual(before)
  await undo(page).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
  expect(await stored(page)).toEqual(before)
})

test('나중에 하기와 다시 이어가기·되돌리기·다음 날 계획 초기화', async ({ page }) => {
  await seed(page, [make('해야 할 일', { dueDate: day })])
  await page.goto('./')
  const before = await stored(page)
  await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await expect(page.getByRole('button', { name: '미뤄 둔 일 이어가기' })).toBeVisible()
  expect(await stored(page)).toEqual(before)
  await undo(page).click()
  await expect(card(page)).toContainText('해야 할 일')
  await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await page.getByRole('button', { name: '미뤄 둔 일 이어가기' }).click()
  await expect(card(page)).toContainText('해야 할 일')
  await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await page.clock.setSystemTime(new Date('2026-11-21T01:00:00.000Z'))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(card(page)).toContainText('기한 초과')
  expect(await stored(page)).toEqual(before)
})

test('편집의 오늘 선택은 자동 계획과 일치·취소 불변·저장과 삭제도 되돌리기', async ({ page }) => {
  await seed(page, [make('자동으로 고른 일'), make('다른 일')])
  await page.goto('./')
  await page.getByRole('button', { name: '자동으로 고른 일 편집', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '오늘에서 빼기' })).toBeChecked()
  await page.getByLabel('제목', { exact: true }).fill('바꾼 제목')
  await page.getByRole('button', { name: '취소', exact: true }).click()
  expect((await stored(page))[0].title).toBe('자동으로 고른 일')
  await page.getByRole('button', { name: '자동으로 고른 일 편집', exact: true }).click()
  await page.getByRole('checkbox', { name: '오늘에서 빼기' }).uncheck()
  await page.locator('.date-shortcuts').getByRole('button', { name: '내일', exact: true }).click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await stored(page))[0].dueDate).toBe('2026-11-21')
  await expect(
    page.getByRole('button', { name: '자동으로 고른 일 편집', exact: true }),
  ).toHaveCount(0)
  await undo(page).click()
  expect((await stored(page))[0].dueDate).toBeNull()
  await page.getByRole('button', { name: '자동으로 고른 일 편집', exact: true }).click()
  await page.getByRole('button', { name: '삭제', exact: true }).click()
  expect(await stored(page)).toHaveLength(1)
  await undo(page).click()
  expect(await stored(page)).toHaveLength(2)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2')
})

test('자동 설정 손상 시 기존 할 일·문구 보존, 자동 설정만 명시적 초기화', async ({ page }) => {
  await seed(page, [make('사용자 기록', { focusDate: day })], '{broken')
  await page.goto('./')
  const before = await snapshot(page)
  await options(page)
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '사용자 기록 편집', exact: true })).toBeVisible()
  expect(await snapshot(page)).toEqual(before)
  await page.getByText('자동 계획 설정 초기화…', { exact: true }).click()
  await page.getByRole('button', { name: '자동 계획 설정만 초기화', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).toBeChecked()
  expect((await snapshot(page)).slice(0, 2)).toEqual(before.slice(0, 2))
})

test('체험의 입력·완료·설정·백업/복원·초기화가 개인 저장소 세 개를 보존', async ({ page }) => {
  await seed(page, [make('개인 원본')], { ...defaultAutomation(day), limit: 5, enabled: false })
  await page.goto('./?demo=1')
  const before = await snapshot(page)
  await add(page, '내일 체험 입력 #학교 !높음')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  await options(page)
  await page.getByLabel('오늘 기본 분량').selectOption('1')
  await options(page, false)
  await page.locator('.sidebar .app-menu summary').click()
  await page.getByRole('button', { name: '문구와 격려 설정', exact: true }).click()
  await page.getByRole('radio', { name: '끄기', exact: true }).check()
  await page.getByRole('button', { name: '설정 저장', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '백업·복원', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '백업 파일 다운로드', exact: true }).click()
  const download = await pending
  expect(download.suggestedFilename()).toContain('demo-backup')
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(backup.data.tasks).toHaveLength(6)
  expect(backup.data.tasks.some((task: Task) => task.title === '개인 원본')).toBe(false)
  await page.locator('#backup-file').setInputFiles({
    name: 'demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks: [make('체험 복원')] }))),
  })
  await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(before)
  await page.getByRole('button', { name: '처음부터 체험' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  expect(await snapshot(page)).toEqual(before)
  await page.getByRole('button', { name: '내 할 일 시작하기' }).click()
  await options(page)
  await expect(page.getByRole('checkbox', { name: '자동 계획', exact: true })).not.toBeChecked()
  await options(page, false)
  await all(page)
  await expect(page.getByRole('button', { name: '개인 원본 편집', exact: true })).toBeVisible()
  expect(await snapshot(page)).toEqual(before)
})

test('전체 복원 직후 오늘 계획에는 복원된 항목만 포함', async ({ page }) => {
  await seed(page, [make('복원 전')])
  await page.goto('./')
  await page.getByRole('button', { name: '백업·복원', exact: true }).click()
  await page.locator('#backup-file').setInputFiles({
    name: 'replace.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks: [make('복원 후')] }))),
  })
  await page.getByRole('radio', { name: '백업으로 전체 교체', exact: true }).check()
  await page.getByRole('button', { name: '전체 교체 확인으로 이동' }).click()
  await page.getByRole('button', { name: '확인 후 전체 교체', exact: true }).click()
  await page.getByRole('button', { name: '목록으로 돌아가기' }).click()
  await expect(card(page)).toContainText('복원 후')
  expect((await stored(page)).map((task) => task.id)).toEqual(['복원 후'])
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
  await all(page)
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
  await options(page)
  await page.getByLabel('오늘 기본 분량').selectOption('5')
  await expect(page.getByRole('alert')).toContainText('오늘 계획을 저장하지 못했어요')
  await expect(page.getByLabel('오늘 기본 분량')).toHaveValue('5')
  expect(await page.evaluate((key) => localStorage.getItem(key), AUTO_STORAGE_KEY)).toBeNull()
  await page.evaluate(() => {
    ;(window as Window & { allowAutoWrite?: boolean }).allowAutoWrite = true
  })
  await page.getByRole('button', { name: '오늘 계획 다시 저장', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).limit, AUTO_STORAGE_KEY),
  ).toBe(5)
  expect(await stored(page)).toEqual(before)
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
    const complete = card(page).getByRole('button', { name: '완료했어요' })
    if (width === 1366 || width === 390) {
      const bounds = (await complete.boundingBox())!
      expect(bounds.y + bounds.height).toBeLessThan(height - (width === 390 ? 80 : 0))
    }
    await complete.click()
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    await page.getByRole('button', { name: '메모 담기', exact: true }).click()
    await expect(page.getByLabel('할 일 메모')).toBeFocused()
    await page.getByRole('button', { name: '예시 넣기', exact: true }).click()
    await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
    if (width === 390) {
      const review = await page
        .getByRole('heading', { name: '할 일 3개로 정리했어요' })
        .boundingBox()
      expect(review!.y).toBeLessThan(80)
      await expect(page.getByRole('button', { name: '3개 담기', exact: true })).toBeInViewport()
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('automation.png'), fullPage: true })
  })
}
