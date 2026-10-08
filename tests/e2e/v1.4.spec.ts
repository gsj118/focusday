import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createTask, type Task } from '../../src/domain'
import { defaultPreferences, UI_STORAGE_KEY, type UIPreferences } from '../../src/preferences'
import { dailySentence, ORIGINAL_GUIDANCE } from '../../src/encouragement'
import { createBackup } from '../../src/backup'

const day = '2026-10-08'
const stamp = '2026-10-08T01:00:00.000Z'
const phase = process.env.V14_PHASE || 'final'
const shots = process.env.V14_SHOTS || `docs/screenshots/v1.4/beta-${phase}`
const observations = new Map<string, Record<string, unknown>[]>()
test.use({ actionTimeout: 5000 })
const make = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', day, stamp, id),
  ...extra,
})
const tasks = (page: Page): Promise<Task[]> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1') || '{"tasks":[]}').tasks)
const prefs = (page: Page): Promise<UIPreferences | null> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), UI_STORAGE_KEY)
const summary = (page: Page) => page.locator('.achievements-section > summary')
const sentence = (page: Page) => page.locator('.daily-sentence')
const cheer = (page: Page) => page.locator('.encouragement')
const menu = (page: Page) =>
  page.locator(page.viewportSize()!.width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
async function seed(page: Page, list: Task[], ui?: unknown) {
  await page.addInitScript(
    ({ list, ui, key }) => {
      if (localStorage.getItem('focusday:v1') === null)
        localStorage.setItem('focusday:v1', JSON.stringify({ version: 1, tasks: list }))
      if (ui !== undefined && localStorage.getItem(key) === null)
        localStorage.setItem(key, typeof ui === 'string' ? ui : JSON.stringify(ui))
    },
    { list, ui, key: UI_STORAGE_KEY },
  )
}
async function nav(page: Page, view: '오늘' | '전체') {
  await page
    .getByRole('navigation', {
      name: page.viewportSize()!.width < 900 ? '모바일 보기' : '할 일 보기',
      exact: true,
    })
    .getByRole('button', { name: new RegExp(view) })
    .click()
}
async function open(page: Page, name = '문구와 격려 설정') {
  await menu(page).locator('summary').click()
  await menu(page).getByRole('button', { name, exact: true }).click()
}
async function add(page: Page, title: string) {
  await page.getByLabel('새 할 일 제목').fill(title)
  await page.getByLabel('새 할 일 제목').press('Enter')
}
async function complete(page: Page, title: string) {
  await page.getByRole('checkbox', { name: `${title} 완료`, exact: true }).click()
}
async function saveSettings(page: Page) {
  await page
    .locator('.editor-footer')
    .getByRole('button', { name: /설정 저장/ })
    .click()
  await expect(page.getByRole('status').filter({ hasText: '설정을 저장했습니다.' })).toBeVisible()
  await page.keyboard.press('Escape')
}
async function upload(page: Page, list: Task[]) {
  await page.locator('#backup-file').setInputFiles({
    name: 'v1-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks: list }, stamp))),
  })
  await expect(page.getByRole('heading', { name: '복원 미리보기', exact: true })).toBeVisible()
}
async function check(
  page: Page,
  info: TestInfo,
  id: string,
  expected: string,
  action: () => Promise<void>,
) {
  const record: Record<string, unknown> = {
    caseId: id,
    persona: info.title.slice(0, 3),
    expected,
    phase,
    checkedAt: new Date().toISOString(),
    steps: id,
  }
  const list = observations.get(info.title) || []
  list.push(record)
  observations.set(info.title, list)
  try {
    await test.step(id, action)
    record.status = 'PASS'
  } catch (error) {
    record.status = 'FAIL'
    record.error = String(error)
    throw error
  } finally {
    record.actual = await page
      .evaluate(() => ({
        sentence: document.querySelector('.daily-sentence')?.textContent || null,
        achievements:
          document.querySelector('.achievements-section > summary')?.textContent || null,
        toast: document.querySelector('.undo-toast')?.textContent || null,
        focus:
          document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName,
        taskRaw: localStorage.getItem('focusday:v1'),
        uiRaw: localStorage.getItem('focusday:ui:v1'),
        clock: new Date().toISOString(),
        viewport: { width: innerWidth, height: innerHeight },
      }))
      .catch(() => ({
        status: 'INCONCLUSIVE',
        reason:
          'Browser closed after test failure; retained trace/screenshot contains last UI state.',
      }))
    const path = `${shots}/${id}-${record.status}.png`
    if (!page.isClosed()) {
      await page.screenshot({ path }).catch(() => undefined)
      record.screenshot = path
    }
    await info.attach('v1.4-case', {
      body: Buffer.from(JSON.stringify(record)),
      contentType: 'application/json',
    })
  }
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(stamp) })
})
test.afterEach(async ({ page }, info) => {
  void page
  observations.delete(info.title)
})

