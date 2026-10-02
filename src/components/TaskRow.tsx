import { dueLabel, priorityLabels, type Task } from '../domain'
import { Icon } from './Icon'

type Props = { task: Task; today: string; onToggle: (task: Task) => void; onEdit: (task: Task, origin: HTMLElement) => void; onFocus: (task: Task) => void }
export function TaskRow({ task, today, onToggle, onEdit, onFocus }: Props) {
  const done = !!task.completedAt
  const focused = task.focusDate === today
  return <li className={`task-row ${done ? 'is-complete' : ''}`} data-task-id={task.id}>
    <label className="check-target">
      <input type="checkbox" checked={done} onChange={() => onToggle(task)} aria-label={`${task.title} ${done ? '미완료로 복원' : '완료'}`} />
      <span className="check-visual"><Icon name="check" size={15} /></span>
    </label>
    <button className="task-body" onClick={e => onEdit(task, e.currentTarget)} aria-label={`${task.title} 편집`}>
      <span className="task-title">{task.title}</span>
      <span className="task-meta">
        {task.dueDate && <span className={task.dueDate < today && !done ? 'meta-overdue' : ''}>{dueLabel(task.dueDate, today)}</span>}
        {task.priority !== 'none' && <span className={`priority-${task.priority}`}><span className="priority-dot" />{priorityLabels[task.priority]}</span>}
        {task.category && <span className="category">{task.category}</span>}
        {focused && !done && <span className="focus-label"><Icon name="sun" size={13} />오늘 집중</span>}
        {task.isDemo && <span className="demo-label">예시</span>}
      </span>
    </button>
    {!done && <button className={`focus-button ${focused ? 'is-focused' : ''}`} onClick={() => onFocus(task)} aria-label={`${task.title} ${focused ? '오늘에서 빼기' : '오늘에 추가'}`} title={focused ? '오늘에서 빼기' : '오늘에 추가'}>
      <Icon name={focused ? 'sun' : 'plus'} size={18} /><span>{focused ? '오늘에서 빼기' : '오늘에 추가'}</span>
    </button>}
  </li>
}
