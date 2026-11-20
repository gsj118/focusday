import { test, expect, type Page } from '@playwright/test'
import { createTask, type Task } from '../../src/domain'
import { defaultAutomation, type AutoState } from '../../src/automation'

const day = '2026-11-20'
const stamp = '2026-11-20T10:00:00+09:00'
const make = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', day, new Date(stamp).toISOString(), id),
  ...extra,
})
const tasks = (page: Page): Promise<Task[]> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1') || '{"tasks":[]}').tasks)
const plan = (page: Page): Promise<AutoState> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('focusday:auto:v1')!))
const card = (page: Page) => page.getByRole('region', { name: '지금 할 일', exact: true })
const undo = (page: Page) => page.getByRole('button', { name: '최근 작업 되돌리기', exact: true })
const progress = (page: Page) => page.getByRole('progressbar', { name: '오늘 계획 완료' })
async function seed(page: Page, rows: Task[], extra: Partial<AutoState> = {}) {
  await page.addInitScript(
    ({ rows, auto }) => {
      if (localStorage.getItem('focusday:v1')) return
      localStorage.setItem('focusday:v1', JSON.stringify({ version: 1, tasks: rows }))
      localStorage.setItem('focusday:auto:v1', JSON.stringify(auto))
    },
    { rows, auto: { ...defaultAutomation(day), ...extra } },
  )
}
async function moveDate(page: Page, time: string, event = 'focus') {
  await page.clock.setSystemTime(new Date(time))
  await page.evaluate((event) => {
    if (event === 'focus') window.dispatchEvent(new Event('focus'))
    else document.dispatchEvent(new Event('visibilitychange'))
  }, event)
}
async function showAll(page: Page) {
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
}
async function showToday(page: Page) {
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /^오늘/ })
    .click()
}
async function memo(page: Page, text: string) {
  await page.getByLabel('할 일 메모', { exact: true }).fill(text)
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
}
async function saveMemo(page: Page) {
  await page.getByRole('button', { name: /^\d+개 담기$/ }).click()
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(stamp) })
})

test('L01 자정 전 정리한 메모는 수정한 기한을 보존하고 날짜 변경을 확인받는다', async ({
  page,
}) => {
  await page.goto('./')
  await memo(page, '오늘 제출\n내일 장보기')
  await page.getByLabel('정리한 제목 1', { exact: true }).fill('수정한 제출 제목')
  await moveDate(page, '2026-11-21T00:01:00+09:00')
  await expect(page.getByRole('status').filter({ hasText: '날짜가 바뀌었어요' })).toBeVisible()
  await expect(page.getByLabel('정리한 제목 1', { exact: true })).toHaveValue('수정한 제출 제목')
  await expect(page.getByLabel('정리한 기한 1', { exact: true })).toHaveValue(day)
  await expect(page.getByRole('button', { name: '2개 담기', exact: true })).toBeDisabled()
  await page.getByLabel('정리한 기한을 확인했어요', { exact: true }).check()
  await saveMemo(page)
  expect((await tasks(page)).map((t) => t.dueDate)).toEqual([day, '2026-11-21'])
  await expect(progress(page)).toHaveAttribute('aria-valuemax', '2')
})

test('L02 미리보기 제목·분류의 한글 조합 Enter가 묶음을 조기 저장하지 않는다', async ({ page }) => {
  await page.goto('./')
  await memo(page, '내일 과제 제출')
  const title = page.getByLabel('정리한 제목 1', { exact: true })
  await title.fill('한글 수정 중')
  await title.dispatchEvent('compositionstart')
  await title.press('Enter')
  expect(await tasks(page)).toHaveLength(0)
  await title.dispatchEvent('compositionend')
  await title.press('Enter')
  expect(await tasks(page)).toHaveLength(0)
  await page.clock.runFor(100)
  await page.getByLabel('할 일 1 기한·분류 수정', { exact: true }).click()
  const category = page.getByLabel('정리한 분류 1', { exact: true })
  await category.fill('새 분류')
  await category.dispatchEvent('compositionstart')
  await category.press('Enter')
  expect(await tasks(page)).toHaveLength(0)
  await category.dispatchEvent('compositionend')
  await page.clock.runFor(100)
  await saveMemo(page)
  expect((await tasks(page))[0]).toMatchObject({ title: '한글 수정 중', category: '새 분류' })
})