test('P01 처음 사용: 빈 화면→입력→계획→완료 복구→설정·백업→재방문', async ({ page }, info) => {
  await page.goto('./')
  await check(
    page,
    info,
    'P01-01',
    '읽기만 수행, 기본 차분한 문구, 접힌 0개/빈 상태, 첫 입력 포커스',
    async () => {
      expect(await page.evaluate(() => localStorage.length)).toBe(0)
      await expect(sentence(page)).toHaveText(dailySentence(day, 'calm'))
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      expect(await page.locator('.achievements-section').getAttribute('open')).toBeNull()
      await summary(page).click()
      await expect(page.getByText('오늘 마친 일이 여기에 모입니다.')).toBeVisible()
      await add(page, '첫 번째 할 일')
      await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await page.keyboard.press('Escape')
    },
  )
  await check(
    page,
    info,
    'P01-02',
    '첫 완료 통합 toast/1개, undo 0개, 재완료 일반 안내',
    async () => {
      await complete(page, '첫 번째 할 일')
      await expect(cheer(page)).toContainText('첫 한 가지')
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      await complete(page, '첫 번째 할 일')
      await expect(cheer(page)).toHaveCount(0)
    },
  )
  await check(page, info, 'P01-03', '설정 저장·백업 제외 경계·재방문 유지', async () => {
    await open(page)
    await page.getByRole('radio', { name: '유머', exact: true }).check()
    await saveSettings(page)
    await open(page, '백업·복원')
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
    const download = await pending
    const text = await readFile((await download.path())!, 'utf8')
    const backup = JSON.parse(text)
    expect(backup).toEqual({
      format: 'focusday-backup',
      formatVersion: 1,
      exportedAt: expect.any(String),
      data: { version: 1, tasks: await tasks(page) },
    })
    expect(text).toBe(JSON.stringify(backup))
    await download.delete()
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
    await expect(summary(page)).toHaveText('오늘 마친 일 1개')
    await expect(cheer(page)).toHaveCount(0)
  })
})

