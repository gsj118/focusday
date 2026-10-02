import { describe, expect, it } from 'vitest'
import {
  createBackup,
  dataCounts,
  MAX_BACKUP_BYTES,
  parseBackup,
  prepareRestore,
} from '../../src/backup'
import { createTask, type AppData, type Task } from '../../src/domain'
import { isAppData } from '../../src/storage'

const make = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask('제목', 'all', '2026-10-02', '2026-10-02T00:00:00.000Z', id),
  ...extra,
})
const data: AppData = {
  version: 1,
  tasks: [
    make('user', {
      focusDate: '2026-10-01',
      dueDate: '2026-10-03',
      priority: 'high',
      category: '업무',
    }),
    make('done-demo', { completedAt: '2026-10-02T01:00:00.000Z', isDemo: true }),
  ],
}
describe('백업 검증과 순수 복원 준비', () => {
  it('정식 백업 round trip은 모든 속성·완료·예시를 보존', () => {
    const parsed = parseBackup(JSON.stringify(createBackup(data, '2026-10-02T02:00:00.000Z')))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.backup.data).toEqual(data)
    expect(dataCounts(data)).toEqual({ total: 2, unfinished: 1, completed: 1 })
  })
  it.each(['{bad', 'null', '[]', '{"version":1,"tasks":[]}'])(
    '손상과 raw 원본은 정식 백업 아님: %s',
    (text) => expect(parseBackup(text).ok).toBe(false),
  )
  it('format·백업/데이터 version·exportedAt 검증', () => {
    const valid = createBackup(data)
    for (const bad of [
      { ...valid, format: 'other' },
      { ...valid, formatVersion: 2 },
      { ...valid, exportedAt: '2026-02-30T00:00:00.000Z' },
      { ...valid, data: { ...data, version: 2 } },
    ])
      expect(parseBackup(JSON.stringify(bad)).ok).toBe(false)
  })
  it('로드와 같은 필드·날짜·timestamp·길이·id 중복 허용 기준', () => {
    for (const task of [
      make('x', { dueDate: '2026-02-30' }),
      make('x', { focusDate: 'invalid' }),
      make('x', { updatedAt: '2026-10-02T24:00:00.000Z' }),
      make('x', { title: '가'.repeat(201) }),
      make('x', { category: 'a'.repeat(25) }),
      make('x', { priority: 'bad' as Task['priority'] }),
      make('x', { isDemo: 'yes' as unknown as boolean }),
    ]) {
      const invalid = { version: 1 as const, tasks: [task] }
      expect(isAppData(invalid)).toBe(false)
      expect(parseBackup(JSON.stringify(createBackup(invalid))).ok).toBe(false)
    }
    expect(
      parseBackup(JSON.stringify(createBackup({ version: 1, tasks: [make('x'), make('x')] }))).ok,
    ).toBe(false)
  })
  it('5MiB 제한은 문자 수가 아닌 UTF-8 byte 크기', () => {
    expect(parseBackup('{}', MAX_BACKUP_BYTES + 1)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('5MiB'),
    })
    const oversized = JSON.stringify(createBackup({ version: 1, tasks: [] })).replace(
      'focusday-backup',
      '가'.repeat(MAX_BACKUP_BYTES / 2),
    )
    expect(parseBackup(oversized)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('5MiB'),
    })
  })
  it('id 기준 합치기·현재 내용 보존·다른 id 같은 제목 추가·충돌 수·입력 불변', () => {
    const current: AppData = {
      version: 1,
      tasks: [make('same', { category: '현재' }), make('identical')],
    }
    const incoming: AppData = {
      version: 1,
      tasks: [make('same', { category: '백업' }), make('identical'), make('new')],
    }
    const before = JSON.stringify([current, incoming])
    const prepared = prepareRestore(current, incoming, 'merge')
    expect(prepared).toMatchObject({ added: 1, duplicates: 2, conflicts: 1 })
    expect(prepared.data.tasks.map((t) => t.id)).toEqual(['same', 'identical', 'new'])
    expect(prepared.data.tasks[0].category).toBe('현재')
    expect(JSON.stringify([current, incoming])).toBe(before)
    expect(prepareRestore(incoming, current, 'replace').data).toEqual(current)
  })
  it('필드 순서 차이는 내용 충돌이 아님·빈 백업 합치기와 교체', () => {
    const original = make('x')
    const reversed = Object.fromEntries(Object.entries(original).reverse()) as Task
    expect(
      prepareRestore({ version: 1, tasks: [original] }, { version: 1, tasks: [reversed] }, 'merge')
        .conflicts,
    ).toBe(0)
    expect(prepareRestore(data, { version: 1, tasks: [] }, 'merge').data).toEqual(data)
    expect(prepareRestore(data, { version: 1, tasks: [] }, 'replace').data.tasks).toEqual([])
  })
})
