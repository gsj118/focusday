import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createBackup, MAX_BACKUP_BYTES } from '../../src/backup'
import { createTask, type AppData, type Task } from '../../src/domain'
import { STORAGE_KEY } from '../../src/storage'

declare global {
  interface Window {
    __restoreWrites?: number
    __revokedURLs?: number
  }
}
const today = '2026-10-02'
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', today, '2026-10-01T00:00:00.000Z', id),
  ...extra,
})
const data = (tasks: Task[]): AppData => ({ version: 1, tasks })
const file = (tasks: Task[]) => ({
  name: 'focusday-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(createBackup(data(tasks), '2026-10-02T00:00:00.000Z'))),
})
const rawData = (tasks: Task[]) => JSON.stringify(data(tasks))
async function seed(page: Page, raw: string, failRead = false) {
  await page.addInitScript(
    ({ raw, key, failRead }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, raw)
      const set = Storage.prototype.setItem,
        get = Storage.prototype.getItem
      window.__restoreWrites = 0
      window.__failWrite = false
      window.__failRead = failRead
      Storage.prototype.setItem = function (k, v) {
        if (k === key) {
          window.__restoreWrites!++
          if (window.__failWrite) throw new DOMException('quota', 'QuotaExceededError')
        }
        return set.call(this, k, v)
      }
      Storage.prototype.getItem = function (k) {
        if (k === key && window.__failRead) throw new DOMException('denied', 'SecurityError')
        return get.call(this, k)
      }
    },
    { raw, key: STORAGE_KEY, failRead },
  )
}
async function readTasks(page: Page): Promise<Task[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).tasks, STORAGE_KEY)
}
async function manage(page: Page) {
  const menu = page.locator(
    (page.viewportSize()?.width ?? 1440) < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu',
  )
  await menu.locator('summary').click()
  await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '백업·복원', exact: true })).toBeVisible()
}
async function download(page: Page) {
  const promise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  const downloaded = await promise
  expect(downloaded.suggestedFilename()).toBe('focusday-backup-2026-10-02.json')
  const content = JSON.parse(await readFile((await downloaded.path())!, 'utf8'))
  await downloaded.delete()
  return content
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
})

test('v1 데이터 그대로 로드·계획 그룹·사실 이유·중복 제외·집중 중·이어가기 id/기한 보존', async ({
  page,
}) => {
  const original = [
    task('기한 겹침', { dueDate: '2026-09-30', focusDate: '2026-10-01', priority: 'high' }),
    task('오늘 기한', { dueDate: today }),
    task('어제 일', { focusDate: '2026-10-01', dueDate: '2026-10-03' }),
    task('중요한 일', { priority: 'high', focusDate: today }),
    task('완료한 어제', { focusDate: '2026-10-01', completedAt: '2026-10-01T01:00:00.000Z' }),
    task('이틀 전', { focusDate: '2026-09-30' }),
  ]
  const raw = rawData(original)
  await seed(page, raw)
  await page.goto('./')
  await expect(page.getByText('어제 마치지 못한 일 2개', { exact: false })).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  const dialog = page.getByRole('dialog')
  expect(
    await dialog
      .locator('.plan-row')
      .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.taskId)),
  ).toEqual(['기한 겹침', '오늘 기한', '어제 일', '중요한 일'])
  await expect(dialog.locator('[data-task-id="기한 겹침"] .plan-reasons')).toContainText(
    '어제 선택한 일',
  )
  await expect(dialog.getByText('오늘 집중 · 집중 중', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  await dialog.getByRole('button', { name: '어제 일 집중하기', exact: true }).click()
  expect((await readTasks(page)).find((t) => t.id === '어제 일')).toMatchObject({
    ...original[2],
    focusDate: today,
    updatedAt: expect.any(String),
  })
  expect(await readTasks(page)).toHaveLength(original.length)
  await expect(page.locator('.yesterday-note')).toContainText('어제 마치지 못한 일 1개')
  await expect(dialog.getByRole('button', { name: '어제 일 집중하기', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '오늘 계획하기', exact: true })).toBeFocused()
  await expect(page.getByRole('button', { name: '어제 일 편집', exact: true })).toBeVisible()
})