test('P02 키보드: Enter·Tab·Escape→설정 trap→성취 복원 초점→백업', async ({ page }, info) => {
  await page.goto('./')
  await check(
    page,
    info,
    'P02-01',
    '키보드 입력/설정 초안 취소, textarea 포함 trap, 메뉴로 초점 복귀',
    async () => {
      await page.getByLabel('새 할 일 제목').focus()
      await page.keyboard.type('Keyboard task')
      await page.keyboard.press('Enter')
      await menu(page).locator('summary').focus()
      await page.keyboard.press('Enter')
      await menu(page).getByRole('button', { name: '문구와 격려 설정', exact: true }).focus()
      await page.keyboard.press('Enter')
      const close = page.getByRole('button', { name: '문구와 격려 설정 닫기', exact: true })
      await expect(close).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(page.getByRole('button', { name: '설정 저장', exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(close).toBeFocused()
      await page.getByRole('radio', { name: '내 문장', exact: true }).focus()
      await page.keyboard.press('Space')
      await page.getByLabel('내 문장 입력').focus()
      await page.keyboard.type('draft')
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('내 문장 입력')).toHaveValue('draft\n')
      await page.keyboard.press('Escape')
      await expect(menu(page).locator('summary')).toBeFocused()
      expect(await prefs(page)).toBeNull()
    },
  )
  await check(
    page,
    info,
    'P02-02',
    '성취에서 유일한 완료 행 복원 후 summary 초점, 닫기/백업 초점',
    async () => {
      const box = page.getByRole('checkbox', { name: 'Keyboard task 완료', exact: true })
      await box.focus()
      await page.keyboard.press('Space')
      await summary(page).focus()
      await page.keyboard.press('Enter')
      await page.getByRole('checkbox', { name: 'Keyboard task 미완료로 복원', exact: true }).focus()
      await page.keyboard.press('Space')
      await expect(summary(page)).toBeFocused()
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      await expect(cheer(page)).toHaveCount(0)
      await open(page, '백업·복원')
      await page.keyboard.press('Escape')
      await expect(menu(page).locator('summary')).toBeFocused()
      await page.reload()
      expect((await tasks(page))[0].completedAt).toBeNull()
    },
  )
})

test('P03 한글 입력: 합성 조합→연속 입력·편집→내 문장 경계·HTML→재방문', async ({ page }, info) => {
  await page.goto('./')
  await check(page, info, 'P03-01', 'composition Enter 무제출, 제목/분류 편집 보존', async () => {
    const input = page.getByLabel('새 할 일 제목')
    await input.fill('조합 중')
    await input.dispatchEvent('compositionstart')
    await input.press('Enter')
    expect(await tasks(page)).toEqual([])
    await input.dispatchEvent('compositionend')
    await page.clock.runFor(100)
    await input.press('Enter')
    await add(page, '다음 입력')
    await page.getByRole('button', { name: '조합 중 편집', exact: true }).click()
    await page.getByLabel('분류 선택').fill('한글 분류')
    await page.getByLabel('분류 선택').dispatchEvent('compositionstart')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('분류 선택').dispatchEvent('compositionend')
    await page.clock.runFor(100)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    expect((await tasks(page))[0].category).toBe('한글 분류')
  })
  await check(
    page,
    info,
    'P03-02',
    '내 문장 0/121 오류, 120 허용, 조합 무저장, HTML plain text',
    async () => {
      await open(page)
      await page.getByRole('radio', { name: '내 문장', exact: true }).check()
      await page.getByLabel('내 문장 입력').fill('   ')
      await page.getByRole('button', { name: '설정 저장', exact: true }).click()
      await expect(page.getByRole('alert').filter({ hasText: '1–120' })).toBeVisible()
      await page.getByLabel('내 문장 입력').fill('가'.repeat(121))
      await page
        .locator('.editor-footer')
        .getByRole('button', { name: /설정 저장/ })
        .click()
      await expect(page.getByRole('alert').filter({ hasText: '121자' })).toBeVisible()
      await page.getByLabel('내 문장 입력').fill('가'.repeat(120))
      await saveSettings(page)
      await expect(sentence(page)).toHaveText('가'.repeat(120))
      await open(page)
      await page.getByLabel('내 문장 입력').fill('  <img src=x onerror=alert(1)> 내 문장  ')
      await page.getByLabel('내 문장 입력').dispatchEvent('compositionstart')
      await page.keyboard.press('Enter')
      expect((await prefs(page))?.customSentence).toBe('가'.repeat(120))
      await page.getByLabel('내 문장 입력').dispatchEvent('compositionend')
      await page.clock.runFor(100)
      await saveSettings(page)
      await page.reload()
      await expect(sentence(page)).toHaveText('<img src=x onerror=alert(1)> 내 문장')
      await expect(sentence(page).locator('img')).toHaveCount(0)
    },
  )
})

test('P04 모바일 터치390: 입력→계획→설정→완료·undo→sheet 백업→재방문', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
  })
  const page = await context.newPage()
  await page.clock.install({ time: new Date(stamp) })
  await page.goto('./')
  await check(page, info, 'P04-01', '390px 조작·설정 sheet/footer44px·취소 초점', async () => {
    await add(page, '모바일 장보기')
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    await page.keyboard.press('Escape')
    await open(page)
    for (const control of ['설정 저장', '취소', '문구와 격려 설정 닫기']) {
      const box = await page.getByRole('button', { name: control, exact: true }).boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.getByRole('radio', { name: '유머', exact: true }).check()
    await saveSettings(page)
  })
  await check(page, info, 'P04-02', '모바일 toast/nav 분리, undo 대상과 백업·재방문', async () => {
    await page.getByRole('checkbox', { name: '모바일 장보기 완료', exact: true }).tap()
    const toast = await page.locator('.undo-toast').boundingBox()
    const navBox = await page.locator('.mobile-nav').boundingBox()
    expect(toast!.y + toast!.height).toBeLessThanOrEqual(navBox!.y)
    await expect(cheer(page)).toContainText('첫 체크')
    await page.getByRole('button', { name: '실행 취소', exact: true }).tap()
    await open(page, '백업·복원')
    await expect(
      page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
    await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  })
  await context.close()
})

test('P05 작은 화면320: 긴 정보→작은 높이 설정→성취→백업·재방문', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./')
  const title = '긴한글제목EnglishWithoutSpaces'.repeat(8).slice(0, 200)
  await check(
    page,
    info,
    'P05-01',
    '200자 제목/24자 분류/120자 문장 wrapping, 작은 높이 저장 접근',
    async () => {
      await add(page, title)
      await page.getByRole('button', { name: `${title} 편집`, exact: true }).click()
      await page.getByLabel('분류 선택').fill('abcdefghijklmnopqrstuvwx')
      await page.getByLabel('기한', { exact: true }).fill('2026-10-10')
      await page.getByRole('button', { name: '저장', exact: true }).click()
      await open(page)
      await page.getByRole('radio', { name: '내 문장', exact: true }).check()
      await page
        .getByLabel('내 문장 입력')
        .fill('긴한글EnglishWithoutSpaces'.repeat(8).slice(0, 120))
      await page.setViewportSize({ width: 320, height: 400 })
      const save = await page.getByRole('button', { name: '설정 저장', exact: true }).boundingBox()
      expect(save!.y + save!.height).toBeLessThanOrEqual(400)
      await saveSettings(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
    },
  )
  await check(
    page,
    info,
    'P05-02',
    '긴 성취 제목/시각/속성 보존, 320px 복원 panel, 재방문',
    async () => {
      await page.setViewportSize({ width: 320, height: 568 })
      await complete(page, title)
      await summary(page).click()
      await expect(page.locator('.achievements-section time')).toHaveCount(1)
      await expect(page.locator('.achievements-section .category')).toHaveText(
        'abcdefghijklmnopqrstuvwx',
      )
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await open(page, '백업·복원')
      await upload(page, await tasks(page))
      await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
      await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
      await page.reload()
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
    },
  )
})

test('P06 쌓인 일: 80개→검색·계획·정렬→검색 중 완료→성취·백업', async ({ page }, info) => {
  const list = Array.from({ length: 80 }, (_, i) =>
    make(`쌓인 일 ${i}`, {
      priority: i === 50 ? 'high' : 'none',
      category: i === 50 ? '찾기' : null,
      focusDate: i < 5 ? day : null,
    }),
  )
  await seed(page, list)
  await page.goto('./')
  await check(
    page,
    info,
    'P06-01',
    '검색은 후보/전체 데이터/오늘 성취 수에 영향 없음',
    async () => {
      await page.getByLabel('제목·분류 검색').fill('찾기')
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await page.getByRole('button', { name: '쌓인 일 50 집중하기', exact: true }).click()
      await page.keyboard.press('Escape')
      await complete(page, '쌓인 일 50')
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      expect((await tasks(page)).length).toBe(80)
      await page.getByLabel('제목·분류 검색').fill('없는 검색')
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      await summary(page).click()
      await expect(
        page.getByRole('checkbox', { name: '쌓인 일 50 미완료로 복원', exact: true }),
      ).toBeVisible()
    },
  )
  await check(
    page,
    info,
    'P06-02',
    '전체 완료/예시 제외·최근 완료 정렬·미리보기 데이터 보존',
    async () => {
      await page.getByLabel('제목·분류 검색').fill('')
      await nav(page, '전체')
      await complete(page, '쌓인 일 79')
      await nav(page, '오늘')
      await expect(summary(page)).toHaveText('오늘 마친 일 2개')
      await open(page, '백업·복원')
      await upload(page, await tasks(page))
      await expect(page.locator('.merge-summary')).toContainText('추가 0개 · 중복 id 유지 80개')
      await page.keyboard.press('Escape')
      await page.reload()
      expect((await tasks(page)).length).toBe(80)
      await expect(summary(page)).toHaveText('오늘 마친 일 2개')
    },
  )
})

test('P07 계획 변경: 어제 이어가기→미래 기한·잔류→완료→설정 취소·재방문', async ({
  page,
}, info) => {
  await seed(page, [
    make('어제 글쓰기', { focusDate: '2026-10-07', dueDate: '2026-10-10' }),
    make('오늘 납부', { dueDate: day, focusDate: day }),
  ])
  await page.goto('./')
  await check(
    page,
    info,
    'P07-01',
    '이어가기 id/기한 유지, 집중 재선택·기한 잔류 유지',
    async () => {
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await page.getByRole('button', { name: '어제 글쓰기 집중하기', exact: true }).click()
      await page.keyboard.press('Escape')
      expect((await tasks(page))[0]).toMatchObject({
        id: '어제 글쓰기',
        focusDate: day,
        dueDate: '2026-10-10',
      })
      await page.getByRole('button', { name: '어제 글쓰기 집중 해제', exact: true }).click()
      await page.getByRole('button', { name: '오늘 납부 집중 해제', exact: true }).click()
      await expect(
        page.getByText('집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', { exact: true }),
      ).toBeVisible()
      await complete(page, '오늘 납부')
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
    },
  )
  await check(
    page,
    info,
    'P07-02',
    '전체에서 미래 일 완료도 성취, 설정 취소 유지·백업·재방문',
    async () => {
      await nav(page, '전체')
      await complete(page, '어제 글쓰기')
      await nav(page, '오늘')
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      await expect(cheer(page)).toHaveCount(0)
      await open(page)
      await page.getByRole('radio', { name: '끄기', exact: true }).check()
      await page.getByRole('button', { name: '취소', exact: true }).click()
      await expect(sentence(page)).toHaveText(dailySentence(day, 'calm'))
      await open(page, '백업·복원')
      await upload(page, await tasks(page))
      await page.keyboard.press('Escape')
      await page.reload()
      expect((await tasks(page))[0].dueDate).toBe('2026-10-10')
    },
  )
})

test('P08 실수 복구: 완료·빠른 연속→undo·재완료→삭제·복원→새로고침', async ({ page }, info) => {
  await seed(
    page,
    [1, 2, 3, 4].map((i) => make(`실수 ${i}`, { focusDate: day })),
  )
  await page.goto('./')
  await check(
    page,
    info,
    'P08-01',
    '0→1/1→2/2→3/3→4 표시 조건, 최신 undo, stale cheer 제거',
    async () => {
      for (const [i, shouldCheer] of [
        [1, true],
        [2, false],
        [3, true],
        [4, false],
      ] as const) {
        await complete(page, `실수 ${i}`)
        await expect(summary(page)).toHaveText(`오늘 마친 일 ${i}개`)
        await expect(cheer(page)).toHaveCount(shouldCheer ? 1 : 0)
      }
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      expect((await tasks(page)).find((t) => t.title === '실수 4')?.completedAt).toBeNull()
      await complete(page, '실수 4')
      await expect(cheer(page)).toHaveCount(0)
      await summary(page).click()
      await page.getByRole('checkbox', { name: '실수 3 미완료로 복원', exact: true }).click()
      await expect(cheer(page)).toHaveCount(0)
      await complete(page, '실수 3')
      await expect(cheer(page)).toHaveCount(0)
    },
  )
  await check(
    page,
    info,
    'P08-02',
    '오늘 완료 삭제→undo 집계 회복만, 새로고침 후 중복 억제',
    async () => {
      await page.getByRole('button', { name: '실수 1 편집', exact: true }).click()
      await page.getByRole('button', { name: '삭제', exact: true }).click()
      await expect(summary(page)).toHaveText('오늘 마친 일 3개')
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      await expect(summary(page)).toHaveText('오늘 마친 일 4개')
      await expect(cheer(page)).toHaveCount(0)
      await page.reload()
      await summary(page).click()
      for (const i of [1, 2, 3, 4])
        await page.getByRole('checkbox', { name: `실수 ${i} 미완료로 복원`, exact: true }).click()
      await complete(page, '실수 1')
      await expect(cheer(page)).toHaveCount(0)
      expect((await prefs(page))?.processed[day]).toEqual([1, 3])
    },
  )
})

test('P09 격려 선호: 문구 왕복→완료→refresh/reopen·offline→자정·재방문', async ({
  page,
  context,
}, info) => {
  await page.goto('./')
  await check(
    page,
    info,
    'P09-01',
    '같은 날짜 모드 왕복·refresh/reopen 동일, 유머 첫/3개',
    async () => {
      const calm = await sentence(page).textContent()
      await open(page)
      await page.getByRole('radio', { name: '유머', exact: true }).check()
      await saveSettings(page)
      const humor = await sentence(page).textContent()
      await open(page)
      await page.getByRole('radio', { name: '차분한 문구', exact: true }).check()
      await saveSettings(page)
      await expect(sentence(page)).toHaveText(calm!)
      await open(page)
      await page.getByRole('radio', { name: '유머', exact: true }).check()
      await saveSettings(page)
      await expect(sentence(page)).toHaveText(humor!)
      for (const i of [1, 2, 3]) {
        await add(page, `격려 ${i}`)
        await complete(page, `격려 ${i}`)
      }
      await expect(cheer(page)).toContainText('체크 세 칸')
      await page.reload()
      await expect(cheer(page)).toHaveCount(0)
      await expect(sentence(page)).toHaveText(humor!)
      const revisit = await context.newPage()
      await revisit.clock.install({ time: new Date(stamp) })
      await revisit.goto('./')
      await expect(sentence(revisit)).toHaveText(humor!)
      await expect(summary(revisit)).toHaveText('오늘 마친 일 3개')
      await revisit.close()
    },
  )
  await check(
    page,
    info,
    'P09-02',
    '네트워크 없는 열린 앱 문구·자정 갱신·둘째 날짜 첫 격려, suspend focus 갱신',
    async () => {
      await context.setOffline(true)
      await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
      await page.clock.setSystemTime(new Date('2026-10-08T23:59:59+09:00'))
      await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await page.clock.runFor(1100)
      await expect(sentence(page)).toHaveText(dailySentence('2026-10-09', 'humor'))
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      await add(page, '둘째 날짜')
      await complete(page, '둘째 날짜')
      await expect(cheer(page)).toContainText('첫 체크')
      await page.clock.setSystemTime(new Date('2026-10-10T10:00:00+09:00'))
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'))
        window.dispatchEvent(new Event('focus'))
      })
      await expect(sentence(page)).toHaveText(dailySentence('2026-10-10', 'humor'))
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      await expect(cheer(page)).toHaveCount(0)
      await context.setOffline(false)
    },
  )
})

