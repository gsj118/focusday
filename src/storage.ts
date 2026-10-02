import { isDate, validateTitle, type AppData, type Task } from './domain'

export const STORAGE_KEY = 'focusday:v1'
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
export type LoadResult = {
  data: AppData
  state: 'ready' | 'unavailable' | 'blocked'
  raw: string | null
  reason: string
}
const empty = (): AppData => ({ version: 1, tasks: [] })
export const isTimestamp = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(v) &&
  isDate(v.slice(0, 10)) &&
  Number.isFinite(Date.parse(v))
function isTask(v: unknown): v is Task {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.title === 'string' &&
    !validateTitle(t.title) &&
    t.title === t.title.trim() &&
    isTimestamp(t.createdAt) &&
    isTimestamp(t.updatedAt) &&
    (t.dueDate === null || isDate(t.dueDate)) &&
    (t.focusDate === null || isDate(t.focusDate)) &&
    ['none', 'low', 'medium', 'high'].includes(t.priority as string) &&
    (t.category === null ||
      (typeof t.category === 'string' &&
        t.category.trim() === t.category &&
        t.category.length > 0 &&
        t.category.length <= 24)) &&
    (t.completedAt === null || isTimestamp(t.completedAt)) &&
    typeof t.isDemo === 'boolean'
  )
}
export function isAppData(v: unknown): v is AppData {
  if (!v || typeof v !== 'object') return false
  const d = v as Record<string, unknown>
  return (
    d.version === 1 &&
    Array.isArray(d.tasks) &&
    d.tasks.every(isTask) &&
    new Set(d.tasks.map((t) => t.id)).size === d.tasks.length
  )
}
export function loadData(getStorage: () => StoragePort = () => window.localStorage): LoadResult {
  let raw: string | null
  try {
    raw = getStorage().getItem(STORAGE_KEY)
  } catch {
    return {
      data: empty(),
      state: 'unavailable',
      raw: null,
      reason:
        '브라우저의 저장 데이터를 읽을 수 없습니다. 기존 데이터 보호를 위해 자동 저장을 멈췄습니다.',
    }
  }
  if (raw === null) return { data: empty(), state: 'ready', raw: null, reason: '' }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isAppData(parsed))
      return {
        data: empty(),
        state: 'blocked',
        raw,
        reason: '저장 데이터의 형식 또는 버전을 지원하지 않습니다.',
      }
    return { data: parsed, state: 'ready', raw, reason: '' }
  } catch {
    return {
      data: empty(),
      state: 'blocked',
      raw,
      reason: '저장 데이터를 읽는 중 JSON 손상을 발견했습니다.',
    }
  }
}
export type SaveResult = { ok: boolean; reason: string }
export function saveData(
  data: AppData,
  getStorage: () => StoragePort = () => window.localStorage,
): SaveResult {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(data))
    return { ok: true, reason: '' }
  } catch {
    return {
      ok: false,
      reason:
        '변경 사항을 이 브라우저에 저장하지 못했습니다. 현재 탭에서는 사용할 수 있지만 새로고침하면 변경 내용이 사라질 수 있습니다.',
    }
  }
}
