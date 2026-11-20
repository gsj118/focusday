import { isDate, type Task } from './domain'
import type { StoragePort } from './storage'

export const AUTO_STORAGE_KEY = 'focusday:auto:v1'
export type AutoState = {
  version: 2
  enabled: boolean
  limit: 1 | 3 | 5
  day: string
  currentTaskId: string | null
  skippedTaskIds: string[]
  planTaskIds: string[] | null
}
export const defaultAutomation = (day: string): AutoState => ({
  version: 2,
  enabled: true,
  limit: 3,
  day,
  currentTaskId: null,
  skippedTaskIds: [],
  planTaskIds: null,
})
export function currentAutomation(state: AutoState, day: string): AutoState {
  return state.day === day
    ? state
    : { ...state, day, currentTaskId: null, skippedTaskIds: [], planTaskIds: null }
}
const uniqueIds = (ids: unknown): ids is string[] =>
  Array.isArray(ids) &&
  ids.every((id) => typeof id === 'string' && id.length > 0) &&
  new Set(ids).size === ids.length
export function isAutomation(value: unknown): value is AutoState {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    s.version === 2 &&
    typeof s.enabled === 'boolean' &&
    [1, 3, 5].includes(s.limit as number) &&
    isDate(s.day) &&
    (s.currentTaskId === null ||
      (typeof s.currentTaskId === 'string' && s.currentTaskId.length > 0)) &&
    uniqueIds(s.skippedTaskIds) &&
    (s.planTaskIds === null || uniqueIds(s.planTaskIds))
  )
}
export function loadAutomation(getStorage: () => StoragePort, day: string) {
  try {
    const raw = getStorage().getItem(AUTO_STORAGE_KEY)
    if (raw === null) return { data: defaultAutomation(day), blocked: false, error: '' }
    let parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && (parsed as { version?: unknown }).version === 1)
      parsed = { ...parsed, version: 2, planTaskIds: null }
    if (!isAutomation(parsed)) throw new Error('Invalid automation settings')
    return { data: currentAutomation(parsed, day), blocked: false, error: '' }
  } catch {
    return {
      data: { ...defaultAutomation(day), enabled: false },
      blocked: true,
      error: '오늘 계획을 불러오지 못해 수동 목록을 표시하고 있어요. 저장된 할 일은 그대로예요.',
    }
  }
}
export function saveAutomation(state: AutoState, getStorage: () => StoragePort) {
  try {
    getStorage().setItem(AUTO_STORAGE_KEY, JSON.stringify(state))
    return ''
  } catch {
    return '오늘 계획을 저장하지 못했어요. 이 탭에서는 사용할 수 있지만 새로고침하면 계획이 달라질 수 있어요.'
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
    '오늘까지 할 일',
    '오늘 하기로 고른 일',
    '지난번에 마치지 못한 일',
    '높은 우선순위',
    '다가오는 기한',
    '먼저 담아둔 일',
  ][group(task, today)]
}
export function rankedTasks(tasks: Task[], today: string): Task[] {
  return tasks
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
}
/** Keep selected identities. Completion/deletion alone never refill the plan. */
export function initializePlan(tasks: Task[], today: string, state: AutoState): AutoState {
  const s = currentAutomation(state, today)
  if (!s.enabled || s.planTaskIds !== null) return s
  const ranked = rankedTasks(tasks, today)
  if (!ranked.length) return s
  const current = ranked.find((task) => task.id === s.currentTaskId)
  const selected = current ? [current, ...ranked.filter((t) => t.id !== current.id)] : ranked
  return { ...s, planTaskIds: selected.slice(0, s.limit).map((t) => t.id) }
}
export function dailyPlan(tasks: Task[], today: string, state: AutoState): Task[] {
  const ids = initializePlan(tasks, today, state).planTaskIds || []
  const byId = new Map(tasks.map((task) => [task.id, task]))
  return ids.flatMap((id) => {
    const task = byId.get(id)
    return task ? [task] : []
  })
}
export function automaticToday(tasks: Task[], today: string, state: AutoState): Task[] {
  return rankedTasks(dailyPlan(tasks, today, state), today)
}
/** Entering a deadline due today is an explicit request to include that new work. */
export function planCapturedTasks(
  existing: Task[],
  captured: Task[],
  today: string,
  state: AutoState,
  includeAll: boolean,
): AutoState {
  if (!state.enabled) return state
  const plan = initializePlan([...existing, ...captured], today, state)
  const ids = captured
    .filter((task) => !task.completedAt && (includeAll || (task.dueDate && task.dueDate <= today)))
    .map((task) => task.id)
  return ids.length ? addToPlan(plan, ids) : plan
}
/** A deliberate plan change keeps completed work and the currently selected task. */
export function resizePlan(
  tasks: Task[],
  today: string,
  state: AutoState,
  limit: 1 | 3 | 5,
): AutoState {
  const s = initializePlan(tasks, today, state)
  const completed = dailyPlan(tasks, today, s).filter((task) => task.completedAt)
  const unfinished = rankedTasks(tasks, today)
  const current = unfinished.find((task) => task.id === s.currentTaskId)
  const ordered = current
    ? [current, ...unfinished.filter((task) => task.id !== current.id)]
    : unfinished
  return {
    ...s,
    limit,
    skippedTaskIds: [],
    planTaskIds: [...completed, ...ordered.slice(0, Math.max(0, limit - completed.length))].map(
      (task) => task.id,
    ),
  }
}
export function addToPlan(state: AutoState, ids: string[]): AutoState {
  return {
    ...state,
    planTaskIds: [...new Set([...(state.planTaskIds || []), ...ids])],
    skippedTaskIds: state.skippedTaskIds.filter((id) => !ids.includes(id)),
  }
}
export function nextCandidate(tasks: Task[], today: string, state: AutoState): Task | null {
  const s = currentAutomation(state, today)
  return (
    tasks.find((t) => t.id === s.currentTaskId && !t.completedAt) ||
    tasks.find((t) => !t.completedAt && !s.skippedTaskIds.includes(t.id)) ||
    null
  )
}