test('P10 조용한 화면: 독립 끄기→완료 시점 처리→켜기·재완료→설정 취소·재방문', async ({
  page,
}, info) => {
  await page.goto('./')
  await check(page, info, 'P10-01', '문구/격려 독립, 꺼진 동안 첫/3개도 처리', async () => {
    await open(page)
    await page.getByRole('radio', { name: '끄기', exact: true }).check()
    await page.getByRole('checkbox', { name: '완료 순간의 격려', exact: true }).uncheck()
    await saveSettings(page)
    await expect(sentence(page)).toHaveText(ORIGINAL_GUIDANCE)
    for (const i of [1, 2, 3]) {
      await add(page, `조용한 일 ${i}`)
      await complete(page, `조용한 일 ${i}`)
      await expect(cheer(page)).toHaveCount(0)
    }
    expect((await prefs(page))?.processed[day]).toEqual([1, 3])
    await open(page)
    await page.getByRole('checkbox', { name: '완료 순간의 격려', exact: true }).check()
    await saveSettings(page)
    await summary(page).click()
    await page.getByRole('checkbox', { name: '조용한 일 3 미완료로 복원', exact: true }).click()
    await complete(page, '조용한 일 3')
    await expect(cheer(page)).toHaveCount(0)
  })
  await check(
    page,
    info,
    'P10-02',
    '취소/Escape 무저장, 문구off+격려on 새 날짜 차분한 격려',
    async () => {
      await open(page)
      await page.getByRole('radio', { name: '유머', exact: true }).check()
      await page.keyboard.press('Escape')
      await page.reload()
      await expect(sentence(page)).toHaveText(ORIGINAL_GUIDANCE)
      await page.clock.setSystemTime(new Date('2026-10-09T10:00:00+09:00'))
      await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await add(page, '조용한 둘째 날')
      await complete(page, '조용한 둘째 날')
      await expect(cheer(page)).toContainText('첫 한 가지')
      await expect(sentence(page)).toHaveText(ORIGINAL_GUIDANCE)
    },
  )
})

