import { expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { createBackup, parseBackup, serializeBackup, MAX_BACKUP_BYTES } from '../../src/backup'
import { createTask, type AppData } from '../../src/domain'

it('SB-01: 6000개 200자 한글 자체 백업의 재가져오기', () => {
  const data: AppData = {
    version: 1,
    tasks: Array.from({ length: 6000 }, (_, i) =>
      createTask('가'.repeat(200), 'all', '2026-10-02', '2026-10-02T00:00:00.000Z', `beta-${i}`),
    ),
  }
  const padded = JSON.stringify(createBackup(data, '2026-10-02T00:00:00.000Z'), null, 2)
  const compact = JSON.stringify(createBackup(data, '2026-10-02T00:00:00.000Z'))
  const paddedResult = parseBackup(padded)
  const compactResult = parseBackup(compact)
  if (process.env.BETA_PHASE === 'before')
    writeFileSync(
      'docs/evidence/v1.4/backup-boundary-before.json',
      JSON.stringify(
        {
          caseId: 'E11',
          issueId: 'SB-01',
          sourceCommit: '7ff35e73632fdb43f1452722c553da95a79e19d7',
          checkedAt: new Date().toISOString(),
          evidenceKind: 'pure data; no storage quota or UI performance claim',
          fixture:
            '6000 beta-N ids, 200 Korean 가 title, valid fixed timestamps, null optional fields, priority none, isDemo false',
          taskCount: data.tasks.length,
          paddedBytes: Buffer.byteLength(padded),
          compactBytes: Buffer.byteLength(compact),
          paddedResult,
          compactResult: compactResult.ok ? { ok: true } : compactResult,
          status: paddedResult.ok ? 'PASS' : 'FAIL',
        },
        null,
        2,
      ),
    )
  expect(paddedResult.ok, '앱이 다운로드하는 들여쓰기 백업은 재가져올 수 있어야 한다').toBe(true)
  expect(compactResult.ok).toBe(true)
  if (compactResult.ok) expect(compactResult.backup.data).toEqual(data)
  if (process.env.BETA_PHASE !== 'before')
    writeFileSync(
      'docs/evidence/v1.4/backup-boundary-after.json',
      JSON.stringify(
        {
          caseId: 'E11',
          checkedAt: new Date().toISOString(),
          taskCount: 6000,
          paddedBytes: Buffer.byteLength(padded),
          compactBytes: Buffer.byteLength(compact),
          limitBytes: MAX_BACKUP_BYTES,
          paddedAccepted: paddedResult.ok,
          compactAccepted: compactResult.ok,
          taskFieldsPreserved:
            compactResult.ok && JSON.stringify(compactResult.backup.data) === JSON.stringify(data),
          quotaTested: false,
          status: 'PASS',
        },
        null,
        2,
      ),
    )
})
it('기존 5MiB를 넘는 자체 compact 백업도 전체 속성 round trip', () => {
  const tasks = Array.from({ length: 7000 }, (_, i) => ({
    ...createTask('가'.repeat(200), 'all', '2026-10-02', '2026-10-02T00:00:00.000Z', `beta-${i}`),
    isDemo: i === 0,
    completedAt: i === 1 ? '2026-10-02T01:00:00.000Z' : null,
  }))
  const before = JSON.stringify(tasks),
    result = serializeBackup({ version: 1, tasks })
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.byteSize).toBeGreaterThan(5 * 1024 * 1024)
    expect(result.byteSize).toBe(Buffer.byteLength(result.content))
    const parsed = parseBackup(result.content)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.backup.data.tasks).toEqual(tasks)
  }
  expect(JSON.stringify(tasks)).toBe(before)
})
it('UTF-8 정확히 10MiB는 허용, 1byte 초과는 거부', () => {
  const valid = JSON.stringify(createBackup({ version: 1, tasks: [] }))
  const boundary = valid + ' '.repeat(MAX_BACKUP_BYTES - Buffer.byteLength(valid))
  expect(Buffer.byteLength(boundary)).toBe(MAX_BACKUP_BYTES)
  expect(parseBackup(boundary).ok).toBe(true)
  expect(parseBackup(boundary + ' ').ok).toBe(false)
})
it('한도를 넘는 메모리 전체 데이터는 내보내기 중단, 부분 백업/입력 변경 없음', () => {
  const data: AppData = {
    version: 1,
    tasks: Array.from({ length: 20000 }, (_, i) =>
      createTask('가'.repeat(200), 'all', '2026-10-02', '2026-10-02T00:00:00.000Z', `large-${i}`),
    ),
  }
  const original = JSON.stringify(data),
    result = serializeBackup(data)
  expect(result.ok).toBe(false)
  expect(result.byteSize).toBeGreaterThan(MAX_BACKUP_BYTES)
  expect(result).not.toHaveProperty('content')
  expect(JSON.stringify(data)).toBe(original)
})
