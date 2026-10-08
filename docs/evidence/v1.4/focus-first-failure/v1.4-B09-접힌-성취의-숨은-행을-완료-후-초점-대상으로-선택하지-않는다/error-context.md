# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: v1.4.spec.ts >> B09 접힌 성취의 숨은 행을 완료 후 초점 대상으로 선택하지 않는다
- Location: tests\e2e\v1.4.spec.ts:1047:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByLabel('새 할 일 제목')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByLabel('새 할 일 제목') with timeout 5000ms
  - waiting for getByLabel('새 할 일 제목')
    14 × locator resolved to <input value="" maxlength="200" id="quick-title" autocomplete="off" aria-invalid="false" placeholder="무엇을 해야 하나요?" aria-describedby="quick-hint"/>
       - unexpected value "inactive"

```

```yaml
- textbox "새 할 일 제목":
  - /placeholder: 무엇을 해야 하나요?
```

# Test source

```ts
  951  |   await page.keyboard.press('Escape')
  952  |   await expect(sentence(page)).toHaveText(dailySentence(day, 'humor'))
  953  | })
  954  | 
  955  | test('B05 설정 초기화 쓰기 실패는 손상 원본과 할 일을 보호, 재시도 성공만 적용', async ({
  956  |   page,
  957  | }) => {
  958  |   await seed(page, [make('원본 할 일')], '{broken')
  959  |   await page.addInitScript(() => {
  960  |     Object.assign(window, { v14ResetFail: true })
  961  |     const set = Storage.prototype.setItem
  962  |     Storage.prototype.setItem = function (key, value) {
  963  |       if (key === 'focusday:ui:v1' && (window as unknown as { v14ResetFail: boolean }).v14ResetFail)
  964  |         throw new Error('write denied')
  965  |       return set.call(this, key, value)
  966  |     }
  967  |   })
  968  |   await page.goto('./')
  969  |   const original = await tasks(page)
  970  |   await open(page)
  971  |   await page.getByRole('button', { name: '설정만 초기화…', exact: true }).click()
  972  |   await page.getByRole('button', { name: '설정 원본 초기화 확인', exact: true }).click()
  973  |   expect(await page.evaluate(() => localStorage.getItem('focusday:ui:v1'))).toBe('{broken')
  974  |   expect(await tasks(page)).toEqual(original)
  975  |   await page.evaluate(() => Object.assign(window, { v14ResetFail: false }))
  976  |   await page.getByRole('button', { name: '설정 원본 초기화 확인', exact: true }).click()
  977  |   expect(await prefs(page)).toEqual(defaultPreferences())
  978  |   expect(await tasks(page)).toEqual(original)
  979  | })
  980  | 
  981  | test('B06 격려 표시 저장 실패는 세션 중복만 보장하며 새로고침 후 저장 상태에 의존', async ({
  982  |   page,
  983  | }) => {
  984  |   await seed(page, [make('표시 저장 실패', { focusDate: day })])
  985  |   await page.addInitScript(() => {
  986  |     const set = Storage.prototype.setItem
  987  |     Storage.prototype.setItem = function (key, value) {
  988  |       if (key === 'focusday:ui:v1') throw new Error('quota')
  989  |       return set.call(this, key, value)
  990  |     }
  991  |   })
  992  |   await page.goto('./')
  993  |   await complete(page, '표시 저장 실패')
  994  |   await expect(cheer(page)).toHaveCount(1)
  995  |   await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  996  |   await complete(page, '표시 저장 실패')
  997  |   await expect(cheer(page)).toHaveCount(0)
  998  |   await page.getByRole('button', { name: '실행 취소', exact: true }).click()
  999  |   expect(await prefs(page)).toBeNull()
  1000 |   await page.reload()
  1001 |   await complete(page, '표시 저장 실패')
  1002 |   await expect(cheer(page)).toHaveCount(1)
  1003 | })
  1004 | 
  1005 | test('B07 검수 수정: 768px 전체폭 시트·재시도된 적용 설정과 미저장 초안 구별', async ({ page }) => {
  1006 |   await page.setViewportSize({ width: 768, height: 1024 })
  1007 |   await page.addInitScript(() => {
  1008 |     Object.assign(window, { v14RetryFail: true })
  1009 |     const set = Storage.prototype.setItem
  1010 |     Storage.prototype.setItem = function (key, value) {
  1011 |       if (key === 'focusday:ui:v1' && (window as unknown as { v14RetryFail: boolean }).v14RetryFail)
  1012 |         throw new Error('quota')
  1013 |       return set.call(this, key, value)
  1014 |     }
  1015 |   })
  1016 |   await page.goto('./')
  1017 |   await open(page)
  1018 |   const panelBox = await page.getByRole('dialog').boundingBox()
  1019 |   expect(panelBox!.width).toBe(768)
  1020 |   await page.getByRole('radio', { name: '유머', exact: true }).check()
  1021 |   await page.getByRole('button', { name: '설정 저장', exact: true }).click()
  1022 |   await page.evaluate(() => Object.assign(window, { v14RetryFail: false }))
  1023 |   await page
  1024 |     .locator('.storage-banner')
  1025 |     .getByRole('button', { name: '설정 저장 재시도', exact: true })
  1026 |     .click()
  1027 |   await expect(page.locator('.panel-feedback')).toContainText('편집 중인 초안은 별도로')
  1028 |   await expect(page.getByRole('radio', { name: '유머', exact: true })).toBeChecked()
  1029 |   expect((await prefs(page))?.sentenceMode).toBe('calm')
  1030 |   const feedbackBox = await page.locator('.panel-feedback').boundingBox()
  1031 |   expect(feedbackBox!.y + feedbackBox!.height).toBeLessThanOrEqual(1024)
  1032 |   await saveSettings(page)
  1033 |   expect((await prefs(page))?.sentenceMode).toBe('humor')
  1034 | })
  1035 | 
  1036 | test('B08 성취 행에 초점이 있을 때 날짜 변경으로 모두 사라져도 summary 복귀', async ({ page }) => {
  1037 |   await seed(page, [make('날짜 변경 초점', { completedAt: stamp })])
  1038 |   await page.goto('./')
  1039 |   await summary(page).click()
  1040 |   await page.getByRole('checkbox', { name: '날짜 변경 초점 미완료로 복원', exact: true }).focus()
  1041 |   await page.clock.setSystemTime(new Date('2026-10-09T10:00:00+09:00'))
  1042 |   await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  1043 |   await expect(summary(page)).toHaveText('오늘 마친 일 0개')
  1044 |   await expect(summary(page)).toBeFocused()
  1045 | })
  1046 | 
  1047 | test('B09 접힌 성취의 숨은 행을 완료 후 초점 대상으로 선택하지 않는다', async ({ page }) => {
  1048 |   await seed(page, [make('마지막 미완료', { focusDate: day }), make('접힌 완료', { completedAt: stamp })])
  1049 |   await page.goto('./')
  1050 |   await complete(page, '마지막 미완료')
> 1051 |   await expect(page.getByLabel('새 할 일 제목')).toBeFocused()
       |                                             ^ Error: expect(locator).toBeFocused() failed
  1052 |   await expect(summary(page)).toHaveText('오늘 마친 일 2개')
  1053 | })
  1054 | 
```