test('요약 합계·집중 해제 기한 잔류·완료 후 즉시 일치', async ({ page }) => {
  await seed(
    page,
    rawData([
      task('둘 다', { focusDate: today, dueDate: today }),
      task('직접', { focusDate: today }),
      task('기한만', { dueDate: '2026-10-01' }),
      task('미래', { dueDate: '2026-10-03' }),
    ]),
  )
  await page.goto('./')
  const summary = page.getByRole('region', { name: '오늘 집중 요약' })
  await expect(summary).toContainText('직접 집중으로 고른 2개 · 기한으로 표시된 1개')
  await page.getByRole('button', { name: '둘 다 집중 해제', exact: true }).click()
  await expect(summary).toContainText('직접 집중으로 고른 1개 · 기한으로 표시된 2개')
  await expect(
    page.getByText('집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '기한 편집', exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '직접 완료', exact: true }).click()
  await expect(summary).toContainText('직접 집중으로 고른 0개 · 기한으로 표시된 2개')
  expect(await page.locator('.task-row').count()).toBe(2)
})

test('후보 없음·전체 경로·N 단축키 차단·Escape와 양방향 Tab 경계', async ({ page }) => {
  await seed(page, rawData([task('낮은 일', { priority: 'low' })]))
  await page.goto('./')
  await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '지금 살펴볼 계획 후보가 없습니다' }),
  ).toBeVisible()
  const close = page.getByRole('button', { name: '오늘 계획하기 닫기' })
  await expect(close).toBeFocused()
  await page.keyboard.press('n')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: '오늘 목록으로 돌아가기' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '전체 할 일 보기', exact: true })
    .first()
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '낮은 일 집중하기', exact: true })).toBeVisible()
})

test('열린 계획 패널의 자정·월말 어제 상태·자동 이월 없음', async ({ page }) => {
  await page.clock.setSystemTime(new Date('2026-10-31T23:59:59+09:00'))
  await seed(
    page,
    rawData([
      task('방금 선택', { focusDate: '2026-10-31' }),
      task('이전 어제', { focusDate: '2026-10-30' }),
    ]),
  )
  await page.goto('./')
  await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('이전 어제', { exact: true })).toBeVisible()
  await page.clock.runFor(2000)
  await expect(page.getByRole('dialog').getByText('방금 선택', { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog').getByText('이전 어제', { exact: true })).toHaveCount(0)
  expect((await readTasks(page)).map((t) => t.focusDate)).toEqual(['2026-10-31', '2026-10-30'])
  await page.keyboard.press('Escape')
  await expect(page.locator('.today-planning')).toContainText('어제 마치지 못한 일 1개')
})
for (const event of ['focus', 'visibilitychange'])
  test(`계획 ${event} 연말 갱신·이어가기`, async ({ page }) => {
    await page.clock.setSystemTime(new Date('2026-12-31T10:00:00+09:00'))
    await seed(page, rawData([task('연말', { focusDate: '2026-12-31', dueDate: '2027-01-03' })]))
    await page.goto('./')
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    await page.clock.setSystemTime(new Date('2027-01-01T10:00:00+09:00'))
    await page.evaluate(
      (event) => (event === 'focus' ? window : document).dispatchEvent(new Event(event)),
      event,
    )
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '연말 집중하기', exact: true })
      .click()
    expect((await readTasks(page))[0]).toMatchObject({
      id: '연말',
      focusDate: '2027-01-01',
      dueDate: '2027-01-03',
    })
  })

