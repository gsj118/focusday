# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v1.1.spec.ts >> 요약 합계·집중 해제 기한 잔류·완료 후 즉시 일치
- Location: tests\e2e\v1.1.spec.ts:115:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2
Received: 3
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "할 일 목록으로 이동" [ref=e4] [cursor=pointer]:
    - /url: "#main"
  - complementary [ref=e5]:
    - link "Focusday" [ref=e6] [cursor=pointer]:
      - /url: "#main"
      - generic [ref=e10]:
        - text: Focusday
        - generic [ref=e11]: 개인 작업 공간
    - button "검색" [ref=e12] [cursor=pointer]:
      - text: 검색
      - generic [ref=e16]: /
    - paragraph [ref=e17]: 나의 할 일
    - navigation "할 일 보기" [ref=e18]:
      - button "오늘 2" [ref=e19] [cursor=pointer]:
        - generic [ref=e23]: 오늘
        - generic [ref=e24]: "2"
      - button "전체 할 일 3" [ref=e25] [cursor=pointer]:
        - generic [ref=e29]: 전체 할 일
        - generic [ref=e30]: "3"
    - generic [ref=e31]:
      - button "백업·복원" [ref=e32] [cursor=pointer]
      - group [ref=e36]:
        - generic "예시 및 앱 정보" [ref=e37] [cursor=pointer]
      - generic [ref=e43]: 내 브라우저, 나의 할 일
  - main [ref=e48]:
    - generic [ref=e49]:
      - generic [ref=e50]: Focusday / 오늘
      - status [ref=e51]: 저장됨
    - generic [ref=e54]:
      - generic [ref=e59]:
        - heading "오늘" [level=1] [ref=e60]
        - generic [ref=e61]: 10월 2일 금요일
      - paragraph [ref=e62]: 한 번에 하나씩, 마음에 여백을 남기세요.
    - region "오늘 집중 요약" [ref=e63]:
      - generic [ref=e67]:
        - heading "오늘 집중" [level=2] [ref=e68]
        - paragraph [ref=e69]:
          - text: 직접 집중으로 고른
          - strong [ref=e70]: 0개
          - text: · 기한으로 표시된
          - strong [ref=e71]: 2개
      - button "오늘 계획하기" [ref=e72] [cursor=pointer]
    - generic [ref=e76]:
      - generic [ref=e77]:
        - generic [ref=e81]: 할 일 목록
        - generic [ref=e82]: 제목을 눌러 편집
      - generic [ref=e83]:
        - generic [ref=e87]: 제목·분류 검색
        - searchbox "제목·분류 검색" [ref=e88]
    - generic [ref=e89]:
      - generic [ref=e93]: 새 할 일 제목
      - textbox "새 할 일 제목" [ref=e94]:
        - /placeholder: 무엇을 해야 하나요?
      - button "추가" [ref=e95] [cursor=pointer]
    - generic [ref=e97]:
      - generic [ref=e98]: 새 할 일은 오늘에 담깁니다
      - generic [ref=e99]: Enter로 추가 ↵
    - generic [ref=e100]:
      - status [ref=e101]: 집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.
      - button "기한 편집" [ref=e102] [cursor=pointer]
      - button "안내 닫기" [ref=e103] [cursor=pointer]
    - region "기한 초과" [ref=e106]:
      - generic [ref=e107]:
        - heading "기한 초과" [level=2] [ref=e108]
        - generic [ref=e109]: "1"
        - paragraph [ref=e110]: 기한을 확인해 주세요
      - list [ref=e111]:
        - listitem [ref=e112]:
          - checkbox "기한만 완료" [ref=e114] [cursor=pointer]
          - button "기한만 편집" [ref=e115] [cursor=pointer]:
            - generic [ref=e116]: 기한만
            - generic [ref=e117]: 기한 초과 · 1일 지남
          - button "기한만 집중하기" [ref=e119] [cursor=pointer]:
            - generic [ref=e122]: 집중하기
    - region "오늘" [ref=e123]:
      - generic [ref=e124]:
        - heading "오늘" [level=2] [ref=e125]
        - generic [ref=e126]: "1"
      - list [ref=e127]:
        - listitem [ref=e128]:
          - checkbox "둘 다 완료" [active] [ref=e130] [cursor=pointer]
          - button "둘 다 편집" [ref=e131] [cursor=pointer]:
            - generic [ref=e132]: 둘 다
            - generic [ref=e133]: 오늘 기한
          - button "둘 다 집중하기" [ref=e135] [cursor=pointer]:
            - generic [ref=e138]: 집중하기
    - group [ref=e139]:
      - generic "오늘 마친 일 1개" [ref=e140] [cursor=pointer]
    - generic [ref=e143]:
      - generic [ref=e144]: 생각난 일은 빠르게 담고, 오늘 할 일만 선명하게.
      - generic [ref=e145]: Focusday
  - generic [ref=e146]:
    - status [ref=e147]:
      - text: 할 일을 완료했습니다.
      - generic [ref=e148]: 첫 한 가지를 마쳤어요. 작은 진전입니다.
    - generic [ref=e149]:
      - button "실행 취소" [ref=e150] [cursor=pointer]
      - button "완료 목록" [ref=e151] [cursor=pointer]