test('L03 편집창을 연 채 날짜가 바뀌어도 새 오늘 계획을 오래된 체크 상태로 제거하지 않는다', async ({
  page,
}) => {
  await seed(page, [make('어제 계획'), make('내일 마감', { dueDate: '2026-11-21' })], {
    limit: 1,
    planTaskIds: ['어제 계획'],
  })
  await page.goto('./')
  await showAll(page)
  await page.getByRole('button', { name: '내일 마감 편집', exact: true }).click()
  await page.getByLabel('제목', { exact: true }).fill('수정 중인 제목')
  await moveDate(page, '2026-11-21T00:01:00+09:00')
  await expect(page.getByRole('checkbox', { name: '오늘에서 빼기', exact: true })).toBeChecked()
  await expect(page.getByLabel('제목', { exact: true })).toHaveValue('수정 중인 제목')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await showToday(page)
  await expect(card(page)).toContainText('수정 중인 제목')
  expect((await plan(page)).planTaskIds).toEqual(['내일 마감'])
})

test('L04 지난 날짜의 순서 되돌리기는 새 계획에 무효인 성공 안내를 내지 않는다', async ({
  page,
}) => {
  await seed(page, [make('남은 일', { dueDate: day })])
  await page.goto('./')
  await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await expect(undo(page)).toBeEnabled()
  await moveDate(page, '2026-11-21T00:01:00+09:00')
  await expect(card(page)).toContainText('남은 일')
  await expect(undo(page)).toBeDisabled()
  await expect(
    page.getByText('날짜가 바뀌어 이전 계획은 되돌릴 수 없어요.', { exact: true }),
  ).toBeVisible()
})

test('L05 전체 목록의 미래 기한을 오늘로 바꾸면 오늘에 반영·명시적 제외와 되돌리기 보존', async ({
  page,
}) => {
  await seed(page, [make('기존 일'), make('미래 일', { dueDate: '2026-11-23' })], {
    planTaskIds: ['기존 일'],
  })
  await page.goto('./')
  await showAll(page)
  await page.getByRole('button', { name: '미래 일 편집', exact: true }).click()
  await page.locator('.date-shortcuts').getByRole('button', { name: '오늘', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '오늘에서 빼기', exact: true })).toBeChecked()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await showToday(page)
  await expect(card(page)).toContainText('미래 일')
  await expect(progress(page)).toHaveAttribute('aria-valuemax', '2')
  await undo(page).click()
  expect((await tasks(page)).find((t) => t.id === '미래 일')?.dueDate).toBe('2026-11-23')
  expect((await plan(page)).planTaskIds).toEqual(['기존 일'])
  await showAll(page)
  await page.getByRole('button', { name: '미래 일 편집', exact: true }).click()
  await page.locator('.date-shortcuts').getByRole('button', { name: '오늘', exact: true }).click()
  await page.getByRole('checkbox', { name: '오늘에서 빼기', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '오늘에 넣기', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await plan(page)).planTaskIds).toEqual(['기존 일'])
  await showToday(page)
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await expect(page.getByRole('heading', { name: '오늘까지 할 일이 남아 있어요.' })).toBeVisible()
})

test('L06 실제 자정 타이머는 완료·미루기를 초기화하고 오늘 기한·다음주 기한을 다시 고른다', async ({
  page,
}) => {
  await seed(
    page,
    [
      make('어제 마친 일'),
      make('오늘 마감', { dueDate: '2026-11-21' }),
      make('다음주 마감', { dueDate: '2026-11-23' }),
    ],
    { limit: 1, planTaskIds: ['어제 마친 일'] },
  )
  await page.goto('./')
  await card(page).getByRole('button', { name: '완료했어요' }).click()
  await moveDate(page, '2026-11-20T23:59:59+09:00')
  await page.clock.runFor(1100)
  await expect(card(page)).toContainText('오늘 마감')
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '0')
  expect((await plan(page)).day).toBe('2026-11-21')
  await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await moveDate(page, '2026-11-23T09:00:00+09:00', 'visibilitychange')
  await expect(card(page)).toContainText('오늘 마감')
  await expect(card(page)).toContainText('기한 초과')
  expect((await plan(page)).skippedTaskIds).toEqual([])
  expect((await tasks(page)).find((t) => t.id === '다음주 마감')?.dueDate).toBe('2026-11-23')
  await page.reload()
  await expect(card(page)).toContainText('오늘 마감')
})

for (const action of ['완료', '삭제'] as const) {
  test(`L07 ${action} 뒤 다음 날 되돌려도 오늘의 새 계획을 어제 것으로 덮어쓰지 않는다`, async ({
    page,
  }) => {
    await seed(
      page,
      [make('복원할 일', { dueDate: day }), make('다음날 일', { dueDate: '2026-11-21' })],
      { limit: 1, planTaskIds: ['복원할 일'] },
    )
    await page.goto('./')
    if (action === '완료') await card(page).getByRole('button', { name: '완료했어요' }).click()
    else {
      await page.getByRole('button', { name: '복원할 일 편집', exact: true }).click()
      await page.getByRole('button', { name: '삭제', exact: true }).click()
    }
    await moveDate(page, '2026-11-21T09:00:00+09:00')
    const todayPlan = await plan(page)
    await undo(page).click()
    expect((await tasks(page)).find((t) => t.id === '복원할 일')?.completedAt).toBeNull()
    expect(await plan(page)).toEqual(todayPlan)
    await expect(page.locator('.outside-due')).toContainText('1개')
    await card(page).getByRole('button', { name: '완료했어요' }).click()
    await expect(page.getByRole('heading', { name: '오늘까지 할 일이 남아 있어요.' })).toBeVisible()
    await page.getByRole('button', { name: '남은 일 오늘에 넣기' }).click()
    await expect(card(page)).toContainText('복원할 일')
  })
}

