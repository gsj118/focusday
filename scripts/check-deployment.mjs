import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const url = new URL(process.argv[2] || 'https://gsj118.github.io/focusday/')
const evidenceDir = process.env.SMOKE_OUTPUT_DIR
  ? `${process.env.SMOKE_OUTPUT_DIR}/evidence`
  : 'docs/evidence/v1.2'
const screenshotDir = process.env.SMOKE_OUTPUT_DIR
  ? `${process.env.SMOKE_OUTPUT_DIR}/screenshots`
  : 'docs/screenshots/v1.2'
assert.equal(url.protocol, 'https:')
const report = {
  appVersion: '1.2.0',
  url: url.href,
  checkedAt: new Date().toISOString(),
  deployedSourceCommit: process.env.LIVE_HEAD_SHA || null,
  platform: process.platform,
  browser: null,
  assets: [],
  screens: [],
  status: 'RUNNING',
}
await mkdir(evidenceDir, { recursive: true })
await mkdir(screenshotDir, { recursive: true })
const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || 'chrome',
  args: ['--force-device-scale-factor=1'],
})
report.browser = browser.version()
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      isMobile: name === 'mobile',
      hasTouch: name === 'mobile',
    })
    try {
      const page = await context.newPage()
      const failures = []
      page.on('pageerror', (error) => failures.push(error.message))
      page.on('requestfailed', (request) => failures.push(request.url()))
      page.on('response', (response) => {
        if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
      })
      const response = await page.goto(url.href, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      await expect(page).toHaveTitle(/Focusday/)
      await expect(page.getByLabel('새 할 일 제목')).toBeVisible()
      assert.equal(await page.evaluate(() => localStorage.length), 0)

      if (name === 'desktop') {
        const html = await response.text()
        const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((match) => match[1])
          .filter((path) => /\.(js|css|svg)(?:\?|$)/.test(path))
        assert(paths.some((path) => path.includes('.js')))
        assert(paths.some((path) => path.includes('.css')))
        assert(paths.some((path) => path.includes('favicon')))
        for (const path of paths) {
          const assetURL = new URL(path, url)
          assert.equal(assetURL.origin, url.origin)
          assert(assetURL.pathname.startsWith(url.pathname))
          const asset = await context.request.get(assetURL.href)
          assert.equal(asset.status(), 200)
          assert((await asset.body()).length > 0)
          assert(!asset.headers()['content-type']?.includes('text/html'))
          report.assets.push({ url: assetURL.href, status: asset.status() })
        }
      }

      const title = `공개 배포 검증 ${name}`
      const renamed = `${title} 수정`
      const input = page.getByLabel('새 할 일 제목')
      await input.fill(title)
      await input.press('Enter')
      await expect(page.getByText('저장됨', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: `${title} 편집`, exact: true }).click()
      await page.getByLabel('제목', { exact: true }).fill(renamed)
      await page.getByLabel('기한', { exact: true }).fill('2099-12-31')
      await page.getByLabel('우선순위').selectOption('high')
      await page.getByLabel('분류 선택').fill('배포 확인')
      await page.getByRole('button', { name: '저장', exact: true }).click()
      await page.reload({ waitUntil: 'networkidle' })
      const readTasks = () =>
        page.evaluate(() => JSON.parse(localStorage.getItem('focusday:v1')).tasks)
      let tasks = await readTasks()
      assert.equal(tasks.length, 1)
      assert.equal(tasks[0].title, renamed)
      assert.equal(tasks[0].dueDate, '2099-12-31')
      assert.equal(tasks[0].priority, 'high')
      assert.equal(tasks[0].category, '배포 확인')
      assert(tasks[0].focusDate)
      await page.getByRole('button', { name: `${renamed} 집중 해제`, exact: true }).click()
      await expect(page.getByRole('button', { name: `${renamed} 편집`, exact: true })).toHaveCount(
        0,
      )
      const nav = page.getByRole('navigation', {
        name: name === 'mobile' ? '모바일 보기' : '할 일 보기',
        exact: true,
      })
      await nav.getByRole('button', { name: /전체/ }).click()
      await page.getByRole('button', { name: `${renamed} 집중하기`, exact: true }).click()
      assert.equal((await readTasks())[0].dueDate, '2099-12-31')
      await nav.getByRole('button', { name: /오늘/ }).click()
      await page.getByRole('checkbox', { name: `${renamed} 완료`, exact: true }).click()
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      assert.equal((await readTasks())[0].completedAt, null)
      await page.getByRole('button', { name: `${renamed} 편집`, exact: true }).click()
      await page.getByRole('button', { name: '삭제', exact: true }).click()
      assert.equal((await readTasks()).length, 0)
      await page.getByRole('button', { name: '실행 취소', exact: true }).click()
      tasks = await readTasks()
      assert.equal(tasks[0].title, renamed)
      assert.equal(tasks[0].dueDate, '2099-12-31')
      await page.getByRole('button', { name: `${renamed} 편집`, exact: true }).click()
      await page.getByRole('button', { name: '삭제', exact: true }).click()
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal((await readTasks()).length, 0)
      await page.getByRole('button', { name: '예시로 둘러보기', exact: true }).last().click()
      assert.equal((await readTasks()).length, 5)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      await page.screenshot({ path: `${screenshotDir}/live-${name}.png` })
      await page.getByRole('button', { name: '발표 자료 최종 확인 편집', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const box = await page.getByRole('dialog').boundingBox()
      assert(box.x >= 0 && box.x + box.width <= width)
      await page.screenshot({ path: `${screenshotDir}/live-${name}-editor.png` })
      const editorOriginal = await readTasks()
      await page.getByLabel('분류 선택').fill('조합 초안')
      await page.getByLabel('분류 선택').dispatchEvent('compositionstart')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog')).toBeVisible()
      assert.deepEqual(await readTasks(), editorOriginal)
      await page.getByLabel('분류 선택').dispatchEvent('compositionend')
      await page.keyboard.press('Escape')
      await nav.getByRole('button', { name: /전체/ }).click()
      await page.getByRole('checkbox', { name: '주말 장보기 완료', exact: true }).click()
      const beforeExport = await readTasks()
      const menu = page.locator(name === 'mobile' ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
      await menu.locator('summary').click()
      await expect(menu.getByText('Focusday 1.2.0', { exact: true })).toBeVisible()
      await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
      const downloadedPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
      const downloaded = await downloadedPromise
      assert.match(downloaded.suggestedFilename(), /^focusday-backup-\d{4}-\d{2}-\d{2}\.json$/)
      const backupText = await readFile(await downloaded.path(), 'utf8')
      const backup = JSON.parse(backupText)
      assert.equal(backupText, JSON.stringify(backup))
      assert(Buffer.byteLength(backupText) <= 10 * 1024 * 1024)
      await downloaded.delete()
      assert.equal(backup.format, 'focusday-backup')
      assert.equal(backup.formatVersion, 1)
      assert.deepEqual(backup.data.tasks, beforeExport)
      assert.deepEqual(await readTasks(), beforeExport)
      const dates = await page.evaluate(() => {
        const day = (date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const today = new Date(),
          yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { today: day(today), yesterday: day(yesterday) }
      })
      const continuedTask = {
        id: `live-yesterday-${name}`,
        title: '어제 시작한 일 이어가기',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: '2099-12-31',
        focusDate: dates.yesterday,
        priority: 'medium',
        category: '개인',
        completedAt: null,
        isDemo: false,
      }
      await page.getByLabel('백업 파일 선택 / 다시 선택').setInputFiles({
        name: 'focusday-backup.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({
            ...backup,
            data: { version: 1, tasks: [...beforeExport, continuedTask] },
          }),
        ),
      })
      await expect(page.locator('.merge-summary')).toContainText('추가 1개 · 중복 id 유지 5개')
      await page.getByRole('button', { name: '합치기 적용', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `${screenshotDir}/live-${name}-restore.png` })
      await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
      await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
      assert.deepEqual(await readTasks(), [...beforeExport, continuedTask])
      await page.getByRole('button', { name: '목록으로 돌아가기', exact: true }).click()
      await nav.getByRole('button', { name: /오늘/ }).click()
      await expect(page.locator('.yesterday-note')).toContainText('어제 마치지 못한 일 1개')
      await page.screenshot({ path: `${screenshotDir}/live-${name}.png` })
      await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
      await expect(
        page.getByRole('dialog').getByText('어제 시작한 일 이어가기', { exact: true }),
      ).toBeVisible()
      await page.screenshot({ path: `${screenshotDir}/live-${name}-plan.png` })
      await page
        .getByRole('button', { name: '어제 시작한 일 이어가기 집중하기', exact: true })
        .click()
      const carried = (await readTasks()).find((task) => task.id === continuedTask.id)
      assert.equal(carried.focusDate, dates.today)
      assert.equal(carried.dueDate, continuedTask.dueDate)
      assert.equal(carried.id, continuedTask.id)
      assert.equal((await readTasks()).length, 6)
      await page.keyboard.press('Escape')
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(
        (await readTasks()).find((task) => task.id === continuedTask.id).focusDate,
        dates.today,
      )
      assert.deepEqual(failures, [])
      report.screens.push({
        name,
        viewport: { width, height },
        isMobile: name === 'mobile',
        checks: [
          'HTML/자산',
          '첫 빈 화면',
          '생성',
          '속성 편집',
          '새로고침 저장',
          '오늘/전체',
          '완료 취소',
          '삭제 취소',
          '예시',
          '가로 넘침/편집기',
          '앱 버전 1.2.0',
          '편집 조합 이벤트 Enter 무저장 (OS IME 제외)',
          'compact UTF-8 전체 백업, 10MiB 이내',
          'JSON 백업 모든 속성·완료·예시 보존',
          '복원 미리보기·id 합치기·저장',
          '오늘 계획·어제 이어가기 id/기한 유지',
          '실행 오류 없음',
        ],
        status: 'PASS',
      })
      console.log(`${name} ${width}×${height}: PASS`)
    } finally {
      await context.close()
    }
  }
  const largeContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
  })
  try {
    const tasks = Array.from({ length: 6000 }, (_, i) => ({
      id: `live-size-${i}`,
      title: '가'.repeat(200),
      createdAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
      dueDate: null,
      focusDate: null,
      category: null,
      completedAt: null,
      priority: 'none',
      isDemo: false,
    }))
    await largeContext.addInitScript(
      (raw) => {
        const get = Storage.prototype.getItem
        Storage.prototype.getItem = function (key) {
          return key === 'focusday:v1' ? raw : get.call(this, key)
        }
      },
      JSON.stringify({ version: 1, tasks }),
    )
    const largePage = await largeContext.newPage()
    const errors = []
    largePage.on('pageerror', (error) => errors.push(error.message))
    await largePage.goto(url.href, { waitUntil: 'networkidle' })
    await largePage.locator('.sidebar summary').click()
    await largePage
      .locator('.sidebar')
      .getByRole('button', { name: '백업·복원', exact: true })
      .click()
    const pending = largePage.waitForEvent('download')
    await largePage.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
    const file = await pending,
      text = await readFile(await file.path(), 'utf8')
    await file.delete()
    assert.deepEqual(JSON.parse(text).data.tasks, tasks)
    assert(Buffer.byteLength(text) <= 10 * 1024 * 1024)
    await largePage
      .locator('#backup-file')
      .setInputFiles({
        name: 'self-backup-6000.json',
        mimeType: 'application/json',
        buffer: Buffer.from(text),
      })
    await expect(largePage.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
    await expect(
      largePage.getByText('백업 전체 6000개 · 미완료 6000개 · 완료 0개', { exact: true }),
    ).toBeVisible()
    await largePage.screenshot({ path: `${screenshotDir}/live-backup-6000.png` })
    assert.deepEqual(errors, [])
    report.backupBoundary = {
      taskCount: 6000,
      bytes: Buffer.byteLength(text),
      status: 'PASS',
      storageQuotaTested: false,
      rendered6000List: false,
      method: 'Isolated read port + actual live UI download/re-import preview; no apply',
    }
    console.log(
      'public 6000-task download/re-import preview: PASS (quota/list performance excluded)',
    )
  } finally {
    await largeContext.close()
  }
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAIL'
  report.error = String(error)
  throw error
} finally {
  await browser.close()
  await writeFile(`${evidenceDir}/live-deployment.json`, `${JSON.stringify(report, null, 2)}\n`)
}