test('P11 확대·낮은 시력 관점: 200% 동등 reflow→긴 설정·오류 초점→성취 복구', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 720, height: 450 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await check(
    page,
    info,
    'P11-01',
    'reflow 무넘침, 설정 오류 자동 초점·scroll, 필수 footer 접근',
    async () => {
      await add(page, '작업 확인')
      await open(page)
      await page.getByRole('radio', { name: '내 문장', exact: true }).check()
      await page.getByLabel('내 문장 입력').fill('가'.repeat(121))
      await page.getByRole('button', { name: '설정 저장', exact: true }).click()
      const error = page.getByRole('alert').filter({ hasText: '121자' })
      await expect(error).toBeFocused()
      const box = await error.boundingBox()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(450)
      await page.getByLabel('내 문장 입력').fill('가'.repeat(120))
      await saveSettings(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const motion = await page
        .getByRole('button', { name: '오늘 계획하기', exact: true })
        .evaluate((el) => getComputedStyle(el).transitionDuration)
      expect(motion).toBe('0s')
    },
  )
  await check(
    page,
    info,
    'P11-02',
    '내 문장 모드 차분한 격려, 성취 복원 후 키보드 초점/접근·재방문',
    async () => {
      await complete(page, '작업 확인')
      await expect(cheer(page)).toContainText('첫 한 가지')
      await summary(page).click()
      await page.getByRole('checkbox', { name: '작업 확인 미완료로 복원', exact: true }).click()
      await expect(summary(page)).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(summary(page)).toBeFocused()
      await page.reload()
      await expect(sentence(page)).toHaveText('가'.repeat(120))
    },
  )
})

