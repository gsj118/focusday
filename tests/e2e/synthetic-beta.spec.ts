import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createBackup, MAX_BACKUP_BYTES } from '../../src/backup'
import { createTask, type Task } from '../../src/domain'

const day = '2026-10-02'
const phase = process.env.BETA_PHASE || 'after'
const shotDir = process.env.FOCUSDAY_SCREENSHOTS || `docs/screenshots/v1.2/${phase}`
type CaseResult = Record<string, unknown>
const results = new Map<string, CaseResult[]>()
const make = (id: string, extra: Partial<Task> = {}) => ({
  ...createTask(id, 'all', day, '2026-10-02T00:00:00.000Z', id),
  ...extra,
})
async function stored(page: Page): Promise<Task[]> {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('focusday:v1') || '{"tasks":[]}').tasks,
  )
}
async function state(page: Page) {
  const raw = await page.evaluate(() => {
    try {
      return localStorage.getItem('focusday:v1')
    } catch {
      return 'UNAVAILABLE'
    }
  })
  return {
    rawBytes: Buffer.byteLength(raw || ''),
    rawSHA256: createHash('sha256')
      .update(raw || '')
      .digest('hex'),
    taskCount:
      raw && raw !== 'UNAVAILABLE'
        ? (() => {
            try {
              return JSON.parse(raw).tasks?.length ?? null
            } catch {
              return null
            }
          })()
        : 0,
  }
}
async function seed(page: Page, tasks: Task[]) {
  await page.addInitScript(
    (raw) => {
      if (localStorage.getItem('focusday:v1') === null) localStorage.setItem('focusday:v1', raw)
    },
    JSON.stringify({ version: 1, tasks }),
  )
}
async function all(page: Page) {
  await page
    .getByRole('navigation', {
      name: page.viewportSize()!.width < 900 ? '모바일 보기' : '할 일 보기',
      exact: true,
    })
    .getByRole('button', { name: /전체/ })
    .click()
}
async function manage(page: Page) {
  const menu = page.locator(
    page.viewportSize()!.width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu',
  )
  await menu.locator('summary').click()
  await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
}
async function exported(page: Page) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  const file = await pending
  const text = await readFile((await file.path())!, 'utf8')
  expect(file.suggestedFilename()).toBe(`focusday-backup-${day}.json`)
  await file.delete()
  return { text, data: JSON.parse(text).data as { version: 1; tasks: Task[] } }
}
const incoming = (tasks: Task[]) => ({
  name: 'beta-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks }))),
})
async function check(
  page: Page,
  info: TestInfo,
  ids: string[],
  fixture: string,
  steps: string,
  expected: string,
  action: () => Promise<void>,
) {
  const initial = await state(page)
  const record: CaseResult = {
    caseIds: ids,
    personaId: info.title.slice(0, 3),
    phase,
    sourceCommit: process.env.BETA_SOURCE || 'working-tree',
    checkedAt: new Date().toISOString(),
    environment: {
      browser: page.context().browser()!.version(),
      viewport: page.viewportSize(),
      timezone: 'Asia/Seoul',
      fixtureClock: '2026-10-02T10:00:00+09:00',
      mobile: await page.evaluate(() => navigator.maxTouchPoints > 0),
    },
    fixture,
    steps,
    expected,
    initial,
    evidenceKind: 'actual Chrome UI with assertions; synthetic data/clock; no human study',
    test: info.title,
  }
  try {
    await test.step(`[${ids.join(',')}] ${steps}`, action)
    record.status = 'PASS'
    record.actual = 'All stated UI/data assertions passed'
  } catch (error) {
    record.status = 'FAIL'
    record.actual = String(error)
    const filename = `${info.title.slice(0, 3)}-${ids[0]}-failure.png`
    await page.screenshot({ path: `${shotDir}/${filename}` })
    record.screenshot = `${shotDir}/${filename}`
    if (phase !== 'before') throw error
  } finally {
    record.final = await state(page)
    const list = results.get(info.title) || []
    list.push(record)
    results.set(info.title, list)
  }
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
})
test.afterEach(async ({}, info) => {
  await info.attach('synthetic-cases', {
    body: Buffer.from(JSON.stringify(results.get(info.title) || [])),
    contentType: 'application/json',
  })
  results.delete(info.title)
})

