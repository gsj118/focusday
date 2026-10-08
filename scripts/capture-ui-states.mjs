import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const url = process.argv[2] || 'http://127.0.0.1:4173/'
const dir = 'docs/screenshots/v1.3/after'
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' })
const report = { url, checkedAt: new Date().toISOString(), browser: browser.version(), states: [] }
try {
  for (const width of [1440, 320]) {
    const viewport = { width, height: width === 1440 ? 900 : 568 }
    const context = await browser.newContext({
      viewport,
      timezoneId: 'Asia/Seoul',
      locale: 'ko-KR',
    })
    const page = await context.newPage()
    const shot = async (name) => {
      await page.mouse.move(0, 0)
      await page.screenshot({ path: `${dir}/${name}-${width}.png` })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      report.states.push({ name, viewport, overflow: false })
    }
    await page.goto(url)
    await page.getByLabel('새 할 일 제목').fill('검수용 새 할 일')
    await page.getByLabel('새 할 일 제목').press('Enter')
    await page.getByRole('button', { name: '오늘 계획하기', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: '지금 살펴볼 계획 후보가 없습니다' }),
    ).toBeVisible()
    await shot('plan-empty')
    await page.keyboard.press('Escape')
    await page.getByLabel('제목·분류 검색').fill('존재하지 않는 검색어')
    await shot('no-results')
    await page.getByRole('button', { name: '검색 지우기', exact: true }).first().click()
    await page.getByRole('checkbox', { name: '검수용 새 할 일 완료', exact: true }).click()
    await shot('undo')
    await page.getByRole('button', { name: '실행 취소', exact: true }).click()
    const menu = page.locator(width < 900 ? '.mobile-menu .app-menu' : '.sidebar .app-menu')
    await menu.locator('summary').click()
    await shot('app-menu')
    await menu.getByRole('button', { name: '백업·복원', exact: true }).click()
    await page.locator('#backup-file').setInputFiles({
      name: 'empty-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          format: 'focusday-backup',
          formatVersion: 1,
          exportedAt: new Date().toISOString(),
          data: { version: 1, tasks: [] },
        }),
      ),
    })
    await page.getByRole('radio', { name: '백업으로 전체 교체', exact: true }).check()
    await page.getByRole('button', { name: '전체 교체 확인으로 이동', exact: true }).click()
    await shot('replace-confirm')
    await page.getByRole('button', { name: '교체 취소', exact: true }).click()
    await page.getByRole('radio', { name: '기존 데이터에 합치기', exact: true }).check()
    await page.evaluate(() => {
      const original = Storage.prototype.setItem
      window.__uiFail = true
      Storage.prototype.setItem = function (k, v) {
        if (k === 'focusday:v1' && window.__uiFail)
          throw new DOMException('test-only', 'QuotaExceededError')
        original.call(this, k, v)
      }
    })
    const original = await page.evaluate(() => localStorage.getItem('focusday:v1'))
    await page.getByRole('button', { name: '합치기 적용', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('적용 전 목록과 저장 원본을 유지')
    assert.equal(await page.evaluate(() => localStorage.getItem('focusday:v1')), original)
    await shot('restore-failure')
    await page.evaluate(() => {
      window.__uiFail = false
    })
    await page.getByRole('button', { name: '합치기 다시 시도', exact: true }).click()
    await expect(page.getByRole('heading', { name: '복원 완료', exact: true })).toBeVisible()
    await shot('restore-success')
    await context.close()
    for (const kind of ['save-failure', 'storage-protection']) {
      const failureContext = await browser.newContext({
        viewport,
        timezoneId: 'Asia/Seoul',
        locale: 'ko-KR',
      })
      await failureContext.addInitScript((kind) => {
        if (kind === 'storage-protection') localStorage.setItem('focusday:v1', '{synthetic-corrupt')
        else {
          const original = Storage.prototype.setItem
          Storage.prototype.setItem = function (k, v) {
            if (k === 'focusday:v1') throw new DOMException('test-only', 'QuotaExceededError')
            original.call(this, k, v)
          }
        }
      }, kind)
      const failurePage = await failureContext.newPage()
      await failurePage.goto(url)
      await failurePage.getByLabel('새 할 일 제목').fill('저장 오류 중 메모리 작업')
      await failurePage.getByLabel('새 할 일 제목').press('Enter')
      await failurePage.getByRole('alert').scrollIntoViewIfNeeded()
      await failurePage.screenshot({ path: `${dir}/${kind}-${width}.png` })
      report.states.push({ name: kind, viewport, isolated: true })
      await failureContext.close()
    }
  }
} finally {
  await browser.close()
  await writeFile('docs/evidence/v1.3/ui-states.json', JSON.stringify(report, null, 2) + '\n')
}
console.log('Captured isolated UI states: ' + report.states.length)
