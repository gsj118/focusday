import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createTask, type Task } from '../../src/domain'
import { STORAGE_KEY } from '../../src/storage'

declare global {
  interface Window {
    __failWrite?: boolean
    __failRead?: boolean
  }
}
const today = '2026-10-02'
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', today, '2026-10-02T00:00:00.000Z', id),
  ...extra,
})
async function seed(page: Page, tasks: Task[]) {
  await page.addInitScript(
    ({ key, tasks }) => localStorage.setItem(key, JSON.stringify({ version: 1, tasks })),
    { key: STORAGE_KEY, tasks },
  )
}
async function readTasks(page: Page): Promise<Task[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).tasks, STORAGE_KEY)
}
async function add(page: Page, title: string) {
  await page.getByLabel('새 할 일 제목').fill(title)
  await page.getByLabel('새 할 일 제목').press('Enter')
}
async function all(page: Page) {
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
}
async function demo(page: Page) {
  await page.getByRole('button', { name: '예시로 둘러보기', exact: true }).last().click()
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
})

test('최초 빈 상태·오늘/전체 생성 기본값·연속 입력·키별 저장', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '해야 할 일을 하나 적어보세요' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
  await add(page, '  오늘 테스트  ')
  await expect(page.getByLabel('새 할 일 제목')).toHaveValue('')
  await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
  await all(page)
  await add(page, '전체 테스트')
  const tasks = await readTasks(page)
  expect(tasks[0]).toMatchObject({
    title: '오늘 테스트',
    focusDate: today,
    dueDate: null,
    isDemo: false,
  })
  expect(tasks[1]).toMatchObject({ title: '전체 테스트', focusDate: null, dueDate: null })
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /오늘/ })
    .click()
  await expect(page.getByRole('button', { name: '전체 테스트 편집', exact: true })).toHaveCount(0)
})
test('속성 저장·새로고침 유지·미래 기한과 오늘 독립·기한에 의한 잔류 안내', async ({ page }) => {
  await page.goto('./')
  await add(page, '내일 발표')
  await page.getByRole('button', { name: '내일 발표 편집', exact: true }).click()
  await page.getByLabel('기한', { exact: true }).fill('2026-10-03')
  await page.getByLabel('우선순위').selectOption('high')
  await page.getByLabel('분류 선택').fill('업무')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page.getByText('내일 기한', { exact: true })).toBeVisible()
  await page.reload()
  expect((await readTasks(page))[0]).toMatchObject({
    dueDate: '2026-10-03',
    focusDate: today,
    priority: 'high',
    category: '업무',
  })
  await page.getByRole('button', { name: '내일 발표 집중 해제', exact: true }).click()
  await expect(page.getByRole('button', { name: '내일 발표 편집', exact: true })).toHaveCount(0)
  await all(page)
  await page.getByRole('button', { name: '내일 발표 집중하기', exact: true }).click()
  expect((await readTasks(page))[0].dueDate).toBe('2026-10-03')
  await page.getByRole('button', { name: '내일 발표 편집', exact: true }).click()
  await page.getByLabel('기한', { exact: true }).fill(today)
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await page.getByRole('button', { name: '내일 발표 집중 해제', exact: true }).click()
  await expect(
    page.getByText('집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '기한 편집', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '해제', exact: true }).click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  expect((await readTasks(page))[0]).toMatchObject({ focusDate: null, dueDate: null })
})
test('빈 제목·200자 한글·공백 없는 제목·한글 IME 조합 이벤트', async ({ page }) => {
  await page.goto('./')
  await add(page, '   ')
  await expect(page.getByText('할 일 제목을 입력해 주세요.', { exact: true })).toBeVisible()
  const input = page.getByLabel('새 할 일 제목')
  await input.fill('한글')
  await input.dispatchEvent('compositionstart')
  await input.press('Enter')
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
  await input.dispatchEvent('compositionend')
  await input.press('Enter')
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
  await page.clock.runFor(100)
  await input.press('Enter')
  expect(await readTasks(page)).toHaveLength(1)
  await add(page, '가'.repeat(200))
  expect((await readTasks(page))[1].title).toHaveLength(200)
  await input.fill('a'.repeat(201))
  await expect(input).toHaveValue('a'.repeat(200))
  await page.getByRole('button', { name: `${'가'.repeat(200)} 편집`, exact: true }).click()
  await expect(page.getByLabel('제목', { exact: true })).toHaveValue('가'.repeat(200))
  await page.getByLabel('제목', { exact: true }).fill('   ')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('할 일 제목을 입력해 주세요.', { exact: true })).toBeVisible()
})
test('완료·실행 취소·다른 항목 편집 보존·완료 목록 복원', async ({ page }) => {
  await seed(page, [task('A', { focusDate: today }), task('B', { focusDate: today })])
  await page.goto('./')
  await page.getByRole('checkbox', { name: 'A 완료', exact: true }).click()
  await expect(page.getByRole('button', { name: 'A 편집', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'B 편집', exact: true }).click()
  await page.getByLabel('제목', { exact: true }).fill('B 수정')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  expect((await readTasks(page)).map((t) => t.title)).toEqual(['A', 'B 수정'])
  await page.getByRole('checkbox', { name: 'A 완료', exact: true }).click()
  await page.getByRole('button', { name: '완료 목록', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'A 미완료로 복원', exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'A 미완료로 복원', exact: true }).click()
  expect((await readTasks(page)).find((t) => t.id === 'A')!.completedAt).toBeNull()
})
test('삭제 취소는 원래 id·날짜·우선순위·분류·완료·예시 상태를 복원', async ({ page }) => {
  const original = task('완료된 예시', {
    dueDate: '2026-10-03',
    focusDate: today,
    category: '분류',
    priority: 'high',
    completedAt: '2026-10-02T01:00:00.000Z',
    isDemo: true,
  })
  await seed(page, [original])
  await page.goto('./')
  await all(page)
  await page.getByText('완료된 할 일', { exact: false }).last().click()
  await page.getByRole('button', { name: '완료된 예시 편집', exact: true }).click()
  await page.getByRole('button', { name: '삭제', exact: true }).click()
  expect(await readTasks(page)).toHaveLength(0)
  await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  expect((await readTasks(page))[0]).toEqual(original)
})
test('최근 행동만 실행 취소·이전 타이머 격리·hover/키보드에서 만료 정지', async ({ page }) => {
  await seed(page, [task('A', { focusDate: today }), task('B', { focusDate: today })])
  await page.goto('./')
  await page.getByRole('checkbox', { name: 'A 완료', exact: true }).click()
  await page.clock.runFor(6000)
  await page.getByRole('checkbox', { name: 'B 완료', exact: true }).click()
  await page.clock.runFor(2100)
  const undo = page.getByRole('button', { name: '실행 취소', exact: true })
  await expect(undo).toBeVisible()
  await undo.hover()
  await page.clock.runFor(10000)
  await expect(undo).toBeVisible()
  await undo.focus()
  await page.mouse.move(0, 0)
  await page.clock.runFor(10000)
  await expect(undo).toBeVisible()
  await undo.press('Enter')
  expect((await readTasks(page)).find((t) => t.id === 'B')!.completedAt).toBeNull()
  expect((await readTasks(page)).find((t) => t.id === 'A')!.completedAt).not.toBeNull()
  await page.getByRole('checkbox', { name: 'B 완료', exact: true }).click()
  await page.mouse.move(0, 0)
  await page.getByLabel('새 할 일 제목').focus()
  await page.clock.runFor(8100)
  await expect(undo).toHaveCount(0)
})
test('자정 전환 시 집중만 만료·기한 초과 표시·전체 보존', async ({ page }) => {
  await page.clock.setSystemTime(new Date('2026-10-02T23:59:59+09:00'))
  await seed(page, [task('집중만', { focusDate: today }), task('기한만', { dueDate: today })])
  await page.goto('./')
  await page.clock.runFor(2000)
  await expect(page.getByRole('button', { name: '집중만 편집', exact: true })).toHaveCount(0)
  await expect(page.getByText('기한 초과 · 1일 지남', { exact: true })).toBeVisible()
  await all(page)
  await expect(page.getByRole('button', { name: '집중만 편집', exact: true })).toBeVisible()
})
for (const event of ['focus', 'visibilitychange'])
  test(`${event}에서 날짜 갱신·연말 경계`, async ({ page }) => {
    await page.clock.setSystemTime(new Date('2026-12-31T12:00:00+09:00'))
    await seed(page, [
      task('연말 집중', { focusDate: '2026-12-31' }),
      task('연말 기한', { dueDate: '2026-12-31' }),
    ])
    await page.goto('./')
    await page.clock.setSystemTime(new Date('2027-01-01T10:00:00+09:00'))
    await page.evaluate(
      (event) => (event === 'focus' ? window : document).dispatchEvent(new Event(event)),
      event,
    )
    await expect(page.getByRole('button', { name: '연말 집중 편집', exact: true })).toHaveCount(0)
    await expect(page.getByText('기한 초과 · 1일 지남', { exact: true })).toBeVisible()
  })
test('쓰기 실패 시 메모리 유지·지속 경고·실제 성공한 재시도', async ({ page }) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem
    window.__failWrite = true
    Storage.prototype.setItem = function (k, v) {
      if (k === key && window.__failWrite) throw new DOMException('quota', 'QuotaExceededError')
      original.call(this, k, v)
    }
  }, STORAGE_KEY)
  await page.goto('./')
  await add(page, '메모리에 남음')
  await expect(page.getByRole('button', { name: '메모리에 남음 편집', exact: true })).toBeVisible()
  await expect(page.getByText('저장됨', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '새로고침하면 변경 내용이 사라질 수 있습니다.',
  )
  await page.evaluate(() => {
    window.__failWrite = false
  })
  await page.getByRole('button', { name: '저장 재시도' }).click()
  expect(await readTasks(page)).toHaveLength(1)
  await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
for (const raw of ['{broken', '{"version":2,"tasks":[]}', '{"version":1,"tasks":[{}]}'])
  test(`손상 원본 자동 덮어쓰기 차단: ${raw}`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key: STORAGE_KEY,
      raw,
    })
    await page.goto('./')
    await add(page, '아직 저장 안 됨')
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
    await expect(page.getByRole('alert')).toContainText('원본은 자동으로 덮어쓰지 않습니다.')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '원본 다운로드', exact: true }).click()
    const download = await downloadPromise
    expect(await readFile((await download.path())!, 'utf8')).toBe(raw)
    await download.delete()
    await page.getByRole('button', { name: '원본 초기화…' }).click()
    await page.getByRole('button', { name: '취소', exact: true }).click()
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
    await page.getByRole('button', { name: '원본 초기화…' }).click()
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      window.__failWrite = true
      Storage.prototype.setItem = function (k, v) {
        if (k === key && window.__failWrite) throw new DOMException('quota', 'QuotaExceededError')
        original.call(this, k, v)
      }
    }, STORAGE_KEY)
    await page.getByRole('button', { name: '원본 삭제 후 현재 목록 저장' }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('원본을 유지했습니다.')
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
    await page.evaluate(() => {
      window.__failWrite = false
    })
    await page.getByRole('button', { name: '원본 삭제 후 현재 목록 저장' }).click()
    expect((await readTasks(page))[0].title).toBe('아직 저장 안 됨')
  })