test('P01 처음 사용: 빈 안내→Enter→편집·취소→완료 복구', async ({ page }, info) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('./')
  await check(
    page,
    info,
    ['A01', 'A02', 'B01'],
    'empty, UI creation',
    '빈 안내에서 제목 Enter, 행 제목을 눌러 편집',
    '1개, 정확한 title/오늘 focus/null due; 편집 제목 focus',
    async () => {
      await expect(
        page.getByRole('heading', { name: '해야 할 일을 하나 적어보세요' }),
      ).toBeVisible()
      await expect(page.getByLabel('새 할 일 제목')).toHaveAttribute(
        'placeholder',
        '무엇을 해야 하나요?',
      )
      await page.getByLabel('새 할 일 제목').fill('자료구조 과제 제출')
      await page.keyboard.press('Enter')
      expect(await stored(page)).toMatchObject([
        { title: '자료구조 과제 제출', focusDate: day, dueDate: null },
      ])
      await page.getByRole('button', { name: '자료구조 과제 제출 편집', exact: true }).click()
      await expect(page.getByLabel('제목', { exact: true })).toBeFocused()
    },
  )
  await check(
    page,
    info,
    ['B02', 'D01'],
    'one UI task',
    '여러 초안 변경 후 취소, 완료→실행 취소→reload',
    '초안/취소는 원본 불변, 완료 취소는 원래 속성 보존',
    async () => {
      const before = await stored(page)
      await page.getByLabel('제목', { exact: true }).fill('취소할 제목')
      await page.getByLabel('분류 선택').fill('초안')
      await page.getByRole('button', { name: '취소', exact: true }).click()
      expect(await stored(page)).toEqual(before)
      await expect(
        page.getByRole('button', { name: '자료구조 과제 제출 편집', exact: true }),
      ).toBeFocused()
      await page.getByRole('checkbox', { name: '자료구조 과제 제출 완료', exact: true }).click()
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      await page.reload()
      expect(await stored(page)).toMatchObject(
        before.map((task) => ({ ...task, updatedAt: expect.any(String) })),
      )
    },
  )
})
test('P02 빠른 기록: 전체 5개→버튼 비교→빈/길이/중복 복구', async ({ page }, info) => {
  await page.goto('./')
  await all(page)
  const input = page.getByLabel('새 할 일 제목')
  await check(
    page,
    info,
    ['A03', 'A04', 'A05'],
    'empty, 5 UI titles',
    '전체에서 주말 장보기 등 5개 연속 Enter, 버튼 1개, reload',
    '각 1개, 기본값 동일, 입력 초기화/focus, reload 유지',
    async () => {
      for (const title of ['주말 장보기', '강의 복습', '과제 작성', '약속 확인', '발표 준비']) {
        await input.fill(title)
        await page.keyboard.press('Enter')
        await expect(input).toBeEmpty()
        await expect(input).toBeFocused()
      }
      await input.fill('버튼 기록')
      await page.getByRole('button', { name: '추가', exact: true }).click()
      const tasks = await stored(page)
      expect(tasks).toHaveLength(6)
      for (const task of tasks)
        expect(task).toMatchObject({
          focusDate: null,
          dueDate: null,
          priority: 'none',
          category: null,
          completedAt: null,
          isDemo: false,
        })
      await page.reload()
      expect(await stored(page)).toEqual(tasks)
    },
  )
  await check(
    page,
    info,
    ['A06', 'A08', 'A09'],
    'six UI tasks',
    '빈/공백 Enter·추가, 199/200/201자, 빠른 연속 Enter와 의도적 같은 제목',
    '빈 항목 없음, maxLength200, 의도적 같은 제목 id 다름',
    async () => {
      await input.fill('   ')
      await page.keyboard.press('Enter')
      await page.getByRole('button', { name: '추가', exact: true }).click()
      expect(await stored(page)).toHaveLength(6)
      await expect(page.getByRole('alert')).toContainText('제목')
      for (const length of [199, 200, 201]) {
        await input.fill('가'.repeat(length))
        expect((await input.inputValue()).length).toBe(Math.min(length, 200))
        await page.keyboard.press('Enter')
      }
      await input.fill('같은 제목')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      expect(await stored(page)).toHaveLength(10)
      await input.fill('같은 제목')
      await page.keyboard.press('Enter')
      const same = (await stored(page)).filter((t) => t.title === '같은 제목')
      expect(same).toHaveLength(2)
      expect(same[0].id).not.toBe(same[1].id)
    },
  )
})
test('P03 키보드: 입력→Tab 편집→textarea Enter→취소→계획·백업', async ({ page }, info) => {
  await page.goto('./')
  await check(
    page,
    info,
    ['B04', 'F01', 'F02'],
    'empty UI task, keyboard traversal',
    'N 입력→Enter, Tab으로 편집, textarea Enter와 Escape, 계획/데이터 trap',
    'textarea Enter 줄바꿈만; Tab/ShiftTab/Escape 의미와 호출 focus 유지',
    async () => {
      await page.keyboard.press('n')
      await page.keyboard.type('Keyboard beta')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('제목', { exact: true })).toBeFocused()
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      await page.keyboard.type('second')
      await expect(page.getByLabel('제목', { exact: true })).toHaveValue('Keyboard beta\nsecond')
      expect((await stored(page))[0].title).toBe('Keyboard beta')
      await page.keyboard.press('Escape')
      await expect(
        page.getByRole('button', { name: 'Keyboard beta 편집', exact: true }),
      ).toBeFocused()
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).focus()
      await page.keyboard.press('Space')
      const close = page.getByRole('button', { name: '오늘 계획하기 닫기' })
      await expect(close).toBeFocused()
      await page.keyboard.press('n')
      await page.keyboard.press('/')
      await expect(close).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(close).toBeFocused()
      await page.keyboard.press('Escape')
      // Reach the auxiliary menu with Tab from a known navigation point.
      await page
        .getByRole('navigation', { name: '할 일 보기', exact: true })
        .getByRole('button', { name: /전체/ })
        .focus()
      for (
        let i = 0;
        i < 5 &&
        !(await page.locator('.sidebar summary').evaluate((el) => el === document.activeElement));
        i++
      )
        await page.keyboard.press('Tab')
      await expect(page.locator('.sidebar summary')).toBeFocused()
      await page.keyboard.press('Enter')
      for (
        let i = 0;
        i < 4 &&
        !(await page
          .locator('.sidebar')
          .getByRole('button', { name: '백업·복원', exact: true })
          .evaluate((el) => el === document.activeElement));
        i++
      )
        await page.keyboard.press('Tab')
      await expect(
        page.locator('.sidebar').getByRole('button', { name: '백업·복원', exact: true }),
      ).toBeFocused()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Shift+Tab')
      await expect(page.locator('#backup-file')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: '백업·복원 닫기' })).toBeFocused()
      await page.keyboard.press('Escape')
    },
  )
  await check(
    page,
    info,
    ['B02'],
    'keyboard UI task',
    '다시 편집 후 닫기, backdrop 클릭 취소',
    '두 경로 모두 원본 불변',
    async () => {
      const before = await stored(page)
      await page.getByRole('button', { name: 'Keyboard beta 편집', exact: true }).press('Enter')
      await page.getByLabel('제목', { exact: true }).fill('닫기 초안')
      await page.getByRole('button', { name: '편집 닫기' }).click()
      await page.getByRole('button', { name: 'Keyboard beta 편집', exact: true }).press('Enter')
      await page.getByLabel('제목', { exact: true }).fill('배경 취소')
      await page.mouse.click(10, 200)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(await stored(page)).toEqual(before)
    },
  )
})
test('P04 모바일 touch: 입력 Enter→편집→완료 영역 복원→계획', async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  })
  const page = await context.newPage()
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
  await page.goto(baseURL!)
  try {
    await check(
      page,
      info,
      ['A12', 'F04', 'D02'],
      'empty, touch with automation Enter; no OS keyboard',
      '터치 입력, Enter→상세 저장→완료→전체 검색/완료 복원',
      '1개 기본값, 44px 목표, 검색 중 완료/복원 일치',
      async () => {
        await page.getByLabel('새 할 일 제목').tap()
        await page.getByLabel('새 할 일 제목').fill('모바일 확인')
        await page.keyboard.press('Enter')
        await page.getByRole('button', { name: '모바일 확인 편집', exact: true }).tap()
        await page.getByLabel('분류 선택').fill('휴대폰')
        await page.getByRole('button', { name: '저장', exact: true }).tap()
        const box = (await page.locator('.check-target').boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
        await page.getByRole('checkbox', { name: '모바일 확인 완료', exact: true }).tap()
        await all(page)
        await page.getByLabel('제목·분류 검색').fill('휴대폰')
        await page.getByRole('checkbox', { name: '모바일 확인 미완료로 복원', exact: true }).tap()
        expect((await stored(page))[0].completedAt).toBeNull()
        await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
        await page.getByLabel('제목·분류 검색').fill('')
        await page
          .getByRole('navigation', { name: '모바일 보기' })
          .getByRole('button', { name: /오늘/ })
          .tap()
        await page.getByRole('button', { name: '오늘 계획하기', exact: true }).tap()
        await page.getByRole('button', { name: '오늘 계획하기 닫기' }).tap()
      },
    )
    await check(
      page,
      info,
      ['E03'],
      'one mobile task',
      '유효 파일 미리보기→취소→같은 파일 재선택',
      '목록/저장 원본 그대로, 파일명/수/기본 합치기 표시',
      async () => {
        const before = await stored(page)
        await manage(page)
        const file = incoming(before)
        await page.locator('#backup-file').setInputFiles(file)
        await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
        await expect(page.getByText('beta-backup.json', { exact: true })).toBeVisible()
        await expect(page.getByLabel('기존 데이터에 합치기')).toBeChecked()
        await page.getByRole('button', { name: '복원 취소', exact: true }).tap()
        expect(await stored(page)).toEqual(before)
        await manage(page)
        await page.locator('#backup-file').setInputFiles(file)
        await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
      },
    )
  } finally {
    await context.close()
  }
})
test('P05 320px: 긴 제목·분류 저장→계획/복원→취소', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('./')
  await check(
    page,
    info,
    ['B07', 'F03'],
    'UI 200-char title and 24-char category',
    '긴 제목 추가→네 우선순위/분류 경계→저장→긴 파일명 미리보기',
    'maxLength24/trim/null, 모든 컨트롤 접근/가로 넘침 없음',
    async () => {
      await page.getByLabel('새 할 일 제목').fill('긴'.repeat(200))
      await page.keyboard.press('Enter')
      await page.locator('.task-body').click()
      for (const priority of ['low', 'medium', 'none', 'high'])
        await page.getByLabel('우선순위').selectOption(priority)
      await page.getByLabel('분류 선택').fill('분'.repeat(25))
      await expect(page.getByLabel('분류 선택')).toHaveValue('분'.repeat(24))
      await page.getByRole('button', { name: '저장', exact: true }).click()
      expect((await stored(page))[0]).toMatchObject({ category: '분'.repeat(24), priority: 'high' })
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await manage(page)
      await page.locator('#backup-file').setInputFiles({
        ...incoming(await stored(page)),
        name: '긴백업파일이름'.repeat(20) + '.json',
      })
      await expect(page.getByRole('button', { name: '합치기 적용', exact: true })).toBeInViewport()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      expect(
        await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true)
      await page.getByRole('button', { name: '복원 취소', exact: true }).click()
    },
  )
  await check(
    page,
    info,
    ['B07'],
    'long UI task',
    '분류 공백만 저장→분류 없음 확인',
    '선택 필드가 null로 저장됨',
    async () => {
      await page.locator('.task-body').click()
      await page.getByLabel('분류 선택').fill('   ')
      await page.getByRole('button', { name: '저장', exact: true }).click()
      expect((await stored(page))[0].category).toBeNull()
    },
  )
})
test('P06 가시 영역 390×480: 입력→상세→복원 오류·재선택', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 480 })
  await page.goto('./')
  await check(
    page,
    info,
    ['B08', 'F05'],
    'UI task, reduced viewport (not physical keyboard)',
    '입력→상세 분류 저장→손상 파일 오류→정상 미리보기',
    '입력/저장/오류/적용에 스크롤로 접근, 원본 무변경',
    async () => {
      await page.getByLabel('새 할 일 제목').fill('가시 영역')
      await page.keyboard.press('Enter')
      await page.locator('.task-body').click()
      await page.getByLabel('분류 선택').fill('작은 화면')
      await page.getByLabel('분류 선택').scrollIntoViewIfNeeded()
      await expect(page.getByRole('button', { name: '저장', exact: true })).toBeInViewport()
      await page.getByRole('button', { name: '저장', exact: true }).click()
      const before = await stored(page)
      await manage(page)
      await page.locator('#backup-file').setInputFiles({
        name: 'bad.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{broken'),
      })
      const error = page.getByRole('alert')
      await error.scrollIntoViewIfNeeded()
      await expect(error).toBeInViewport()
      expect(await stored(page)).toEqual(before)
      await page.locator('#backup-file').setInputFiles(incoming(before))
      await page.getByRole('button', { name: '합치기 적용', exact: true }).scrollIntoViewIfNeeded()
      await expect(page.getByRole('button', { name: '합치기 적용', exact: true })).toBeInViewport()
      await page.getByRole('button', { name: '복원 취소', exact: true }).click()
    },
  )
})
test('P07 기한/집중: 어제→이어가기→집중 해제→미래 기한', async ({ page }, info) => {
  const tasks = [
    make('겹침', { dueDate: day, focusDate: '2026-10-01' }),
    make('미래', { dueDate: '2026-10-03', focusDate: '2026-10-01' }),
    make('어제 완료', { focusDate: '2026-10-01', completedAt: '2026-10-01T00:00:00.000Z' }),
    make('이틀 전', { focusDate: '2026-09-30' }),
  ]
  await seed(page, tasks)
  await page.goto('./')
  await check(
    page,
    info,
    ['C02', 'C03', 'C04', 'C05', 'C06'],
    'yesterday-overlap-v1',
    '어제2개 확인→겹침 집중/해제→미래 이어가기/해제',
    '자동 이월 없음, id/due/created 보존, 요약과 기한 잔류 정확',
    async () => {
      expect(await stored(page)).toEqual(tasks)
      await expect(page.locator('.yesterday-note')).toContainText('2개')
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: '겹침 집중하기', exact: true })
        .click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: '겹침 집중 해제', exact: true })
        .click()
      await page.keyboard.press('Escape')
      await expect(
        page.getByText('집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', { exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: '기한 편집', exact: true })).toBeVisible()
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await page.getByRole('button', { name: '미래 집중하기', exact: true }).click()
      await page.keyboard.press('Escape')
      const chosen = (await stored(page)).find((t) => t.id === '미래')!
      expect(chosen).toMatchObject({ ...tasks[1], focusDate: day, updatedAt: expect.any(String) })
      await page.getByRole('button', { name: '미래 집중 해제', exact: true }).click()
      await expect(page.getByRole('button', { name: '미래 편집', exact: true })).toHaveCount(0)
      await expect(page.getByRole('region', { name: '오늘 집중 요약' })).toContainText(
        '0개 · 기한으로 표시된 1개',
      )
      await all(page)
      await expect(page.getByRole('button', { name: '미래 편집', exact: true })).toBeVisible()
      expect(await stored(page)).toHaveLength(4)
    },
  )
})
test('P08 많은 일: 50→검색/후보→오늘, 후보 없음 복구', async ({ page }, info) => {
  const tasks = Array.from({ length: 50 }, (_, i) =>
    make(`업무-${i}`, {
      priority: i === 49 ? 'high' : 'none',
      category: i === 49 ? '찾을분류' : null,
    }),
  )
  await seed(page, tasks)
  await page.goto('./')
  await check(
    page,
    info,
    ['C01', 'C08', 'C09', 'C10'],
    '50-task fixture; 200-task regression separately',
    '오늘 검색 중 계획 열기/선택/닫기→검색 해제→전체 분류 검색/없음',
    '계획은 검색과 독립, 오늘/전체 검색 범위/숫자 표시; 데이터 안 사라짐',
    async () => {
      await page.getByLabel('제목·분류 검색').fill('불일치')
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await expect(page.locator('.plan-row')).toHaveCount(1)
      await page.getByRole('button', { name: '업무-49 집중하기', exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(page.getByLabel('제목·분류 검색')).toHaveValue('불일치')
      await expect(page.getByRole('heading', { name: '일치하는 할 일이 없습니다' })).toBeVisible()
      await page.getByRole('button', { name: '검색 지우기', exact: true }).first().click()
      await expect(page.locator('.task-row')).toHaveCount(1)
      await all(page)
      await page.getByLabel('제목·분류 검색').fill('찾을분류')
      await expect(page.locator('.task-row')).toHaveCount(1)
      await page.getByLabel('제목·분류 검색').fill('없음')
      await expect(page.locator('.search-results')).toContainText('검색 결과 0개')
      await page.getByRole('button', { name: '검색 지우기', exact: true }).first().click()
      await expect(page.locator('.task-row')).toHaveCount(50)
    },
  )
})
test('P09 실수 복구: 삭제 취소→완료/편집→예시 재추가/제거', async ({ page }, info) => {
  await page.goto('./')
  await page.getByLabel('새 할 일 제목').fill('원본 사용자')
  await page.keyboard.press('Enter')
  await check(
    page,
    info,
    ['D03', 'D05', 'D06'],
    'UI user task mixed with optional demos',
    '삭제/undo→완료→다른 제목 편집→undo→예시 재추가/제거',
    '삭제 전체 복원, 완료 undo 다른 속성 유지, 예시 중복/사용자 보존',
    async () => {
      const before = await stored(page)
      await page.locator('.task-body').click()
      await page.getByRole('button', { name: '삭제', exact: true }).click()
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      expect(await stored(page)).toEqual(before)
      await page.getByRole('checkbox', { name: '원본 사용자 완료', exact: true }).click()
      await all(page)
      await page.getByText('완료된 할 일', { exact: false }).last().click()
      await page.getByRole('button', { name: '원본 사용자 편집', exact: true }).click()
      await page.getByLabel('제목', { exact: true }).fill('수정 보존')
      await page.getByRole('button', { name: '저장', exact: true }).click()
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      expect((await stored(page))[0]).toMatchObject({
        title: '수정 보존',
        completedAt: null,
        id: before[0].id,
      })
      const menu = page.locator('.sidebar .app-menu')
      await menu.locator('summary').click()
      await menu.getByRole('button', { name: '예시로 둘러보기', exact: true }).click()
      expect(await stored(page)).toHaveLength(6)
      await menu.getByRole('button', { name: '예시로 둘러보기', exact: true }).click()
      await expect(page.getByText('예시가 이미 추가되어 있습니다.', { exact: true })).toBeVisible()
      await menu.getByRole('button', { name: '예시 데이터 제거', exact: true }).click()
      expect(await stored(page)).toHaveLength(1)
      expect((await stored(page))[0].isDemo).toBe(false)
    },
  )
})
test('P10 보존: 다운로드→빈 context 복원→재백업→교체 취소', async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.goto('./')
  await page.getByLabel('새 할 일 제목').fill('한글 English 😀')
  await page.keyboard.press('Enter')
  await page.locator('.task-body').click()
  await page.getByLabel('기한', { exact: true }).fill('2026-10-03')
  await page.getByLabel('분류 선택').fill('자료')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await manage(page)
  await check(
    page,
    info,
    ['E01', 'E02', 'E05'],
    'UI-created complete wrapper; separate empty context',
    '실제 다운로드→빈 환경 파일 UI 합치기→재백업 비교→교체 전 백업/취소',
    '전체 task 필드 round trip 일치, 확인/취소 원본 불변',
    async () => {
      const before = await stored(page)
      const first = await exported(page)
      expect(first.data.tasks).toEqual(before)
      const context = await browser.newContext({ timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
      const other = await context.newPage()
      try {
        await other.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
        await other.goto(baseURL!)
        await manage(other)
        await other.locator('#backup-file').setInputFiles({
          name: 'roundtrip.json',
          mimeType: 'application/json',
          buffer: Buffer.from(first.text),
        })
        await other.getByRole('button', { name: '합치기 적용', exact: true }).click()
        expect(await stored(other)).toEqual(before)
        const second = await exported(other)
        expect(second.data).toEqual(first.data)
      } finally {
        await context.close()
      }
      await page.locator('#backup-file').setInputFiles(incoming([]))
      await page.getByLabel('백업으로 전체 교체').check()
      await page.getByRole('button', { name: '전체 교체 확인으로 이동' }).click()
      expect((await exported(page)).data.tasks).toEqual(before)
      await page.getByRole('button', { name: '교체 취소', exact: true }).click()
      expect(await stored(page)).toEqual(before)
    },
  )
})
test('P11 시각/확대: 200% reflow 동등 조건→reduced motion→오류 복구', async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 720, height: 450 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  })
  const page = await context.newPage()
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
  await page.goto(baseURL!)
  try {
    await check(
      page,
      info,
      ['F06', 'A06'],
      '720x450 CSS / scale2: 1440x900 at 200% equivalent reflow; not native browser zoom',
      '축소 layout에서 빈 오류→입력→편집 focus/이름/텍스트 상태→취소',
      '가로 넘침 없음, 오류 연결과 focus ring, motion 제거, 상태 텍스트 존재',
      async () => {
        const input = page.getByLabel('새 할 일 제목')
        await input.fill(' ')
        await page.keyboard.press('Enter')
        await expect(input).toHaveAttribute('aria-describedby', 'quick-error')
        await expect(page.getByRole('alert')).toBeVisible()
        await input.fill('확대 확인')
        await page.keyboard.press('Enter')
        await expect(page.getByText('오늘 집중', { exact: true })).toBeVisible()
        await page.locator('.task-body').focus()
        expect(
          await page.locator('.task-body').evaluate((el) => getComputedStyle(el).outlineStyle),
        ).toBe('solid')
        await page.keyboard.press('Enter')
        await expect(page.getByLabel('제목', { exact: true })).toBeFocused()
        await page.getByLabel('제목', { exact: true }).fill('')
        await page.getByRole('button', { name: '저장', exact: true }).click()
        await expect(page.getByLabel('제목', { exact: true })).toHaveAttribute(
          'aria-describedby',
          'edit-error',
        )
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        expect(
          await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
        ).toBe(true)
        expect(
          await page
            .getByRole('dialog')
            .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration)),
        ).toBe(0)
        await page.screenshot({ path: `${shotDir}/P11-reflow.png` })
        await page.keyboard.press('Escape')
        expect((await stored(page))[0].title).toBe('확대 확인')
      },
    )
  } finally {
    await context.close()
  }
})
test('P12 경계 입력: 공백·조합→편집 조합 Enter→검색', async ({ page }, info) => {
  await page.goto('./')
  await check(
    page,
    info,
    ['A07', 'A10', 'A11'],
    'UI Korean/English/emoji title; composition events, not OS IME',
    '앞뒤 공백 제목, quick 조합 Enter, 완료 후 제출, 입력 N / Escape와 검색 Enter',
    'trim/내부 문자 보존, 조합 중 생성0, 검색 Enter 생성 없음',
    async () => {
      const input = page.getByLabel('새 할 일 제목')
      await input.fill('  한글 English 😀 / N  ')
      await input.dispatchEvent('compositionstart')
      await page.keyboard.press('Enter')
      expect(await stored(page)).toHaveLength(0)
      await input.dispatchEvent('compositionend')
      await page.clock.runFor(100)
      await page.keyboard.press('Enter')
      expect((await stored(page))[0].title).toBe('한글 English 😀 / N')
      await input.fill('N /')
      await page.keyboard.press('Escape')
      await expect(input).toBeFocused()
      await page.getByLabel('제목·분류 검색').fill('English 😀')
      await page.keyboard.press('Enter')
      expect(await stored(page)).toHaveLength(1)
      await page.getByLabel('제목·분류 검색').fill('')
    },
  )
  await check(
    page,
    info,
    ['B05'],
    'one UI task, category composition event + actual Enter',
    '상세 분류에서 한글 조합 중 Enter',
    '편집 유지, 저장 원본 무변경; 조합 확정 Enter가 저장 아님',
    async () => {
      const before = await stored(page)
      await page.locator('.task-body').click()
      const category = page.getByLabel('분류 선택')
      await category.fill('조합 초안')
      await page.screenshot({ path: `${shotDir}/P12-composition-draft.png` })
      await category.dispatchEvent('compositionstart')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog', { name: '할 일 편집' })).toBeVisible()
      expect(await stored(page)).toEqual(before)
      await category.dispatchEvent('compositionend')
      await page.clock.runFor(100)
      await page.keyboard.press('Escape')
    },
  )
})
