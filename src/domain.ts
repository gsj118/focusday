export type Priority = 'none' | 'low' | 'medium' | 'high'
export type View = 'today' | 'all'
export type Task = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  dueDate: string | null
  focusDate: string | null
  priority: Priority
  category: string | null
  completedAt: string | null
  isDemo: boolean
}
export type AppData = { version: 1; tasks: Task[] }
export type TaskDraft = Pick<Task, 'title' | 'dueDate' | 'focusDate' | 'priority' | 'category'>
export const priorityLabels: Record<Priority, string> = {
  none: '없음',
  low: '낮음',
  medium: '보통',
  high: '높음',
}
const ranks: Record<Priority, number> = { none: 0, low: 1, medium: 2, high: 3 }

export function localDate(date = new Date()): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(y, m - 1, d)
  date.setHours(12, 0, 0, 0)
  return localDate(date) === value
}
export function calendarDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(y, m - 1, d)
  date.setHours(12, 0, 0, 0)
  return date
}
export function addDays(key: string, days: number): string {
  const date = calendarDate(key)
  date.setDate(date.getDate() + days)
  return localDate(date)
}
export function daysBetween(a: string, b: string): number {
  const ordinal = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(0)
    date.setUTCFullYear(y, m - 1, d)
    date.setUTCHours(0, 0, 0, 0)
    return date.getTime()
  }
  return Math.round((ordinal(b) - ordinal(a)) / 86400000)
}
export function nextMidnightDelay(now: Date): number {
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  next.setHours(0, 0, 0, 20)
  return Math.max(20, next.getTime() - now.getTime())
}
export function validateTitle(title: string): string | null {
  if (!title.trim()) return '할 일 제목을 입력해 주세요.'
  if (title.trim().length > 200) return '제목은 200자까지 입력할 수 있습니다.'
  return null
}
export function createTask(
  title: string,
  view: View,
  today: string,
  now = new Date().toISOString(),
  id: string = crypto.randomUUID(),
): Task {
  const error = validateTitle(title)
  if (error) throw new Error(error)
  return {
    id,
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
    dueDate: null,
    focusDate: view === 'today' ? today : null,
    priority: 'none',
    category: null,
    completedAt: null,
    isDemo: false,
  }
}
export function isToday(task: Task, today: string): boolean {
  return (
    !task.completedAt &&
    (task.focusDate === today || (isDate(task.dueDate) && task.dueDate <= today))
  )
}
export function isOverdue(task: Task, today: string): boolean {
  return !task.completedAt && isDate(task.dueDate) && task.dueDate < today
}
const tie = (a: Task, b: Task) => a.id.localeCompare(b.id)
const baseSort = (a: Task, b: Task) =>
  ranks[b.priority] - ranks[a.priority] || a.createdAt.localeCompare(b.createdAt) || tie(a, b)
