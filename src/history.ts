import { applyUndo, type Task, type UndoAction } from './domain'
import type { AutoState } from './automation'

type Context = { token: number; day: string; message: string; autoBefore: AutoState }
export type RecentAction = Context &
  (
    | { kind: 'complete' | 'delete'; task: Task }
    | { kind: 'capture'; tasks: Task[]; raw: string }
    | { kind: 'edit'; task: Task }
    | { kind: 'automation' }
  )
export function undoTasks(tasks: Task[], action: RecentAction): Task[] {
  if (action.kind === 'automation') return tasks
  if (action.kind === 'capture') {
    const added = new Set(action.tasks.map((task) => task.id))
    return tasks.filter((task) => !added.has(task.id))
  }
  if (action.kind === 'edit')
    return tasks.map((task) =>
      task.id === action.task.id ? { ...action.task, updatedAt: new Date().toISOString() } : task,
    )
  return applyUndo(tasks, action as UndoAction)
}
export function undoLabel(action: RecentAction): string {
  return {
    complete: '완료 취소',
    delete: '삭제 취소',
    capture: '추가 취소',
    edit: '변경 취소',
    automation: '계획 변경 취소',
  }[action.kind]
}
