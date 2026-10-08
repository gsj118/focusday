# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v1.4.spec.ts >> P03 한글 입력: 합성 조합→연속 입력·편집→내 문장 경계·HTML→재방문
- Location: tests\e2e\v1.4.spec.ts:246:1

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
      - button "오늘 2" [ref=e19] [cursor=pointer]:
        - generic [ref=e23]: 오늘
        - generic [ref=e24]: "2"
      - button "전체 할 일 2" [ref=e25] [cursor=pointer]:
        - generic [ref=e29]: 전체 할 일
        - generic [ref=e30]: "2"
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
      - paragraph [ref=e62]: 계획은 바뀌어도 괜찮습니다.
    - region "오늘 집중 요약" [ref=e63]:
      - generic [ref=e67]:
        - heading "오늘 집중" [level=2] [ref=e68]
        - paragraph [ref=e69]:
          - text: 직접 집중으로 고른
          - strong [ref=e70]: 2개
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
    - region "오늘" [ref=e100]:
      - generic [ref=e101]:
        - heading "오늘" [level=2] [ref=e102]
        - generic [ref=e103]: "2"
      - list [ref=e104]:
        - listitem [ref=e105]:
          - checkbox "조합 중 완료" [ref=e107] [cursor=pointer]
          - button "조합 중 편집" [ref=e108] [cursor=pointer]:
            - generic [ref=e109]: 조합 중
            - generic [ref=e110]:
              - generic [ref=e111]: 한글 분류
              - generic [ref=e112]: 오늘 집중
          - button "조합 중 집중 해제" [pressed] [ref=e116] [cursor=pointer]:
            - generic [ref=e120]: 집중 해제
        - listitem [ref=e121]:
          - checkbox "다음 입력 완료" [ref=e123] [cursor=pointer]
          - button "다음 입력 편집" [ref=e124] [cursor=pointer]:
            - generic [ref=e125]: 다음 입력
            - generic [ref=e126]: 오늘 집중
          - button "다음 입력 집중 해제" [pressed] [ref=e131] [cursor=pointer]:
            - generic [ref=e135]: 집중 해제
    - group [ref=e136]:
      - generic "오늘 마친 일 0개" [ref=e137] [cursor=pointer]
    - generic [ref=e140]:
      - generic [ref=e141]: 생각난 일은 빠르게 담고, 오늘 할 일만 선명하게.
      - generic [ref=e142]: Focusday
  - dialog [ref=e143]:
    - generic [ref=e144]:
      - banner [ref=e145]:
        - generic [ref=e146]:
          - paragraph [ref=e147]: Focusday / 설정
          - heading "문구와 격려 설정" [level=2] [ref=e148]
        - button "문구와 격려 설정 닫기" [ref=e149] [cursor=pointer]
      - generic [ref=e152]:
        - paragraph [ref=e153]: 오늘의 한 문장과 완료 순간의 짧은 격려를 선택하세요.
        - paragraph [ref=e154]: 저장한 설정과 내 문장은 이 브라우저에만 남고 전체 할 일 백업에는 포함되지 않습니다.
        - generic [ref=e155]:
          - group "오늘의 한 문장" [ref=e156]:
            - generic [ref=e158] [cursor=pointer]:
              - radio "차분한 문구" [ref=e159]
              - generic [ref=e160]: 차분한 문구
            - generic [ref=e161] [cursor=pointer]:
              - radio "유머" [ref=e162]
              - generic [ref=e163]: 유머
            - generic [ref=e164] [cursor=pointer]:
              - radio "내 문장" [checked] [ref=e165]
              - generic [ref=e166]: 내 문장
            - generic [ref=e167] [cursor=pointer]:
              - radio "끄기" [ref=e168]
              - generic [ref=e169]: 끄기
          - generic [ref=e170]:
            - text: 내 문장 입력
            - textbox "내 문장 입력" [active] [ref=e171]: 가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가
            - paragraph [ref=e172]: 121 / 120자 · 앞뒤 공백은 정리합니다. 글자로만 표시합니다.
          - generic [ref=e173] [cursor=pointer]:
            - checkbox "완료 순간의 격려" [checked] [ref=e174]
            - generic [ref=e175]: 완료 순간의 격려
          - paragraph [ref=e176]: 직접 만든 일을 오늘 처음, 세 번째 마쳤을 때 한 번씩 안내합니다. 문구 끄기와 별도로 선택할 수 있습니다. 차분한 문구와 유머는 Focusday 창작 문구입니다.
        - paragraph [ref=e177]: 저장만 적용합니다. 취소·닫기·Escape는 저장하지 않은 초안을 버립니다.
      - generic [ref=e178]:
        - button "취소" [ref=e179] [cursor=pointer]
        - button "설정 저장" [ref=e180] [cursor=pointer]
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