export function selectTasks(tasks: Task[], view: View, today: string, query = ''): Task[] {
  const q = query.trim().toLocaleLowerCase()
  const filtered = tasks.filter(
    (t) => !t.completedAt && (view === 'all' || isToday(t, today)) && matches(t, q),
  )
  if (view === 'today')
    return filtered.sort((a, b) => {
      const ao = isOverdue(a, today),
        bo = isOverdue(b, today)
      return (
        Number(bo) - Number(ao) ||
        (ao && bo ? a.dueDate!.localeCompare(b.dueDate!) : 0) ||
        baseSort(a, b)
      )
    })
  const group = (t: Task) => (isToday(t, today) ? 0 : t.dueDate && t.dueDate > today ? 1 : 2)
  return filtered.sort((a, b) => group(a) - group(b) || baseSort(a, b))
}
export function matches(task: Task, query: string): boolean {
  return `${task.title}\n${task.category ?? ''}`
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase())
}
export function selectCompleted(tasks: Task[], query = ''): Task[] {
  return tasks
    .filter((t) => t.completedAt && matches(t, query))
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!) || tie(a, b))
}
export const planGroupLabels = {
  overdue: '기한 초과',
  dueToday: '오늘 기한',
  yesterday: '어제 선택한 일',
  high: '높은 우선순위',
} as const
export type PlanGroup = keyof typeof planGroupLabels
export type PlanCandidate = { task: Task; group: PlanGroup; reasons: string[] }
export function yesterdayTasks(tasks: Task[], today: string): Task[] {
  const yesterday = addDays(today, -1)
  return tasks.filter((task) => task.completedAt === null && task.focusDate === yesterday)
}
export function planCandidates(tasks: Task[], today: string): PlanCandidate[] {
  const yesterday = addDays(today, -1)
  const groups = Object.keys(planGroupLabels) as PlanGroup[]
  return tasks
    .filter((task) => task.completedAt === null)
    .flatMap((task): PlanCandidate[] => {
      const matches: PlanGroup[] = []
      if (isOverdue(task, today)) matches.push('overdue')
      if (task.dueDate === today) matches.push('dueToday')
      if (task.focusDate === yesterday) matches.push('yesterday')
      if (task.priority === 'high') matches.push('high')
      return matches.length
        ? [{ task, group: matches[0], reasons: matches.map((group) => planGroupLabels[group]) }]
        : []
    })
    .sort(
      (a, b) =>
        groups.indexOf(a.group) - groups.indexOf(b.group) ||
        (a.group === 'overdue' ? a.task.dueDate!.localeCompare(b.task.dueDate!) : 0) ||
        baseSort(a.task, b.task),
    )
}
export function todaySummary(tasks: Task[], today: string) {
  const unfinished = tasks.filter((task) => task.completedAt === null)
  const focused = unfinished.filter((task) => task.focusDate === today).length
  const dueOnly = unfinished.filter(
    (task) => isDate(task.dueDate) && task.dueDate <= today && task.focusDate !== today,
  ).length
  return { focused, dueOnly, total: focused + dueOnly }
}
export function updateTask(task: Task, draft: TaskDraft, now = new Date().toISOString()): Task {
  const error = validateTitle(draft.title)
  if (error) throw new Error(error)
  if (draft.dueDate !== null && !isDate(draft.dueDate))
    throw new Error('유효한 기한을 선택해 주세요.')
  return {
    ...task,
    ...draft,
    title: draft.title.trim(),
    category: draft.category?.trim().slice(0, 24) || null,
    updatedAt: now,
  }
}
export type UndoAction = { token: number; kind: 'complete' | 'delete'; task: Task }
export function applyUndo(tasks: Task[], undo: UndoAction): Task[] {
  if (undo.kind === 'delete')
    return tasks.some((t) => t.id === undo.task.id) ? tasks : [...tasks, undo.task]
  return tasks.map((t) =>
    t.id === undo.task.id
      ? { ...t, completedAt: undo.task.completedAt, updatedAt: new Date().toISOString() }
      : t,
  )
}
export function demoTasks(today: string): Task[] {
  const rows: [string, string | null, string | null, Priority, string][] = [
    ['택배 반품 접수', addDays(today, -1), null, 'high', '개인'],
    ['발표 자료 최종 확인', today, today, 'high', '업무'],
    ['세탁소 방문', null, today, 'none', '개인'],
    ['카드 명세서 확인', addDays(today, 3), null, 'medium', '개인'],
    ['주말 장보기', null, null, 'low', '생활'],
  ]
  return rows.map(([title, dueDate, focusDate, priority, category]) => ({
    ...createTask(title, 'all', today),
    dueDate,
    focusDate,
    priority,
    category,
    isDemo: true,
  }))
}
export function appendDemo(tasks: Task[], today: string): Task[] {
  return tasks.some((t) => t.isDemo) ? tasks : [...tasks, ...demoTasks(today)]
}
export function dueLabel(key: string, today: string): string {
  if (key < today) return `기한 초과 · ${daysBetween(key, today)}일 지남`
  if (key === today) return '오늘 기한'
  if (key === addDays(today, 1)) return '내일 기한'
  const [y, m, d] = key.split('-').map(Number)
  return `${y !== Number(today.slice(0, 4)) ? `${y}년 ` : ''}${m}월 ${d}일 기한`
}
