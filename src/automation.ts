import { isDate, isToday, type Task } from './domain'
import type { StoragePort } from './storage'

export const AUTO_STORAGE_KEY = 'focusday:auto:v1'
export type AutoState = {
  version: 1
  enabled: boolean
  limit: 1 | 3 | 5
  day: string
  currentTaskId: string | null
  skippedTaskIds: string[]
}
export const defaultAutomation = (day: string): AutoState => ({
  version: 1,
  enabled: true,
  limit: 3,
  day,
  currentTaskId: null,
  skippedTaskIds: [],
})
export function currentAutomation(state: AutoState, day: string): AutoState {
  return state.day === day ? state : { ...state, day, currentTaskId: null, skippedTaskIds: [] }
}
export function isAutomation(value: unknown): value is AutoState {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    s.version === 1 &&
    typeof s.enabled === 'boolean' &&
    [1, 3, 5].includes(s.limit as number) &&
    isDate(s.day) &&
    (s.currentTaskId === null ||
      (typeof s.currentTaskId === 'string' && s.currentTaskId.length > 0)) &&
    Array.isArray(s.skippedTaskIds) &&
    s.skippedTaskIds.every((id) => typeof id === 'string' && id.length > 0) &&
    new Set(s.skippedTaskIds).size === s.skippedTaskIds.length
  )
}
export function loadAutomation(getStorage: () => StoragePort, day: string) {
  try {
    const raw = getStorage().getItem(AUTO_STORAGE_KEY)
    if (raw === null) return { data: defaultAutomation(day), blocked: false, error: '' }
    const parsed: unknown = JSON.parse(raw)
    if (!isAutomation(parsed)) throw new Error('Invalid automation settings')
    return { data: currentAutomation(parsed, day), blocked: false, error: '' }
  } catch {
    return {
      data: { ...defaultAutomation(day), enabled: false },
      blocked: true,
      error: '자동 계획 설정을 읽을 수 없어 수동 목록을 표시합니다. 기존 할 일은 유지됩니다.',
    }
  }
}
export function saveAutomation(state: AutoState, getStorage: () => StoragePort) {
  try {
    getStorage().setItem(AUTO_STORAGE_KEY, JSON.stringify(state))
    return ''
  } catch {
    return '자동 계획 설정을 저장하지 못했습니다. 이번 탭에는 적용되지만 새로고침하면 달라질 수 있습니다.'
  }
}
const priorityRank = { none: 0, low: 1, medium: 2, high: 3 }
const stable = (a: Task, b: Task) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
function group(task: Task, today: string) {
  if (task.dueDate && task.dueDate < today) return 0
  if (task.dueDate === today) return 1
  if (task.focusDate === today) return 2
  if (task.focusDate && task.focusDate < today) return 3
  if (task.priority === 'high') return 4
  if (task.dueDate && task.dueDate > today) return 5
  return 6
}
export function selectionReason(task: Task, today: string): string {
  return [
    '기한 초과',
    '오늘 기한',
    '직접 고른 일',
    '이전에 고른 미완료',
    '높은 우선순위',
    '다가오는 기한',
    '먼저 담아둔 일',
  ][group(task, today)]
}
export function automaticToday(tasks: Task[], today: string, state: AutoState): Task[] {
  const settings = currentAutomation(state, today)
  const ordered = tasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => {
      const ga = group(a, today),
        gb = group(b, today)
      return (
        ga - gb ||
        (ga === 0 || ga === 5 ? a.dueDate!.localeCompare(b.dueDate!) : 0) ||
        priorityRank[b.priority] - priorityRank[a.priority] ||
        stable(a, b)
      )
    })
  // Started tasks stay in the plan even when new, more urgent work arrives.
  const required = ordered.filter((t) => isToday(t, today) || t.id === settings.currentTaskId)
  const ids = new Set(required.map((t) => t.id))
  const extra = ordered
    .filter((t) => !ids.has(t.id))
    .slice(0, Math.max(0, settings.limit - required.length))
  const selected = new Set([...required, ...extra].map((t) => t.id))
  return ordered.filter((t) => selected.has(t.id))
}
export function nextCandidate(tasks: Task[], today: string, state: AutoState): Task | null {
  const s = currentAutomation(state, today)
  return (
    tasks.find((t) => t.id === s.currentTaskId && !t.completedAt) ||
    tasks.find((t) => !t.completedAt && !s.skippedTaskIds.includes(t.id)) ||
    null
  )
}