test('전체 JSON 백업 round trip·저장 쓰기 없음·Object URL 정리', async ({ page }) => {
  const tasks = [
    task('미완료', {
      priority: 'high',
      category: '업무',
      focusDate: '2026-10-01',
      dueDate: '2026-10-03',
    }),
    task('완료 예시', { completedAt: '2026-10-02T00:00:00.000Z', isDemo: true }),
  ]
  const raw = rawData(tasks)
  await seed(page, raw)
  await page.addInitScript(() => {
    const revoke = URL.revokeObjectURL
    window.__revokedURLs = 0
    URL.revokeObjectURL = (url) => {
      window.__revokedURLs!++
      revoke(url)
    }
  })
  await page.goto('./')
  await manage(page)
  const exported = await download(page)
  expect(exported).toMatchObject({ format: 'focusday-backup', formatVersion: 1, data: data(tasks) })
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  await page.clock.runFor(1100)
  expect(await page.evaluate(() => window.__revokedURLs)).toBe(1)
  await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles({
    name: 'round-trip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
  await expect(page.locator('.restore-preview')).toContainText(
    '백업 전체 2개 · 미완료 1개 · 완료 1개',
  )
  await expect(page.locator('.merge-summary')).toContainText('추가 0개 · 중복 id 유지 2개')
})

test('저장 실패 중 메모리 전체 백업·저장 원본 불변', async ({ page }) => {
  const raw = rawData([task('저장 원본')])
  await seed(page, raw)
  await page.goto('./')
  await page.evaluate(() => {
    window.__failWrite = true
  })
  await page.getByLabel('새 할 일 제목').fill('아직 저장 안 됨')
  await page.getByLabel('새 할 일 제목').press('Enter')
  await manage(page)
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    '아직 브라우저에 저장되지 않은 변경',
  )
  expect((await download(page)).data.tasks.map((t: Task) => t.title)).toEqual([
    '저장 원본',
    '아직 저장 안 됨',
  ])
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
})

const invalidFiles = [
  ['손상 JSON', '{bad', 'JSON을 읽을 수 없습니다'],
  ['raw 저장 원본', rawData([]), '정식 백업 파일이 아닙니다'],
  [
    '백업 버전',
    JSON.stringify({ ...createBackup(data([])), formatVersion: 2 }),
    '지원하지 않는 백업 버전',
  ],
  [
    '데이터 버전',
    JSON.stringify({ ...createBackup(data([])), data: { version: 2, tasks: [] } }),
    '백업 데이터가 올바르지 않습니다',
  ],
  [
    '중복 id',
    JSON.stringify(createBackup(data([task('same'), task('same')]))),
    '백업 데이터가 올바르지 않습니다',
  ],
  [
    '잘못된 날짜',
    JSON.stringify(createBackup(data([task('bad', { dueDate: '2026-02-30' })]))),
    '백업 데이터가 올바르지 않습니다',
  ],
  [
    '제목 길이',
    JSON.stringify(createBackup(data([task('long', { title: '가'.repeat(201) })]))),
    '백업 데이터가 올바르지 않습니다',
  ],
] as const
for (const [label, content, message] of invalidFiles)
  test(`파일 검증 ${label}·원본/상태 유지·재선택`, async ({ page }) => {
    const raw = rawData([task('기존 사용자')])
    await seed(page, raw)
    await page.goto('./')
    const initialStatus = await page.locator('.save-status').innerText()
    await manage(page)
    const input = page.getByLabel('백업 파일 선택 / 다시 선택')
    await input.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(content),
    })
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(message)
    await expect(page.getByRole('heading', { name: '복원 미리보기' })).toHaveCount(0)
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
    expect(await page.locator('.save-status').innerText()).toBe(initialStatus)
    expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
    await input.setInputFiles(file([task('올바른 백업')]))
    await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
    await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(0)
  })

test('10MiB 초과·파일 선택 취소와 미리보기 취소는 목록/저장 상태 불변', async ({ page }) => {
  const raw = rawData([task('기존')])
  await seed(page, raw)
  await page.goto('./')
  await manage(page)
  const input = page.getByLabel('백업 파일 선택 / 다시 선택')
  await input.setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(MAX_BACKUP_BYTES + 1, 32),
  })
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('10MiB 이하')
  await input.setInputFiles(file([task('가져올 일')]))
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
  await input.setInputFiles([])
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '기존 데이터에 합치기', exact: true })).toBeChecked()
  await page.getByRole('button', { name: '복원 취소', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  await expect(page.locator('.sidebar .app-menu summary')).toBeFocused()
})

