import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createTask } from '../../src/domain'
import { createBackup, MAX_BACKUP_BYTES } from '../../src/backup'

test('P10 E11: 6000개 자체 다운로드→같은 파일 UI 미리보기 (quota/목록 성능 제외)', async ({
  page,
}, info) => {
  const tasks = Array.from({ length: 6000 }, (_, i) =>
    createTask('가'.repeat(200), 'all', '2026-10-02', '2026-10-02T00:00:00.000Z', `beta-${i}`),
  )
  const raw = JSON.stringify({ version: 1, tasks })
  // A read port in an isolated context models in-memory data beyond quota. No setItem/quota success claim.
  await page.addInitScript((raw) => {
    const get = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      return key === 'focusday:v1' ? raw : get.call(this, key)
    }
  }, raw)
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+09:00') })
  await page.goto('./')
  await page.locator('.sidebar .app-menu summary').click()
  await page.locator('.sidebar').getByRole('button', { name: '백업·복원', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON 백업 다운로드', exact: true }).click()
  const download = await pending,
    text = await readFile((await download.path())!, 'utf8')
  await download.delete()
  expect(JSON.parse(text).data.tasks).toEqual(tasks)
  await page
    .locator('#backup-file')
    .setInputFiles({
      name: 'self-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    })
  const phase = process.env.BETA_PHASE || 'after'
  await page.screenshot({ path: `docs/screenshots/v1.2/${phase}/backup-6000.png` })
  await info.attach('backup-size', {
    body: Buffer.from(
      JSON.stringify({
        caseId: 'E11',
        phase,
        checkedAt: new Date().toISOString(),
        taskCount: 6000,
        bytes: Buffer.byteLength(text),
        limitBytes: MAX_BACKUP_BYTES,
        quotaTested: false,
        rendered6000List: false,
      }),
    ),
    contentType: 'application/json',
  })
  await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
  await expect(
    page.getByText('백업 전체 6000개 · 미완료 6000개 · 완료 0개', { exact: true }),
  ).toBeVisible()
  if (phase !== 'before') {
    // Legacy padded v1.1 exports remain accepted under the explicitly increased bound.
    await page
      .locator('#backup-file')
      .setInputFiles({
        name: 'legacy-padded.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(createBackup({ version: 1, tasks }), null, 2)),
      })
    await expect(page.getByRole('heading', { name: '복원 미리보기' })).toBeVisible()
  }
})