test('P12 보존: 설정/할 일 쓰기 실패→백업·실패 복원→재시도→정상 복원·재방문', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem
    Object.assign(window, { v14FailTask: false, v14FailUI: false })
    Storage.prototype.setItem = function (key, value) {
      const flags = window as unknown as { v14FailTask: boolean; v14FailUI: boolean }
      if (
        (key === 'focusday:v1' && flags.v14FailTask) ||
        (key === 'focusday:ui:v1' && flags.v14FailUI)
      )
        throw new Error('injected failure')
      return set.call(this, key, value)
    }
  })
  await seed(page, [make('보존할 일', { focusDate: day })])
  await page.goto('./')
  await check(
    page,
    info,
    'P12-01',
    '설정 저장 실패 초안/원본 유지·재시도, task 저장 상태 분리',
    async () => {
      await open(page)
      await page.getByRole('radio', { name: '유머', exact: true }).check()
      await page.evaluate(() => Object.assign(window, { v14FailUI: true }))
      await page.getByRole('button', { name: '설정 저장', exact: true }).click()
      await expect(page.getByRole('radio', { name: '유머', exact: true })).toBeChecked()
      await expect(sentence(page)).toHaveText(dailySentence(day, 'calm'))
      expect(await prefs(page)).toBeNull()
      expect((await tasks(page))[0].completedAt).toBeNull()
      await page.evaluate(() => Object.assign(window, { v14FailUI: false }))
      await saveSettings(page)
      await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
    },
  )
  await check(
    page,
    info,
    'P12-02',
    '격려 표시/task 저장 실패에도 메모리 완료·undo, 중복 없음·좁은 재시도',
    async () => {
      await page.evaluate(() => Object.assign(window, { v14FailUI: true, v14FailTask: true }))
      await complete(page, '보존할 일')
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      await expect(page.getByText('저장 실패', { exact: true })).toBeVisible()
      expect((await tasks(page))[0].completedAt).toBeNull()
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      await complete(page, '보존할 일')
      await expect(cheer(page)).toHaveCount(0)
      await page.evaluate(() => Object.assign(window, { v14FailUI: false, v14FailTask: false }))
      await page.getByRole('button', { name: '저장 재시도', exact: true }).click()
      await open(page)
      await page
        .locator('.storage-banner')
        .getByRole('button', { name: '설정 저장 재시도', exact: true })
        .click()
      expect((await prefs(page))?.processed[day]).toEqual([1])
      await page.keyboard.press('Escape')
    },
  )
  await check(
    page,
    info,
    'P12-03',
    '실패 복원은 원본/성취/UI유지, merge→2 이후 직접3은 후보, replace도 UI유지',
    async () => {
      const original = await tasks(page)
      const ui = await prefs(page)
      await open(page, '백업·복원')
      await upload(page, [make('가져온 완료', { completedAt: stamp })])
      await page.evaluate(() => Object.assign(window, { v14FailTask: true }))
      await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
      expect(await tasks(page)).toEqual(original)
      await expect(summary(page)).toHaveText('오늘 마친 일 1개')
      await expect(page.getByRole('alert').filter({ hasText: '복원 저장에 실패' })).toBeFocused()
      await page.evaluate(() => Object.assign(window, { v14FailTask: false }))
      await page.getByRole('button', { name: '합치기 다시 시도', exact: true }).click()
      await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
      await expect(summary(page)).toHaveText('오늘 마친 일 2개')
      await expect(cheer(page)).toHaveCount(0)
      expect(await prefs(page)).toEqual(ui)
      await add(page, '직접 세 번째')
      await complete(page, '직접 세 번째')
      await expect(cheer(page)).toContainText('체크 세 칸')
      const uiAfter = await prefs(page)
      await open(page, '백업·복원')
      await upload(page, [])
      await page.getByLabel('백업으로 전체 교체', { exact: true }).check()
      await page.getByRole('button', { name: '전체 교체 확인으로 이동', exact: true }).click()
      await page.getByRole('button', { name: '확인 후 전체 교체', exact: true }).click()
      await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
      await expect(summary(page)).toHaveText('오늘 마친 일 0개')
      expect(await prefs(page)).toEqual(uiAfter)
      await page.reload()
      expect(await tasks(page)).toEqual([])
      expect(await prefs(page)).toEqual(uiAfter)
    },
  )
})