test('합치기 미리보기·현재 중복 보존·다른 id 같은 제목·1회 저장·검색/완료 갱신', async ({
  page,
}) => {
  const original = [
    task('same', { title: '같은 제목', category: '현재' }),
    task('equal', { completedAt: '2026-10-02T00:00:00.000Z' }),
  ]
  const incoming = [
    task('same', { title: '같은 제목', category: '백업' }),
    original[1],
    task('new', { title: '같은 제목', priority: 'high' }),
  ]
  await seed(page, rawData(original))
  await page.goto('./')
  await page.getByLabel('제목·분류 검색').fill('검색 필터')
  await manage(page)
  await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles(file(incoming))
  await expect(page.locator('.merge-summary')).toContainText('추가 1개 · 중복 id 유지 2개')
  await expect(page.locator('.merge-summary')).toContainText('내용이 다른 중복 1개')
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
  await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
  expect(await readTasks(page)).toEqual([...original, incoming[2]])
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(1)
  await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
  await expect(page.getByLabel('제목·분류 검색')).toHaveValue('')
  await page
    .getByRole('navigation', { name: '할 일 보기', exact: true })
    .getByRole('button', { name: /전체/ })
    .click()
  await expect(page.getByRole('button', { name: '같은 제목 편집', exact: true })).toHaveCount(2)
  await page.locator('.completed-section summary').click()
  await expect(
    page.getByRole('checkbox', { name: 'equal 미완료로 복원', exact: true }),
  ).toBeVisible()
  await page.reload()
  expect(await readTasks(page)).toEqual([...original, incoming[2]])
})