```

# Test source

```ts
  36  |           window.__restoreWrites!++
  37  |           if (window.__failWrite) throw new DOMException('quota', 'QuotaExceededError')
  38  |         }
  39  |         return set.call(this, k, v)
  40  |       }
  41  |       Storage.prototype.getItem = function (k) {
  42  |         if (k === key && window.__failRead) throw new DOMException('denied', 'SecurityError')
  43  |         return get.call(this, k)
  44  |       }
  45  |     },
  46  |     { raw, key: STORAGE_KEY, failRead },
  47  |   )
  48  | }
  49  | async function readTasks(page: Page): Promise<Task[]> {
  50  |   return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).tasks, STORAGE_KEY)
  51  | }
  52  | async function manage(page: Page) {
  53  |   const menu = page.locator(
  54  |     (page.viewportSize()?.width ?? 1440) < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu',
  55  |   )
  56  |   await menu.locator('summary').click()
  57  |   await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
  58  |   await expect(page.getByRole('dialog', { name: '백업·복원', exact: true })).toBeVisible()
  59  | }
  60  | async function download(page: Page) {
  61  |   const promise = page.waitForEvent('download')
  62  |   await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  63  |   const downloaded = await promise
  64  |   expect(downloaded.suggestedFilename()).toBe('focusday-backup-2026-10-02.json')
  65  |   const content = JSON.parse(await readFile((await downloaded.path())!, 'utf8'))
  66  |   await downloaded.delete()
  67  |   return content
  68  | }
  69  | test.beforeEach(async ({ page }) => {
  70  |   await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
  71  | })
  72  | 
  73  | test('v1 데이터 그대로 로드·계획 그룹·사실 이유·중복 제외·집중 중·이어가기 id/기한 보존', async ({
  74  |   page,
  75  | }) => {
  76  |   const original = [
  77  |     task('기한 겹침', { dueDate: '2026-09-30', focusDate: '2026-10-01', priority: 'high' }),
  78  |     task('오늘 기한', { dueDate: today }),
  79  |     task('어제 일', { focusDate: '2026-10-01', dueDate: '2026-10-03' }),
  80  |     task('중요한 일', { priority: 'high', focusDate: today }),
  81  |     task('완료한 어제', { focusDate: '2026-10-01', completedAt: '2026-10-01T01:00:00.000Z' }),
  82  |     task('이틀 전', { focusDate: '2026-09-30' }),
  83  |   ]
  84  |   const raw = rawData(original)
  85  |   await seed(page, raw)
  86  |   await page.goto('./')
  87  |   await expect(page.getByText('어제 마치지 못한 일 2개', { exact: false })).toBeVisible()
  88  |   expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  89  |   await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  90  |   const dialog = page.getByRole('dialog')
  91  |   expect(
  92  |     await dialog
  93  |       .locator('.plan-row')
  94  |       .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.taskId)),
  95  |   ).toEqual(['기한 겹침', '오늘 기한', '어제 일', '중요한 일'])
  96  |   await expect(dialog.locator('[data-task-id="기한 겹침"] .plan-reasons')).toContainText(
  97  |     '어제 선택한 일',
  98  |   )
  99  |   await expect(dialog.getByText('오늘 집중 · 집중 중', { exact: true })).toBeVisible()
  100 |   expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  101 |   await dialog.getByRole('button', { name: '어제 일 집중하기', exact: true }).click()
  102 |   expect((await readTasks(page)).find((t) => t.id === '어제 일')).toMatchObject({
  103 |     ...original[2],
  104 |     focusDate: today,
  105 |     updatedAt: expect.any(String),
  106 |   })
  107 |   expect(await readTasks(page)).toHaveLength(original.length)
  108 |   await expect(page.locator('.yesterday-note')).toContainText('어제 마치지 못한 일 1개')
  109 |   await expect(dialog.getByRole('button', { name: '어제 일 집중하기', exact: true })).toHaveCount(0)
  110 |   await page.keyboard.press('Escape')
  111 |   await expect(page.getByRole('button', { name: '오늘 계획하기', exact: true })).toBeFocused()
  112 |   await expect(page.getByRole('button', { name: '어제 일 편집', exact: true })).toBeVisible()
  113 | })
  114 | 
  115 | test('요약 합계·집중 해제 기한 잔류·완료 후 즉시 일치', async ({ page }) => {
  116 |   await seed(
  117 |     page,
  118 |     rawData([
  119 |       task('둘 다', { focusDate: today, dueDate: today }),
  120 |       task('직접', { focusDate: today }),
  121 |       task('기한만', { dueDate: '2026-10-01' }),
  122 |       task('미래', { dueDate: '2026-10-03' }),
  123 |     ]),
  124 |   )
  125 |   await page.goto('./')
  126 |   const summary = page.getByRole('region', { name: '오늘 집중 요약' })
  127 |   await expect(summary).toContainText('직접 집중으로 고른 2개 · 기한으로 표시된 1개')
  128 |   await page.getByRole('button', { name: '둘 다 집중 해제', exact: true }).click()
  129 |   await expect(summary).toContainText('직접 집중으로 고른 1개 · 기한으로 표시된 2개')
  130 |   await expect(
  131 |     page.getByText('집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', { exact: true }),
  132 |   ).toBeVisible()
  133 |   await expect(page.getByRole('button', { name: '기한 편집', exact: true })).toBeVisible()
  134 |   await page.getByRole('checkbox', { name: '직접 완료', exact: true }).click()
  135 |   await expect(summary).toContainText('직접 집중으로 고른 0개 · 기한으로 표시된 2개')
> 136 |   expect(await page.locator('.task-row').count()).toBe(2)
      |                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  137 | })
  138 | 
  139 | test('후보 없음·전체 경로·N 단축키 차단·Escape와 양방향 Tab 경계', async ({ page }) => {
  140 |   await seed(page, rawData([task('낮은 일', { priority: 'low' })]))
  141 |   await page.goto('./')
  142 |   await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  143 |   await expect(
  144 |     page.getByRole('heading', { name: '지금 살펴볼 계획 후보가 없습니다' }),
  145 |   ).toBeVisible()
  146 |   const close = page.getByRole('button', { name: '오늘 계획하기 닫기' })
  147 |   await expect(close).toBeFocused()
  148 |   await page.keyboard.press('n')
  149 |   await expect(close).toBeFocused()
  150 |   await page.keyboard.press('Shift+Tab')
  151 |   await expect(page.getByRole('button', { name: '오늘 목록으로 돌아가기' })).toBeFocused()
  152 |   await page.keyboard.press('Tab')
  153 |   await expect(close).toBeFocused()
  154 |   await page
  155 |     .getByRole('dialog')
  156 |     .getByRole('button', { name: '전체 할 일 보기', exact: true })
  157 |     .first()
  158 |     .click()
  159 |   await expect(page.getByRole('dialog')).toHaveCount(0)
  160 |   await expect(page.getByRole('button', { name: '낮은 일 집중하기', exact: true })).toBeVisible()
  161 | })
  162 | 
  163 | test('열린 계획 패널의 자정·월말 어제 상태·자동 이월 없음', async ({ page }) => {
  164 |   await page.clock.setSystemTime(new Date('2026-10-31T23:59:59+09:00'))
  165 |   await seed(
  166 |     page,
  167 |     rawData([
  168 |       task('방금 선택', { focusDate: '2026-10-31' }),
  169 |       task('이전 어제', { focusDate: '2026-10-30' }),
  170 |     ]),
  171 |   )
  172 |   await page.goto('./')
  173 |   await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  174 |   await expect(page.getByRole('dialog').getByText('이전 어제', { exact: true })).toBeVisible()
  175 |   await page.clock.runFor(2000)
  176 |   await expect(page.getByRole('dialog').getByText('방금 선택', { exact: true })).toBeVisible()
  177 |   await expect(page.getByRole('dialog').getByText('이전 어제', { exact: true })).toHaveCount(0)
  178 |   expect((await readTasks(page)).map((t) => t.focusDate)).toEqual(['2026-10-31', '2026-10-30'])
  179 |   await page.keyboard.press('Escape')
  180 |   await expect(page.locator('.today-planning')).toContainText('어제 마치지 못한 일 1개')
  181 | })
  182 | for (const event of ['focus', 'visibilitychange'])
  183 |   test(`계획 ${event} 연말 갱신·이어가기`, async ({ page }) => {
  184 |     await page.clock.setSystemTime(new Date('2026-12-31T10:00:00+09:00'))
  185 |     await seed(page, rawData([task('연말', { focusDate: '2026-12-31', dueDate: '2027-01-03' })]))
  186 |     await page.goto('./')
  187 |     await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  188 |     await page.clock.setSystemTime(new Date('2027-01-01T10:00:00+09:00'))
  189 |     await page.evaluate(
  190 |       (event) => (event === 'focus' ? window : document).dispatchEvent(new Event(event)),
  191 |       event,
  192 |     )
  193 |     await page
  194 |       .getByRole('dialog')
  195 |       .getByRole('button', { name: '연말 집중하기', exact: true })
  196 |       .click()
  197 |     expect((await readTasks(page))[0]).toMatchObject({
  198 |       id: '연말',
  199 |       focusDate: '2027-01-01',
  200 |       dueDate: '2027-01-03',
  201 |     })
  202 |   })
  203 | 
  204 | test('전체 JSON 백업 round trip·저장 쓰기 없음·Object URL 정리', async ({ page }) => {
  205 |   const tasks = [
  206 |     task('미완료', {
  207 |       priority: 'high',
  208 |       category: '업무',
  209 |       focusDate: '2026-10-01',
  210 |       dueDate: '2026-10-03',
  211 |     }),
  212 |     task('완료 예시', { completedAt: '2026-10-02T00:00:00.000Z', isDemo: true }),
  213 |   ]
  214 |   const raw = rawData(tasks)
  215 |   await seed(page, raw)
  216 |   await page.addInitScript(() => {
  217 |     const revoke = URL.revokeObjectURL
  218 |     window.__revokedURLs = 0
  219 |     URL.revokeObjectURL = (url) => {
  220 |       window.__revokedURLs!++
  221 |       revoke(url)
  222 |     }
  223 |   })
  224 |   await page.goto('./')
  225 |   await manage(page)
  226 |   const exported = await download(page)
  227 |   expect(exported).toMatchObject({ format: 'focusday-backup', formatVersion: 1, data: data(tasks) })
  228 |   expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(raw)
  229 |   expect(await page.evaluate(() => window.__restoreWrites)).toBe(0)
  230 |   await page.clock.runFor(1100)
  231 |   expect(await page.evaluate(() => window.__revokedURLs)).toBe(1)
  232 |   await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles({
  233 |     name: 'round-trip.json',
  234 |     mimeType: 'application/json',
  235 |     buffer: Buffer.from(JSON.stringify(exported)),
  236 |   })
```