for (const raw of ['{broken', JSON.stringify({ ...defaultPreferences(), version: 2 })]) {
  test(`B01 설정 보호·명시적 초기화: ${raw}`, async ({ page }) => {
    await seed(page, [make('보호된 할 일', { focusDate: day })], raw)
    await page.goto('./')
    const original = await tasks(page)
    await complete(page, '보호된 할 일')
    expect(await page.evaluate((key) => localStorage.getItem(key), UI_STORAGE_KEY)).toBe(raw)
    await page.getByRole('button', { name: '실행 취소', exact: true }).click()
    await open(page)
    await page.getByRole('button', { name: '설정 다시 읽기', exact: true }).click()
    expect(await page.evaluate((key) => localStorage.getItem(key), UI_STORAGE_KEY)).toBe(raw)
    await page.getByRole('button', { name: '설정만 초기화…', exact: true }).click()
    await page.getByRole('button', { name: '초기화 취소', exact: true }).click()
    expect(await page.evaluate((key) => localStorage.getItem(key), UI_STORAGE_KEY)).toBe(raw)
    await page.getByRole('button', { name: '설정만 초기화…', exact: true }).click()
    await page.getByRole('button', { name: '설정 원본 초기화 확인', exact: true }).click()
    expect((await prefs(page))?.processed[day]).toEqual([1])
    expect((await tasks(page))[0]).toMatchObject({
      id: original[0].id,
      title: original[0].title,
      completedAt: null,
    })
  })
}
for (const zone of ['Asia/Seoul', 'America/New_York']) {
  test(`B02 완료 timestamp 로컬 자정 경계·다른 시간대 ${zone}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: zone, locale: 'ko-KR' })
    const page = await context.newPage()
    const now = zone === 'Asia/Seoul' ? '2026-10-07T15:10:00.000Z' : '2026-10-09T03:10:00.000Z'
    await page.clock.install({ time: new Date(now) })
    await seed(page, [
      make('로컬 오늘', { completedAt: now }),
      make('어제 완료', {
        completedAt:
          zone === 'Asia/Seoul' ? '2026-10-07T14:59:59.000Z' : '2026-10-08T03:59:59.000Z',
      }),
      make('예시 완료', { completedAt: now, isDemo: true }),
      make('집중/기한 없는 일'),
    ])
    await page.goto('./')
    await expect(summary(page)).toHaveText('오늘 마친 일 1개')
    await expect(cheer(page)).toHaveCount(0)
    await nav(page, '전체')
    await complete(page, '집중/기한 없는 일')
    await nav(page, '오늘')
    await expect(summary(page)).toHaveText('오늘 마친 일 2개')
    await summary(page).click()
    await expect(page.locator('.achievements-section .task-row')).toHaveCount(2)
    await context.close()
  })
}

test('B03 초기/import/replace/예시 증가 무격려·새 직접 완료 경계', async ({ page }) => {
  await seed(page, [make('예시 할 일', { isDemo: true, focusDate: day })])
  await page.goto('./')
  await complete(page, '예시 할 일')
  await expect(cheer(page)).toHaveCount(0)
  await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  expect(await prefs(page)).toBeNull()
  await open(page, '백업·복원')
  await upload(page, [
    make('가져온 1', { completedAt: stamp }),
    make('가져온 2', { completedAt: stamp }),
  ])
  await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
  await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
  await expect(summary(page)).toHaveText('오늘 마친 일 2개')
  await expect(cheer(page)).toHaveCount(0)
  expect(await prefs(page)).toBeNull()
  await add(page, '가져온 뒤 직접 완료')
  await complete(page, '가져온 뒤 직접 완료')
  await expect(cheer(page)).toContainText('세 가지')
  expect((await prefs(page))?.processed[day]).toEqual([3])
})

test('B04 설정 읽기 실패 후 좁은 재시도는 기존 설정/세션 표시를 합치며 할 일을 유지', async ({
  page,
}) => {
  const existing = {
    ...defaultPreferences(),
    sentenceMode: 'humor',
    encouragementEnabled: false,
    processed: { '2026-10-07': [3] },
  }
  await seed(page, [make('읽기 보호', { focusDate: day })], existing)
  await page.addInitScript(() => {
    Object.assign(window, { v14ReadFail: true })
    const get = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      if (key === 'focusday:ui:v1' && (window as unknown as { v14ReadFail: boolean }).v14ReadFail)
        throw new Error('read denied')
      return get.call(this, key)
    }
  })
  await page.goto('./')
  await expect(sentence(page)).toHaveText(dailySentence(day, 'calm'))
  await complete(page, '읽기 보호')
  await page.evaluate(() => Object.assign(window, { v14ReadFail: false }))
  expect(await prefs(page)).toEqual(existing)
  const storedTasks = await tasks(page)
  await open(page)
  await page.getByRole('button', { name: '설정 다시 읽기', exact: true }).click()
  expect(await prefs(page)).toEqual({
    ...existing,
    processed: { ...existing.processed, [day]: [1] },
  })
  expect(await tasks(page)).toEqual(storedTasks)
  await page.keyboard.press('Escape')
  await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
})

test('B05 설정 초기화 쓰기 실패는 손상 원본과 할 일을 보호, 재시도 성공만 적용', async ({
  page,
}) => {
  await seed(page, [make('원본 할 일')], '{broken')
  await page.addInitScript(() => {
    Object.assign(window, { v14ResetFail: true })
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'focusday:ui:v1' && (window as unknown as { v14ResetFail: boolean }).v14ResetFail)
        throw new Error('write denied')
      return set.call(this, key, value)
    }
  })
  await page.goto('./')
  const original = await tasks(page)
  await open(page)
  await page.getByRole('button', { name: '설정만 초기화…', exact: true }).click()
  await page.getByRole('button', { name: '설정 원본 초기화 확인', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('focusday:ui:v1'))).toBe('{broken')
  expect(await tasks(page)).toEqual(original)
  await page.evaluate(() => Object.assign(window, { v14ResetFail: false }))
  await page.getByRole('button', { name: '설정 원본 초기화 확인', exact: true }).click()
  expect(await prefs(page)).toEqual(defaultPreferences())
  expect(await tasks(page)).toEqual(original)
})

test('B06 격려 표시 저장 실패는 세션 중복만 보장하며 새로고침 후 저장 상태에 의존', async ({
  page,
}) => {
  await seed(page, [make('표시 저장 실패', { focusDate: day })])
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'focusday:ui:v1') throw new Error('quota')
      return set.call(this, key, value)
    }
  })
  await page.goto('./')
  await complete(page, '표시 저장 실패')
  await expect(cheer(page)).toHaveCount(1)
  await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  await complete(page, '표시 저장 실패')
  await expect(cheer(page)).toHaveCount(0)
  await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  expect(await prefs(page)).toBeNull()
  await page.reload()
  await complete(page, '표시 저장 실패')
  await expect(cheer(page)).toHaveCount(1)
})

test('B07 검수 수정: 768px 전체폭 시트·재시도된 적용 설정과 미저장 초안 구별', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.addInitScript(() => {
    Object.assign(window, { v14RetryFail: true })
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'focusday:ui:v1' && (window as unknown as { v14RetryFail: boolean }).v14RetryFail)
        throw new Error('quota')
      return set.call(this, key, value)
    }
  })
  await page.goto('./')
  await open(page)
  const panelBox = await page.getByRole('dialog').boundingBox()
  expect(panelBox!.width).toBe(768)
  await page.getByRole('radio', { name: '유머', exact: true }).check()
  await page.getByRole('button', { name: '설정 저장', exact: true }).click()
  await page.evaluate(() => Object.assign(window, { v14RetryFail: false }))
  await page
    .locator('.storage-banner')
    .getByRole('button', { name: '설정 저장 재시도', exact: true })
    .click()
  await expect(page.locator('.panel-feedback')).toContainText('편집 중인 초안은 별도로')
  await expect(page.getByRole('radio', { name: '유머', exact: true })).toBeChecked()
  expect((await prefs(page))?.sentenceMode).toBe('calm')
  const feedbackBox = await page.locator('.panel-feedback').boundingBox()
  expect(feedbackBox!.y + feedbackBox!.height).toBeLessThanOrEqual(1024)
  await saveSettings(page)
  expect((await prefs(page))?.sentenceMode).toBe('humor')
})

test('B08 성취 행에 초점이 있을 때 날짜 변경으로 모두 사라져도 summary 복귀', async ({ page }) => {
  await seed(page, [make('날짜 변경 초점', { completedAt: stamp })])
  await page.goto('./')
  await summary(page).click()
  await page.getByRole('checkbox', { name: '날짜 변경 초점 미완료로 복원', exact: true }).focus()
  await page.clock.setSystemTime(new Date('2026-10-09T10:00:00+09:00'))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  await expect(summary(page)).toBeFocused()
})