test('전체 교체 확인·취소·교체 전 백업·빈 백업으로 명시적 교체', async ({ page }) => {
  const original = [task('first', { focusDate: today }), task('second')]
  const raw = rawData(original)
  await seed(page, raw)
  await page.goto('./')
  await manage(page)
  await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles(file([]))
  await page.getByRole('radio', { name: '백업으로 전체 교체', exact: true }).check()
  await expect(page.locator('.replace-warning')).toContainText('현재 2개 → 교체 후 0개')
  await page.getByRole('button', { name: '전체 교체 확인으로 이동', exact: true }).click()
  await expect(page.getByRole('heading', { name: '전체 교체 확인', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  expect((await download(page)).data).toEqual(data(original))
  await page.getByRole('button', { name: '교체 취소', exact: true }).click()
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  await page.getByRole('button', { name: '전체 교체 확인으로 이동', exact: true }).click()
  await page.getByRole('button', { name: '확인 후 전체 교체', exact: true }).click()
  expect(await readTasks(page)).toEqual([])
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(1)
  await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
})

for (const mode of ['merge', 'replace'] as const)
  test(`복원 ${mode} 쓰기 실패 원본/메모리/상태 유지·재시도·오래된 실행 취소 정리`, async ({
    page,
  }) => {
    const original = [task('현재', { focusDate: today }), task('지울 일', { focusDate: today })]
    await seed(page, rawData(original))
    await page.goto('./')
    await page.getByRole('button', { name: '지울 일 편집', exact: true }).click()
    await page.getByRole('button', { name: '삭제', exact: true }).click()
    await expect(page.getByRole('button', { name: '실행 취소', exact: true })).toBeVisible()
    const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    const status = await page.locator('.save-status').innerText()
    const count = await page.evaluate(() => window.__restoreWrites)
    await manage(page)
    await page
      .getByLabel('백업 파일 선택 / 다시 선택')
      .setInputFiles(file([task('새 백업', { priority: 'high' })]))
    if (mode === 'replace') {
      await page.getByRole('radio', { name: '백업으로 전체 교체', exact: true }).check()
      await page.getByRole('button', { name: '전체 교체 확인으로 이동', exact: true }).click()
    }
    await page.evaluate(() => {
      window.__failWrite = true
    })
    await page
      .getByRole('button', {
        name: mode === 'merge' ? '합치기 적용' : '확인 후 전체 교체',
        exact: true,
      })
      .click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
      '적용 전 목록과 저장 원본을 유지했습니다',
    )
    await expect(page.getByRole('dialog').getByRole('alert')).toBeFocused()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeInViewport()
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before)
    expect(await page.locator('.task-row').count()).toBe(1)
    expect(await page.locator('.task-row .task-title').innerText()).toBe('현재')
    expect(await page.locator('.save-status').innerText()).toBe(status)
    await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toHaveCount(0)
    await page.evaluate(() => {
      window.__failWrite = false
    })
    await page
      .getByRole('button', {
        name: mode === 'merge' ? '합치기 다시 시도' : '전체 교체 다시 시도',
        exact: true,
      })
      .click()
    await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
    expect(await page.evaluate(() => window.__restoreWrites)).toBe(count! + 2)
    expect((await readTasks(page)).map((t) => t.id)).toEqual(
      mode === 'merge' ? ['현재', '새 백업'] : ['새 백업'],
    )
    await expect(page.getByRole('button', { name: '실행 취소', exact: true })).toHaveCount(0)
  })

for (const state of ['blocked', 'unavailable'])
  test(`저장 보호 ${state}는 복원으로 우회하지 않음`, async ({ page }) => {
    const raw = state === 'blocked' ? '{broken' : rawData([task('원본')])
    await seed(page, raw, state === 'unavailable')
    await page.goto('./')
    await manage(page)
    await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles(file([task('가져올 일')]))
    await expect(page.getByRole('button', { name: '합치기 적용', exact: true })).toBeDisabled()
    await expect(
      page.getByText('저장 보호를 먼저 해결해야 복원할 수 있습니다.', { exact: true }),
    ).toBeVisible()
    expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
    await page.evaluate(() => {
      window.__failRead = false
    })
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  })

test('정확한 예시 재추가 피드백·중복 때 저장 없음·사용자 보존', async ({ page }) => {
  await seed(page, rawData([task('사용자')]))
  await page.goto('./')
  const menu = page.locator('.sidebar .app-menu')
  await menu.locator('summary').click()
  await menu.getByRole('button', { name: '예시로 둘러보기', exact: true }).click()
  await expect(page.getByText('예시 5개를 추가했습니다.', { exact: true })).toBeVisible()
  const count = await page.evaluate(() => window.__restoreWrites)
  await menu.getByRole('button', { name: '예시로 둘러보기', exact: true }).click()
  await expect(page.getByText('예시가 이미 추가되어 있습니다.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__restoreWrites)).toBe(count)
  expect(await readTasks(page)).toHaveLength(6)
  await menu.getByRole('button', { name: '예시 데이터 제거', exact: true }).click()
  expect((await readTasks(page)).map((t) => t.id)).toEqual(['사용자'])
})

test('늦은 파일 읽기가 다음 선택과 닫힌 패널을 덮어쓰지 않음', async ({ page }) => {
  await seed(page, rawData([task('현재')]))
  await page.addInitScript(() => {
    const read = File.prototype.text
    File.prototype.text = function () {
      if (this.name !== 'slow.json') return read.call(this)
      const pendingRead = read.call(this)
      return new Promise<string>((resolve) =>
        setTimeout(() => {
          void pendingRead.then(resolve)
        }, 2000),
      )
    }
  })
  await page.goto('./')
  await manage(page)
  const input = page.getByLabel('백업 파일 선택 / 다시 선택')
  await input.setInputFiles({ ...file([task('늦은 백업')]), name: 'slow.json' })
  await input.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })
  await page.clock.runFor(2100)
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('JSON을 읽을 수 없습니다')
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toHaveCount(0)
  await input.setInputFiles({ ...file([task('늦은 백업')]), name: 'slow.json' })
  await page.keyboard.press('Escape')
  await manage(page)
  await page.clock.runFor(2100)
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toHaveCount(0)
  expect((await readTasks(page)).map((t) => t.id)).toEqual(['현재'])
})

test('데이터 패널 키보드·Tab trap·Escape와 호출 메뉴 포커스 복귀', async ({ page }) => {
  await page.goto('./')
  await manage(page)
  const close = page.getByRole('button', { name: '백업·복원 닫기', exact: true })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByLabel('백업 파일 선택 / 다시 선택')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('/')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.sidebar .app-menu summary')).toBeFocused()
})

const displayTasks = [
  task('택배 반품 접수', { dueDate: '2026-10-01', priority: 'high', category: '개인' }),
  task('발표 자료 최종 확인', {
    dueDate: today,
    focusDate: today,
    priority: 'high',
    category: '업무',
  }),
  task('어제 시작한 글 이어쓰기', {
    focusDate: '2026-10-01',
    dueDate: '2026-10-03',
    priority: 'medium',
    category: '개인',
  }),
  task('중요한 신청서 제출', { dueDate: '2026-10-05', priority: 'high', category: '생활' }),
  task('세탁소 방문', { focusDate: today, category: '개인' }),
]
test('새 모바일 패널 touch·작아진 가시 영역·복원 조작', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
  })
  try {
    const page = await context.newPage()
    await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
    await seed(page, rawData(displayTasks))
    await page.goto(test.info().project.use.baseURL!)
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).tap()
    await page.setViewportSize({ width: 390, height: 480 })
    const action = page.getByRole('button', {
      name: '어제 시작한 글 이어쓰기 집중하기',
      exact: true,
    })
    await action.scrollIntoViewIfNeeded()
    await action.tap()
    expect((await readTasks(page)).find((t) => t.id === '어제 시작한 글 이어쓰기')?.focusDate).toBe(
      today,
    )
    await page.getByRole('button', { name: '오늘 계획하기 닫기', exact: true }).tap()
    await manage(page)
    await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles(file([task('모바일 복원')]))
    const apply = page.getByRole('button', { name: '합치기 적용', exact: true })
    await apply.scrollIntoViewIfNeeded()
    await expect(apply).toBeInViewport()
    expect((await apply.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await apply.tap()
    await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
    expect((await readTasks(page)).some((t) => t.id === '모바일 복원')).toBe(true)
  } finally {
    await context.close()
  }
})
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [390, 844],
  [320, 740],
])
  test(`v1.1 ${width}×${height} 계획·복원 미리보기·긴 제목·메타·하단 UI`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await seed(page, rawData(displayTasks))
    await page.goto('./')
    const label = width === 1440 ? 'desktop' : width === 390 ? 'mobile' : String(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(
      await page
        .locator('.task-meta')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(13)
    await page.screenshot({
      path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.3/regression'}/today-${label}.png`,
      fullPage: false,
    })
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const assertBounds = async () => {
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(box.y + box.height).toBeLessThanOrEqual(height)
    }
    await assertBounds()
    await page.screenshot({
      path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.3/regression'}/plan-${label}.png`,
      fullPage: false,
    })
    await dialog
      .getByRole('button', { name: '어제 시작한 글 이어쓰기 집중하기', exact: true })
      .click()
    await expect(
      dialog.getByRole('button', { name: '오늘 계획하기 닫기', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await manage(page)
    await page
      .getByLabel('백업 파일 선택 / 다시 선택')
      .setInputFiles(
        file([
          displayTasks[0],
          task('추가 백업', { title: '백업에서 가져올 일', priority: 'high' }),
          task('완료 예시', { completedAt: '2026-10-02T01:00:00.000Z', isDemo: true }),
        ]),
      )
    await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
    await assertBounds()
    await page.getByRole('button', { name: '합치기 적용', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({
      path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.3/regression'}/restore-${label}.png`,
      fullPage: false,
    })
    const target = (await page
      .getByRole('button', { name: '합치기 적용', exact: true })
      .boundingBox())!
    expect(target.height).toBeGreaterThanOrEqual(44)
    await page.keyboard.press('Escape')
    const menu = page.locator(width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
    await expect(menu.locator('summary')).toBeFocused()
    const longTask = task('긴 제목', {
      title: '긴한글제목'.repeat(40),
      category: '가'.repeat(24),
      dueDate: today,
      priority: 'high',
    })
    await page.evaluate(
      ({ key, tasks }) => localStorage.setItem(key, JSON.stringify({ version: 1, tasks })),
      { key: STORAGE_KEY, tasks: [longTask] },
    )
    await page.reload()
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    await assertBounds()
    const action = page
      .getByRole('dialog')
      .getByRole('button', { name: `${longTask.title} 집중하기`, exact: true })
    await action.scrollIntoViewIfNeeded()
    expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await action.click()
    expect((await readTasks(page))[0].title).toHaveLength(200)
  })
