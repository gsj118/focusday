# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> 키보드 추가→편집→저장→완료→실행 취소, dialog trap·Escape·포커스 복귀
- Location: tests\e2e\app.spec.ts:357:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: '실행 취소', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: '실행 취소', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: '실행 취소', exact: true })
    14 × locator resolved to <button>실행 취소</button>
       - unexpected value "inactive"

```

```yaml
- button "실행 취소"
```

# Test source

```ts
  288 |   expect(await readTasks(page)).toHaveLength(1)
  289 |   await page.getByRole('button', { name: '다시 읽기' }).click()
  290 |   expect((await readTasks(page)).map((t) => t.title)).toEqual(['기존 사용자', '임시 항목'])
  291 | })
  292 | test('localStorage 접근 자체 실패도 빈 값으로 덮어쓰지 않는다', async ({ page }) => {
  293 |   await page.addInitScript(() =>
  294 |     Object.defineProperty(window, 'localStorage', {
  295 |       configurable: true,
  296 |       get() {
  297 |         throw new DOMException('denied', 'SecurityError')
  298 |       },
  299 |     }),
  300 |   )
  301 |   await page.goto('./')
  302 |   await add(page, '접근 실패 항목')
  303 |   await expect(page.getByRole('alert')).toContainText('기존 데이터 보호')
  304 |   await page.getByRole('button', { name: '다시 읽기' }).click()
  305 |   await expect(page.getByRole('alert')).toBeVisible()
  306 | })
  307 | test('예시 선택·중복 방지·검색 현재 보기·완료 검색·예시 제거 사용자 보존', async ({ page }) => {
  308 |   await page.goto('./')
  309 |   await add(page, '실제 사용자')
  310 |   await page.locator('.sidebar .app-menu summary').click()
  311 |   await page
  312 |     .locator('.sidebar .app-menu')
  313 |     .getByRole('button', { name: '예시로 둘러보기', exact: true })
  314 |     .click()
  315 |   expect(await readTasks(page)).toHaveLength(6)
  316 |   await page
  317 |     .locator('.sidebar .app-menu')
  318 |     .getByRole('button', { name: '예시로 둘러보기', exact: true })
  319 |     .click()
  320 |   expect(await readTasks(page)).toHaveLength(6)
  321 |   await page.getByLabel('제목·분류 검색').fill('주말')
  322 |   await expect(page.getByText('검색 결과 0개', { exact: false })).toBeVisible()
  323 |   await all(page)
  324 |   await expect(page.getByText('검색 결과 1개', { exact: false })).toBeVisible()
  325 |   await page.getByRole('checkbox', { name: '주말 장보기 완료', exact: true }).click()
  326 |   await expect(
  327 |     page.getByRole('checkbox', { name: '주말 장보기 미완료로 복원', exact: true }),
  328 |   ).toBeVisible()
  329 |   await page.getByRole('button', { name: '검색 지우기', exact: true }).first().click()
  330 |   await page.getByLabel('제목·분류 검색').fill('존재하지않음')
  331 |   await expect(page.getByRole('heading', { name: '일치하는 할 일이 없습니다' })).toBeVisible()
  332 |   await page
  333 |     .locator('.sidebar .app-menu')
  334 |     .getByRole('button', { name: '예시 데이터 제거', exact: true })
  335 |     .click()
  336 |   expect((await readTasks(page)).map((t) => t.title)).toEqual(['실제 사용자'])
  337 | })
  338 | test('200개 기본 검색·편집·완료·스크롤', async ({ page }) => {
  339 |   await seed(
  340 |     page,
  341 |     Array.from({ length: 200 }, (_, i) =>
  342 |       task(`할일-${String(i).padStart(3, '0')}`, { focusDate: today }),
  343 |     ),
  344 |   )
  345 |   await page.goto('./')
  346 |   await expect(page.locator('.task-row')).toHaveCount(200)
  347 |   await page.locator('.task-row').last().scrollIntoViewIfNeeded()
  348 |   await expect(page.locator('.task-row').last()).toBeInViewport()
  349 |   await page.getByLabel('제목·분류 검색').fill('할일-199')
  350 |   await expect(page.locator('.task-row')).toHaveCount(1)
  351 |   await page.getByRole('button', { name: '할일-199 편집', exact: true }).click()
  352 |   await page.getByLabel('분류 선택').fill('정리')
  353 |   await page.getByRole('button', { name: '저장', exact: true }).click()
  354 |   await page.getByRole('checkbox', { name: '할일-199 완료', exact: true }).click()
  355 |   expect((await readTasks(page)).find((t) => t.id === '할일-199')!.category).toBe('정리')
  356 | })
  357 | test('키보드 추가→편집→저장→완료→실행 취소, dialog trap·Escape·포커스 복귀', async ({ page }) => {
  358 |   await page.goto('./')
  359 |   await page.keyboard.press('n')
  360 |   await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  361 |   await page.keyboard.type('Keyboard task')
  362 |   await page.keyboard.press('Enter')
  363 |   await page.keyboard.press('Tab')
  364 |   await page.keyboard.press('Tab')
  365 |   await expect(
  366 |     page.getByRole('checkbox', { name: 'Keyboard task 완료', exact: true }),
  367 |   ).toBeFocused()
  368 |   await page.keyboard.press('Tab')
  369 |   await page.keyboard.press('Enter')
  370 |   await expect(page.getByLabel('제목', { exact: true })).toBeFocused()
  371 |   await page.getByLabel('제목', { exact: true }).fill('취소될 초안')
  372 |   await page.keyboard.press('Escape')
  373 |   await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeFocused()
  374 |   await page.keyboard.press('Enter')
  375 |   await page.keyboard.press('Shift+Tab')
  376 |   await expect(page.getByRole('button', { name: '편집 닫기' })).toBeFocused()
  377 |   await page.keyboard.press('Shift+Tab')
  378 |   await expect(page.getByRole('button', { name: '저장', exact: true })).toBeFocused()
  379 |   await page.keyboard.press('Enter')
  380 |   await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeFocused()
  381 |   await page.keyboard.press('Shift+Tab')
  382 |   await page.keyboard.press('Space')
  383 |   await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
  384 |   await page.keyboard.press('Tab')
  385 |   await page.keyboard.press('Tab')
  386 |   await page.keyboard.press('Tab')
  387 |   await page.keyboard.press('Tab')
> 388 |   await expect(page.getByRole('button', { name: '실행 취소', exact: true })).toBeFocused()
      |                                                                          ^ Error: expect(locator).toBeFocused() failed
  389 |   await page.keyboard.press('Enter')
  390 |   await expect(page.getByRole('button', { name: 'Keyboard task 편집', exact: true })).toBeVisible()
  391 | })
  392 | 
  393 | for (const [width, height] of [
  394 |   [1440, 900],
  395 |   [1366, 768],
  396 |   [390, 844],
  397 |   [320, 740],
  398 | ])
  399 |   test(`화면 ${width}×${height}·overflow·편집·스크린샷`, async ({ page }) => {
  400 |     await page.setViewportSize({ width, height })
  401 |     await page.goto('./')
  402 |     await demo(page)
  403 |     await expect(page.locator('.task-row')).toHaveCount(3)
  404 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  405 |     if (width < 900) {
  406 |       await expect(page.getByRole('navigation', { name: '모바일 보기' })).toBeVisible()
  407 |       expect(
  408 |         (await page.getByRole('button', { name: '+ 할 일 추가', exact: true }).boundingBox())!
  409 |           .height,
  410 |       ).toBeGreaterThanOrEqual(44)
  411 |     }
  412 |     await page.screenshot({
  413 |       path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.4/regression'}/${width === 1440 ? 'desktop' : width === 390 ? 'mobile' : `layout-${width}`}.png`,
  414 |       fullPage: true,
  415 |     })
  416 |     await page.getByRole('button', { name: '발표 자료 최종 확인 편집', exact: true }).click()
  417 |     await expect(page.getByRole('dialog')).toBeVisible()
  418 |     expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
  419 |       true,
  420 |     )
  421 |     const box = (await page.getByRole('dialog').boundingBox())!
  422 |     expect(box.x).toBeGreaterThanOrEqual(0)
  423 |     expect(box.x + box.width).toBeLessThanOrEqual(width)
  424 |     await page.screenshot({
  425 |       path: `${process.env.FOCUSDAY_SCREENSHOTS || 'docs/screenshots/v1.4/regression'}/${width === 1440 ? 'desktop-editor' : width === 390 ? 'mobile-editor' : `editor-${width}`}.png`,
  426 |       fullPage: true,
  427 |     })
  428 |     await page.getByLabel('제목', { exact: true }).fill('긴한글제목'.repeat(40))
  429 |     await page.getByRole('button', { name: '저장', exact: true }).click()
  430 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  431 |     await page.getByRole('button', { name: `${'긴한글제목'.repeat(40)} 편집`, exact: true }).click()
  432 |     await page.getByRole('button', { name: '취소', exact: true }).click()
  433 |   })
  434 | test('reduced-motion·실제 토큰 대비·production 자산 응답', async ({ page }) => {
  435 |   await page.emulateMedia({ reducedMotion: 'reduce' })
  436 |   const errors: string[] = []
  437 |   page.on('pageerror', (e) => errors.push(e.message))
  438 |   const failures: string[] = []
  439 |   page.on('response', (r) => {
  440 |     if (r.status() >= 400) failures.push(r.url())
  441 |   })
  442 |   await page.goto('./')
  443 |   await demo(page)
  444 |   expect(
  445 |     await page
  446 |       .getByRole('button', { name: '추가', exact: true })
  447 |       .evaluate((el) => getComputedStyle(el).transitionDuration),
  448 |   ).toBe('0s')
  449 |   const pairs = await page.evaluate(() => {
  450 |     const css = getComputedStyle(document.documentElement)
  451 |     return [
  452 |       ['--text', '--surface'],
  453 |       ['--muted', '--sidebar'],
  454 |       ['--on-accent', '--accent'],
  455 |       ['--on-accent', '--focus'],
  456 |       ['--danger', '--surface'],
  457 |       ['--focus', '--soft'],
  458 |       ['--muted', '--hover'],
  459 |       ['--warning', '--surface'],
  460 |       ['--toast-action', '--toast-bg'],
  461 |     ].map((pair) => pair.map((token) => css.getPropertyValue(token).trim()))
  462 |   })
  463 |   const luminance = (hex: string) =>
  464 |     (hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex)
  465 |       .slice(1)
  466 |       .match(/../g)!
  467 |       .map((v) => parseInt(v, 16) / 255)
  468 |       .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  469 |       .reduce((acc, n, i) => acc + n * [0.2126, 0.7152, 0.0722][i], 0)
  470 |   for (const [fg, bg] of pairs) {
  471 |     const a = luminance(fg),
  472 |       b = luminance(bg)
  473 |     expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5)
  474 |   }
  475 |   expect(errors).toEqual([])
  476 |   expect(failures).toEqual([])
  477 | })
  478 | 
```