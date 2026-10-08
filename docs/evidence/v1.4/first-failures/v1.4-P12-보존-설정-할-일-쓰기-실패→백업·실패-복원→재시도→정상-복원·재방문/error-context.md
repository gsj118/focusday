# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v1.4.spec.ts >> P12 보존: 설정/할 일 쓰기 실패→백업·실패 복원→재시도→정상 복원·재방문
- Location: tests\e2e\v1.4.spec.ts:719:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.evaluate: Target page, context or browser has been closed
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
      - button "오늘 0" [ref=e19] [cursor=pointer]:
        - generic [ref=e23]: 오늘
        - generic [ref=e24]: "0"
      - button "전체 할 일 0" [ref=e25] [cursor=pointer]:
        - generic [ref=e29]: 전체 할 일
        - generic [ref=e30]: "0"
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
        - generic [ref=e61]: 10월 8일 목요일
      - paragraph [ref=e62]: 계획 변경도 계획이 하는 일 중 하나죠.
    - region "오늘 집중 요약" [ref=e63]:
      - generic [ref=e67]:
        - heading "오늘 집중" [level=2] [ref=e68]
        - paragraph [ref=e69]:
          - text: 직접 집중으로 고른
          - strong [ref=e70]: 0개
          - text: · 기한으로 표시된
          - strong [ref=e71]: 0개
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
      - heading "오늘은 비어 있습니다" [level=2] [ref=e105]
      - paragraph [ref=e106]: 전체 할 일에서 오늘 할 일을 고르거나 새로 추가해 보세요.
      - generic [ref=e107]:
        - button "+ 새 할 일" [ref=e108] [cursor=pointer]
        - button "전체 할 일 보기" [ref=e109] [cursor=pointer]
    - group [ref=e112]:
      - generic "오늘 마친 일 1개" [ref=e113] [cursor=pointer]
    - generic [ref=e116]:
      - generic [ref=e117]: 생각난 일은 빠르게 담고, 오늘 할 일만 선명하게.
      - generic [ref=e118]: Focusday
  - dialog [ref=e119]:
    - generic [ref=e120]:
      - banner [ref=e121]:
        - generic [ref=e122]:
          - paragraph [ref=e123]: Focusday / 데이터
          - heading "백업·복원" [level=2] [ref=e124]
        - button "백업·복원 닫기" [ref=e125] [cursor=pointer]
      - generic [ref=e128]:
        - paragraph [ref=e129]: 전체 할 일을 파일로 보관하고 필요할 때 가져오세요. 완료·예시와 모든 속성을 포함합니다. 문구 설정·내 문장은 제외하며 파일은 직접 보관해야 합니다. 자동 서버 백업·동기화가 아닙니다.
        - region [ref=e130]:
          - heading "전체 데이터 백업" [level=3] [ref=e131]
          - paragraph [ref=e132]: 현재 탭의 전체 1개 · 미완료 0개 · 완료 1개
          - paragraph [ref=e133]: 완료·예시와 모든 속성을 포함합니다. 저장 실패 중의 변경도 포함됩니다.
          - paragraph [ref=e134]: 백업·가져오기 최대 10MiB. 초과 시 내보내기를 중단하며 목록은 유지됩니다.
          - button "JSON 백업 다운로드" [ref=e135] [cursor=pointer]
        - region [ref=e136]:
          - heading "백업 파일 가져오기" [level=3] [ref=e137]
          - paragraph [ref=e138]: Focusday 정식 JSON 백업 · 최대 10MiB. 선택만으로 목록은 바뀌지 않습니다.
          - generic [ref=e139]: 백업 파일 선택 / 다시 선택
          - button "백업 파일 선택 / 다시 선택" [ref=e140]
          - paragraph [ref=e141]: v1-backup.json
        - alert [active] [ref=e142]: 복원 저장에 실패했습니다. 적용 전 목록과 저장 원본을 유지했습니다. 다시 시도하거나 취소해 주세요.
        - region [ref=e143]:
          - heading "복원 미리보기" [level=3] [ref=e144]
          - paragraph [ref=e145]: 백업 전체 1개 · 미완료 0개 · 완료 1개
          - paragraph [ref=e146]: "백업 시각: 2026. 10. 8. 오전 10:00"
          - group "복원 방식" [ref=e147]:
            - generic [ref=e149] [cursor=pointer]:
              - radio "기존 데이터에 합치기" [checked] [ref=e150]
              - text: 기존 데이터에 합치기
            - generic [ref=e151] [cursor=pointer]:
              - radio "백업으로 전체 교체" [ref=e152]
              - text: 백업으로 전체 교체
          - generic [ref=e153]:
            - paragraph [ref=e154]: 추가 1개 · 중복 id 유지 0개
            - paragraph [ref=e155]: 내용이 다른 중복 0개도 현재 항목을 유지합니다.
            - paragraph [ref=e156]: 제목이 같아도 id가 다르면 별도 항목으로 추가합니다. 복원 후 전체 2개.
          - generic [ref=e157]:
            - button "복원 취소" [ref=e158] [cursor=pointer]
            - button "합치기 다시 시도" [ref=e159] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, type Page, type TestInfo } from '@playwright/test'
  2   | import { readFile } from 'node:fs/promises'
  3   | import { createTask, type Task } from '../../src/domain'
  4   | import { defaultPreferences, UI_STORAGE_KEY, type UIPreferences } from '../../src/preferences'
  5   | import { dailySentence, ORIGINAL_GUIDANCE } from '../../src/encouragement'
  6   | import { createBackup } from '../../src/backup'
  7   | 
  8   | const day = '2026-10-08'
  9   | const stamp = '2026-10-08T01:00:00.000Z'
  10  | const phase = process.env.V14_PHASE || 'final'
  11  | const shots = process.env.V14_SHOTS || `docs/screenshots/v1.4/beta-${phase}`
  12  | const observations = new Map<string, Record<string, unknown>[]>()
  13  | const make = (id: string, extra: Partial<Task> = {}): Task => ({
  14  |   ...createTask(id, 'all', day, stamp, id),
  15  |   ...extra,
  16  | })
  17  | const tasks = (page: Page): Promise<Task[]> =>
  18  |   page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1') || '{"tasks":[]}').tasks)
  19  | const prefs = (page: Page): Promise<UIPreferences | null> =>
  20  |   page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), UI_STORAGE_KEY)
  21  | const summary = (page: Page) => page.locator('.achievements-section > summary')
  22  | const sentence = (page: Page) => page.locator('.daily-sentence')
  23  | const cheer = (page: Page) => page.locator('.encouragement')
  24  | const menu = (page: Page) =>
  25  |   page.locator(page.viewportSize()!.width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
  26  | async function seed(page: Page, list: Task[], ui?: unknown) {
  27  |   await page.addInitScript(
  28  |     ({ list, ui, key }) => {
  29  |       if (localStorage.getItem('focusday:v1') === null)
  30  |         localStorage.setItem('focusday:v1', JSON.stringify({ version: 1, tasks: list }))
  31  |       if (ui !== undefined && localStorage.getItem(key) === null)
  32  |         localStorage.setItem(key, typeof ui === 'string' ? ui : JSON.stringify(ui))
  33  |     },
  34  |     { list, ui, key: UI_STORAGE_KEY },
  35  |   )
  36  | }
  37  | async function nav(page: Page, view: '오늘' | '전체') {
  38  |   await page
  39  |     .getByRole('navigation', {
  40  |       name: page.viewportSize()!.width < 900 ? '모바일 보기' : '할 일 보기',
  41  |       exact: true,
  42  |     })
  43  |     .getByRole('button', { name: new RegExp(view) })
  44  |     .click()
  45  | }
  46  | async function open(page: Page, name = '문구와 격려 설정') {
  47  |   await menu(page).locator('summary').click()
  48  |   await menu(page).getByRole('button', { name, exact: true }).click()
  49  | }
  50  | async function add(page: Page, title: string) {
  51  |   await page.getByLabel('새 할 일 제목').fill(title)
  52  |   await page.getByLabel('새 할 일 제목').press('Enter')
  53  | }
  54  | async function complete(page: Page, title: string) {
  55  |   await page.getByRole('checkbox', { name: `${title} 완료`, exact: true }).click()
  56  | }
  57  | async function saveSettings(page: Page) {
  58  |   await page
  59  |     .locator('.editor-footer')
  60  |     .getByRole('button', { name: /설정 저장/ })
  61  |     .click()
  62  |   await expect(page.getByRole('status').filter({ hasText: '설정을 저장했습니다.' })).toBeVisible()
  63  |   await page.keyboard.press('Escape')
  64  | }
  65  | async function upload(page: Page, list: Task[]) {
  66  |   await page
  67  |     .locator('#backup-file')
  68  |     .setInputFiles({
  69  |       name: 'v1-backup.json',
  70  |       mimeType: 'application/json',
  71  |       buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks: list }, stamp))),
  72  |     })
  73  |   await expect(page.getByRole('heading', { name: '복원 미리보기', exact: true })).toBeVisible()
  74  | }
  75  | async function check(
  76  |   page: Page,
  77  |   info: TestInfo,
  78  |   id: string,
  79  |   expected: string,
  80  |   action: () => Promise<void>,
  81  | ) {
  82  |   const record: Record<string, unknown> = {
  83  |     caseId: id,
  84  |     persona: info.title.slice(0, 3),
  85  |     expected,
  86  |     phase,
  87  |     checkedAt: new Date().toISOString(),
  88  |     steps: id,
  89  |   }
  90  |   const list = observations.get(info.title) || []
  91  |   list.push(record)
  92  |   observations.set(info.title, list)
  93  |   try {
  94  |     await test.step(id, action)
  95  |     record.status = 'PASS'
  96  |   } catch (error) {
  97  |     record.status = 'FAIL'
  98  |     record.error = String(error)
  99  |     throw error
  100 |   } finally {
> 101 |     record.actual = await page.evaluate(() => ({
      |                                ^ Error: page.evaluate: Target page, context or browser has been closed
  102 |       sentence: document.querySelector('.daily-sentence')?.textContent || null,
  103 |       achievements: document.querySelector('.achievements-section > summary')?.textContent || null,
  104 |       toast: document.querySelector('.undo-toast')?.textContent || null,
  105 |       focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName,
  106 |       taskRaw: localStorage.getItem('focusday:v1'),
  107 |       uiRaw: localStorage.getItem('focusday:ui:v1'),
  108 |       clock: new Date().toISOString(),
  109 |       viewport: { width: innerWidth, height: innerHeight },
  110 |     }))
  111 |     const path = `${shots}/${id}-${record.status}.png`
  112 |     await page.screenshot({ path })
  113 |     record.screenshot = path
  114 |     await info.attach('v1.4-case', {
  115 |       body: Buffer.from(JSON.stringify(record)),
  116 |       contentType: 'application/json',
  117 |     })
  118 |   }
  119 | }
  120 | test.beforeEach(async ({ page }) => {
  121 |   await page.clock.install({ time: new Date(stamp) })
  122 | })
  123 | test.afterEach(async ({ page }, info) => {
  124 |   void page
  125 |   observations.delete(info.title)
  126 | })
  127 | 
  128 | test('P01 처음 사용: 빈 화면→입력→계획→완료 복구→설정·백업→재방문', async ({ page }, info) => {
  129 |   await page.goto('./')
  130 |   await check(
  131 |     page,
  132 |     info,
  133 |     'P01-01',
  134 |     '읽기만 수행, 기본 차분한 문구, 접힌 0개/빈 상태, 첫 입력 포커스',
  135 |     async () => {
  136 |       expect(await page.evaluate(() => localStorage.length)).toBe(0)
  137 |       await expect(sentence(page)).toHaveText(dailySentence(day, 'calm'))
  138 |       await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  139 |       expect(await page.locator('.achievements-section').getAttribute('open')).toBeNull()
  140 |       await summary(page).click()
  141 |       await expect(page.getByText('오늘 마친 일이 여기에 모입니다.')).toBeVisible()
  142 |       await add(page, '첫 번째 할 일')
  143 |       await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  144 |       await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
  145 |       await page.keyboard.press('Escape')
  146 |     },
  147 |   )
  148 |   await check(
  149 |     page,
  150 |     info,
  151 |     'P01-02',
  152 |     '첫 완료 통합 toast/1개, undo 0개, 재완료 일반 안내',
  153 |     async () => {
  154 |       await complete(page, '첫 번째 할 일')
  155 |       await expect(cheer(page)).toContainText('첫 한 가지')
  156 |       await expect(summary(page)).toHaveText('오늘 마친 일 1개')
  157 |       await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  158 |       await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  159 |       await complete(page, '첫 번째 할 일')
  160 |       await expect(cheer(page)).toHaveCount(0)
  161 |     },
  162 |   )
  163 |   await check(page, info, 'P01-03', '설정 저장·백업 제외 경계·재방문 유지', async () => {
  164 |     await open(page)
  165 |     await page.getByRole('radio', { name: '유머', exact: true }).check()
  166 |     await saveSettings(page)
  167 |     await open(page, '백업·복원')
  168 |     const pending = page.waitForEvent('download')
  169 |     await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  170 |     const download = await pending
  171 |     const text = await readFile((await download.path())!, 'utf8')
  172 |     const backup = JSON.parse(text)
  173 |     expect(backup).toEqual({
  174 |       format: 'focusday-backup',
  175 |       formatVersion: 1,
  176 |       exportedAt: expect.any(String),
  177 |       data: { version: 1, tasks: await tasks(page) },
  178 |     })
  179 |     expect(text).toBe(JSON.stringify(backup))
  180 |     await download.delete()
  181 |     await page.keyboard.press('Escape')
  182 |     await page.reload()
  183 |     await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
  184 |     await expect(summary(page)).toHaveText('오늘 마친 일 1개')
  185 |     await expect(cheer(page)).toHaveCount(0)
  186 |   })
  187 | })
  188 | 
  189 | test('P02 키보드: Enter·Tab·Escape→설정 trap→성취 복원 초점→백업', async ({ page }, info) => {
  190 |   await page.goto('./')
  191 |   await check(
  192 |     page,
  193 |     info,
  194 |     'P02-01',
  195 |     '키보드 입력/설정 초안 취소, textarea 포함 trap, 메뉴로 초점 복귀',
  196 |     async () => {
  197 |       await page.getByLabel('새 할 일 제목').focus()
  198 |       await page.keyboard.type('Keyboard task')
  199 |       await page.keyboard.press('Enter')
  200 |       await menu(page).locator('summary').focus()
  201 |       await page.keyboard.press('Enter')
```