test('L08 미리보기 수정·제외·반환·오류 수정·저장·원문 복구·새로고침', async ({ page }) => {
  await page.goto('./')
  await memo(page, '오늘 제출\n2026-02-30 날짜 오류')
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await tasks(page)).toHaveLength(0)
  const raw = '오늘 제출\n내일 장보기\n다음 주 월요일 발표'
  await memo(page, raw)
  await page.getByRole('button', { name: '장보기 정리 결과에서 제외' }).click()
  await page.getByLabel('정리한 제목 1', { exact: true }).fill('')
  await saveMemo(page)
  expect(await tasks(page)).toHaveLength(0)
  await page.getByLabel('정리한 제목 1', { exact: true }).fill('최종 제출')
  await saveMemo(page)
  expect((await tasks(page)).map((t) => t.title)).toEqual(['최종 제출', '발표'])
  await page.getByLabel('할 일 메모', { exact: true }).fill('쓰던 다음 메모')
  await undo(page).click()
  expect(await tasks(page)).toHaveLength(0)
  await expect(page.getByLabel('할 일 메모', { exact: true })).toHaveValue('쓰던 다음 메모')
  await memo(page, raw)
  await saveMemo(page)
  await page.reload()
  expect(await tasks(page)).toHaveLength(3)
  await expect(undo(page)).toBeDisabled()
})

test('L09 모든 일을 미룸·한 개 완료·완료 취소·다시 이어가기와 분량 변경 취소', async ({ page }) => {
  await seed(page, [
    make('오늘1', { dueDate: day }),
    make('오늘2', { dueDate: day }),
    make('미래', { dueDate: '2026-11-23' }),
  ])
  await page.goto('./')
  for (let i = 0; i < 3; i++) await card(page).getByRole('button', { name: '나중에 하기' }).click()
  await expect(page.getByRole('button', { name: '미뤄 둔 일 이어가기' })).toBeVisible()
  await page.getByRole('checkbox', { name: '오늘1 완료', exact: true }).click()
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '1')
  await undo(page).click()
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '0')
  await page.getByRole('button', { name: '미뤄 둔 일 이어가기' }).click()
  await expect(card(page)).toContainText('오늘1')
  const before = await plan(page)
  await page.locator('.plan-options summary').click()
  await page.getByLabel('오늘 기본 분량').selectOption('1')
  await page.locator('.plan-options summary').click()
  await undo(page).click()
  expect(await plan(page)).toEqual(before)
})

test('L10 수동 모드 전체 입력·자정·지난 묶음 추가 취소도 원본을 복구한다', async ({ page }) => {
  await seed(page, [], { enabled: false })
  await page.goto('./')
  await showAll(page)
  await page.getByRole('checkbox', { name: '문장 자동 정리', exact: true }).check()
  await memo(page, '오늘 보고서 마감\n내일 과제 마감\n기한 없는 일')
  await saveMemo(page)
  await showToday(page)
  await expect(page.getByRole('button', { name: '보고서 마감 편집', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '과제 마감 편집', exact: true })).toHaveCount(0)
  await moveDate(page, '2026-11-21T08:00:00+09:00')
  await expect(page.getByRole('button', { name: '과제 마감 편집', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '보고서 마감 편집', exact: true })).toBeVisible()
  await undo(page).click()
  expect(await tasks(page)).toHaveLength(0)
  expect((await plan(page)).enabled).toBe(false)
  await page.reload()
  expect(await tasks(page)).toHaveLength(0)
  await expect(page.locator('.page-header')).toContainText('11월 21일')
})

test('L11 연말·윤년·월요일 경계의 실제 메모 저장과 다음날 재방문', async ({ page }) => {
  await moveDate(page, '2026-12-31T23:59:00+09:00')
  await page.goto('./')
  await memo(page, '내일 새해 계획\n다음 주 월요일 발표')
  await saveMemo(page)
  expect((await tasks(page)).map((t) => t.dueDate)).toEqual(['2027-01-01', '2027-01-04'])
  await moveDate(page, '2027-01-01T09:00:00+09:00')
  await page.reload()
  await expect(card(page)).toContainText('새해 계획')
  await moveDate(page, '2028-02-28T09:00:00+09:00')
  await memo(page, '내일 윤일 제출\n모레 삼월 준비')
  await saveMemo(page)
  expect((await tasks(page)).slice(-2).map((t) => t.dueDate)).toEqual(['2028-02-29', '2028-03-01'])
})

