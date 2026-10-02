import type { AppData, Task } from './domain'
import { isAppData, isTimestamp } from './storage'

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
export type Backup = {
  format: 'focusday-backup'
  formatVersion: 1
  exportedAt: string
  data: AppData
}
export type RestoreMode = 'merge' | 'replace'
export function createBackup(data: AppData, now = new Date().toISOString()): Backup {
  return { format: 'focusday-backup', formatVersion: 1, exportedAt: now, data }
}
export function parseBackup(
  text: string,
  byteSize = new TextEncoder().encode(text).byteLength,
): { ok: true; backup: Backup } | { ok: false; reason: string } {
  if (byteSize > MAX_BACKUP_BYTES)
    return { ok: false, reason: '5MiB 이하의 백업 파일을 선택해 주세요.' }
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'JSON을 읽을 수 없습니다. 올바른 백업 파일을 다시 선택해 주세요.' }
  }
  if (!value || typeof value !== 'object')
    return { ok: false, reason: 'Focusday 정식 백업 파일이 아닙니다. 파일을 다시 선택해 주세요.' }
  const candidate = value as Record<string, unknown>
  if (candidate.format !== 'focusday-backup')
    return {
      ok: false,
      reason: 'Focusday 정식 백업 파일이 아닙니다. 손상 원본 다운로드는 백업 형식이 아닙니다.',
    }
  if (candidate.formatVersion !== 1)
    return { ok: false, reason: '지원하지 않는 백업 버전입니다. 버전 1 백업을 선택해 주세요.' }
  if (!isTimestamp(candidate.exportedAt) || !isAppData(candidate.data))
    return {
      ok: false,
      reason:
        '백업 데이터가 올바르지 않습니다. 데이터 버전·필드·날짜·길이·중복 id를 확인해 주세요.',
    }
  return { ok: true, backup: candidate as Backup }
}
function sameTask(a: Task, b: Task): boolean {
  const keys = Object.keys(a).sort() as (keyof Task)[]
  const otherKeys = Object.keys(b).sort()
  return (
    keys.length === otherKeys.length &&
    keys.every(
      (key, index) => key === otherKeys[index] && JSON.stringify(a[key]) === JSON.stringify(b[key]),
    )
  )
}
export function prepareRestore(current: AppData, incoming: AppData, mode: RestoreMode) {
  const byId = new Map(current.tasks.map((task) => [task.id, task]))
  const additions = incoming.tasks.filter((task) => !byId.has(task.id))
  const duplicates = incoming.tasks.filter((task) => byId.has(task.id))
  return {
    data:
      mode === 'replace'
        ? incoming
        : { version: 1 as const, tasks: [...current.tasks, ...additions] },
    added: additions.length,
    duplicates: duplicates.length,
    conflicts: duplicates.filter((task) => !sameTask(task, byId.get(task.id)!)).length,
  }
}
export function dataCounts(data: AppData) {
  const completed = data.tasks.filter((task) => task.completedAt !== null).length
  return { total: data.tasks.length, unfinished: data.tasks.length - completed, completed }
}