test('읽기 실패는 쓰기를 보호하고 재시도 때 기존 항목과 메모리 항목 합침', async ({ page }) => {
  await seed(page, [task('기존 사용자')])
  await page.addInitScript((key) => {
    const original = Storage.prototype.getItem
    window.__failRead = true
    Storage.prototype.getItem = function (k) {
      if (k === key && window.__failRead) throw new DOMException('blocked', 'SecurityError')
      return original.call(this, k)
    }
  }, STORAGE_KEY)
  await page.goto('./')
  await add(page, '임시 항목')
  await expect(page.getByRole('alert')).toContainText('기존 데이터 보호')
  await page.evaluate(() => {
    window.__failRead = false
  })
  expect(await readTasks(page)).toHaveLength(1)
  await page.getByRole('button', { name: '다시 읽기' }).click()
  expect((await readTasks(page)).map((t) => t.title)).toEqual(['기존 사용자', '임시 항목'])
})
test('localStorage 접근 자체 실패도 빈 값으로 덮어쓰지 않는다', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError')
      },
    }),
  )
  await page.goto('./')
  await add(page, '접근 실패 항목')
  await expect(page.getByRole('alert')).toContainText('기존 데이터 보호')
  await page.getByRole('button', { name: '다시 읽기' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
})
test('예시 선택·중복 방지·검색 현재 보기·완료 검색·예시 제거 사용자 보존', async ({ page }) => {
  await page.goto('./')
  await add(page, '실제 사용자')
  await page.locator('.sidebar .app-menu summary').click()
  await page
    .locator('.sidebar .app-menu')
    .getByRole('button', { name: '예시로 둘러보기', exact: true })
    .click()
  expect(await readTasks(page)).toHaveLength(6)
  await page
    .locator('.sidebar .app-menu')
    .getByRole('button', { name: '예시로 둘러보기', exact: true })
    .click()
  expect(await readTasks(page)).toHaveLength(6)
  await page.getByLabel('제목·분류 검색').fill('주말')
  await expect(page.getByText('검색 결과 0개', { exact: false })).toBeVisible()
  await all(page)
  await expect(page.getByText('검색 결과 1개', { exact: false })).toBeVisible()
  await page.getByRole('checkbox', { name: '주말 장보기 완료', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: '주말 장보기 미완료로 복원', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '검색 지우기', exact: true }).first().click()
  await page.getByLabel('제목·분류 검색').fill('존재하지않음')
  await expect(page.getByRole('heading', { name: '일치하는 할 일이 없습니다' })).toBeVisible()
  await page
    .locator('.sidebar .app-menu')
    .getByRole('button', { name: '예시 데이터 제거', exact: true })
    .click()
  expect((await readTasks(page)).map((t) => t.title)).toEqual(['실제 사용자'])
})
test('200개 기본 검색·편집·완료·스크롤', async ({ page }) => {
  await seed(
    page,
    Array.from({ length: 200 }, (_, i) =>
      task(`할일-${String(i).padStart(3, '0')}`, { focusDate: today }),
    ),
  )
  await page.goto('./')
  await expect(page.locator('.task-row')).toHaveCount(200)
  await page.locator('.task-row').last().scrollIntoViewIfNeeded()
  await expect(page.locator('.task-row').last()).toBeInViewport()
  await page.getByLabel('제목·분류 검색').fill('할일-199')
  await expect(page.locator('.task-row')).toHaveCount(1)
  await page.getByRole('button', { name: '할일-199 편집', exact: true }).click()
  await page.getByLabel('분류 선택').fill('정리')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await page.getByRole('checkbox', { name: '할일-199 완료', exact: true }).click()
  expect((await readTasks(page)).find((t) => t.id === '할일-199')!.category).toBe('정리')
})
test('키보드 추가→편집→저장→완료→실행 취소, dialog trap·Escape·포커스 복귀', async ({ page }) => {
  await page.goto('./')
  await page.keyboard.press('n')
  await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  await page.keyboard.type('Keyboard task')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('checkbox', { name: 'Keyboard task 완료', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('제목', { exact: true })).toBeFocused()
  await page.getByLabel('제목', { exact: true }).fill('취소될 초안')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: '편집 닫기' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Space')
  await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.locator('.achievements-section > summary')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '실행 취소', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeVisible()
})

for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [390, 844],
  [320, 740],
])
  test(`화면 ${width}×${height}·overflow·편집·스크린샷`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('./')
    await demo(page)
    await expect(page.locator('.task-row')).toHaveCount(3)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width < 900) {
      await expect(page.getByRole('navigation', { name: '모바일 보기' })).toBeVisible()
      expect(
        (await page.getByRole('button', { name: '+ 할 일 추가', exact: true }).boundingBox())!
          .height,
      ).toBeGreaterThanOrEqual(44)
    }
    await page.screenshot({
      path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.4/regression'}/${width === 1440 ? 'desktop' : width === 390 ? 'mobile' : `layout-${width}`}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '발표 자료 최종 확인 편집', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    const box = (await page.getByRole('dialog').boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    await page.screenshot({
      path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.4/regression'}/${width === 1440 ? 'desktop-editor' : width === 390 ? 'mobile-editor' : `editor-${width}`}.png`,
      fullPage: true,
    })
    await page.getByLabel('제목', { exact: true }).fill('긴한글제목'.repeat(40))
    await page.getByRole('button', { name: '저장', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: `${'긴한글제목'.repeat(40)} 편집`, exact: true }).click()
    await page.getByRole('button', { name: '취소', exact: true }).click()
  })
test('reduced-motion·실제 토큰 대비·production 자산 응답', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const failures: string[] = []
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(r.url())
  })
  await page.goto('./')
  await demo(page)
  expect(
    await page
      .getByRole('button', { name: '추가', exact: true })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s')
  const pairs = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement)
    return [
      ['--text', '--surface'],
      ['--muted', '--sidebar'],
      ['--on-accent', '--accent'],
      ['--on-accent', '--focus'],
      ['--danger', '--surface'],
      ['--focus', '--soft'],
      ['--muted', '--hover'],
      ['--warning', '--surface'],
      ['--toast-action', '--toast-bg'],
    ].map((pair) => pair.map((token) => css.getPropertyValue(token).trim()))
  })
  const luminance = (hex: string) =>
    (hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex)
      .slice(1)
      .match(/../g)!
      .map((v) => parseInt(v, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((acc, n, i) => acc + n * [0.2126, 0.7152, 0.0722][i], 0)
  for (const [fg, bg] of pairs) {
    const a = luminance(fg),
      b = luminance(bg)
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5)
  }
  expect(errors).toEqual([])
  expect(failures).toEqual([])
})