test('L12 미리보기에서 고친 기한으로만 계획하고 다음 날 묶음 취소도 다른 일을 보존한다', async ({
  page,
}) => {
  await seed(page, [make('남겨 둘 일')], { planTaskIds: ['남겨 둘 일'] })
  await page.goto('./')
  await memo(page, '내일 제출\n오늘 청소')
  await page.getByLabel('할 일 1 기한·분류 수정', { exact: true }).click()
  await page.getByLabel('정리한 기한 1', { exact: true }).fill(day)
  await page.getByLabel('할 일 2 기한·분류 수정', { exact: true }).click()
  await page.getByLabel('정리한 기한 2', { exact: true }).fill('2026-11-23')
  await saveMemo(page)
  await expect(progress(page)).toHaveAttribute('aria-valuemax', '2')
  await expect(card(page)).toContainText('제출')
  await moveDate(page, '2026-11-21T08:00:00+09:00')
  await undo(page).click()
  expect((await tasks(page)).map((t) => t.id)).toEqual(['남겨 둘 일'])
  expect((await plan(page)).day).toBe('2026-11-21')
  await expect(page.getByLabel('할 일 메모', { exact: true })).toHaveValue('내일 제출\n오늘 청소')
  await expect(card(page)).toContainText('남겨 둘 일')
})

test('L13 자정 후 원문으로 돌아가 다시 정리하면 새 오늘 기준을 쓰고 확인은 날짜마다 필요하다', async ({
  page,
}) => {
  await page.goto('./')
  await memo(page, '내일 제출')
  await moveDate(page, '2026-11-21T08:00:00+09:00')
  await page.getByLabel('정리한 기한을 확인했어요', { exact: true }).check()
  await moveDate(page, '2026-11-22T08:00:00+09:00')
  await expect(page.getByRole('button', { name: '1개 담기', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '메모로 돌아가기', exact: true }).click()
  await page.getByRole('button', { name: '메모 정리하기', exact: true }).click()
  await expect(page.getByLabel('정리한 기한 1', { exact: true })).toHaveValue('2026-11-23')
  await saveMemo(page)
  expect((await tasks(page))[0].dueDate).toBe('2026-11-23')
})

test('L14 수동 편집창에서 어제 선택했던 체크는 새 날짜로 옮겨지지 않는다', async ({ page }) => {
  await seed(page, [make('수동 선택', { focusDate: day })], { enabled: false })
  await page.goto('./')
  await page.getByRole('button', { name: '수동 선택 편집', exact: true }).click()
  await moveDate(page, '2026-11-21T08:00:00+09:00')
  await expect(page.getByRole('checkbox', { name: '오늘에 넣기', exact: true })).not.toBeChecked()
  await page.getByLabel('제목', { exact: true }).fill('수정한 수동 선택')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await tasks(page))[0].focusDate).toBe(day)
  await expect(
    page.getByRole('button', { name: '수정한 수동 선택 편집', exact: true }),
  ).toHaveCount(0)
  await showAll(page)
  await page.getByRole('button', { name: '수정한 수동 선택 편집', exact: true }).click()
  await page.getByRole('checkbox', { name: '오늘에 넣기', exact: true }).click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await tasks(page))[0].focusDate).toBe('2026-11-21')
  await undo(page).click()
  expect((await tasks(page))[0].focusDate).toBe(day)
})

test('L15 뉴욕 DST 시작일의 23시간 하루 뒤에도 로컬 자정에 계획이 갱신된다', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ timezoneId: 'America/New_York', locale: 'ko-KR' })
  const page = await context.newPage()
  try {
    await page.clock.install({ time: new Date('2026-03-08T00:00:00-05:00') })
    await page.goto(baseURL!)
    await memo(page, '오늘 첫날 할 일\n내일 둘째 날 할 일')
    await saveMemo(page)
    expect((await tasks(page)).map((t) => t.dueDate)).toEqual(['2026-03-08', '2026-03-09'])
    await card(page).getByRole('button', { name: '완료했어요' }).click()
    await page.clock.fastForward(23 * 60 * 60 * 1000 + 100)
    await expect(card(page)).toContainText('둘째 날 할 일')
    await expect(card(page)).toContainText('오늘까지 할 일')
    expect((await plan(page)).day).toBe('2026-03-09')
    await expect(progress(page)).toHaveAttribute('aria-valuemax', '1')
    await expect(progress(page)).toHaveAttribute('aria-valuenow', '0')
  } finally {
    await context.close()
  }
})
