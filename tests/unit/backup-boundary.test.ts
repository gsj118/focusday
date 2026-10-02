import { expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { createBackup, parseBackup } from '../../src/backup'
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
      'docs/evidence/v1.2/backup-boundary-before.json',
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
})
