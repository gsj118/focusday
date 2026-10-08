import { dueLabel, priorityLabels, type Task } from '../domain'
import { Icon } from './Icon'

type Props = {
  task: Task
  today: string
  onToggle: (task: Task) => void
  onEdit: (task: Task, origin: HTMLElement) => void
  onFocus: (task: Task) => void
  showCompletionTime?: boolean
}
export function TaskRow({ task, today, onToggle, onEdit, onFocus, showCompletionTime }: Props) {
  const done = !!task.completedAt
  const focused = task.focusDate === today
  return (
    <li className={`task-row ${done ? 'is-complete' : ''}`} data-task-id={task.id}>
      <label className="check-target">
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(task)}
          aria-label={`${task.title} ${done ? '미완료로 복원' : '완료'}`}
        />
        <span className="check-visual">
          <Icon name="check" size={15} />
        </span>
      </label>
      <button
        className="task-body"
        onClick={(e) => onEdit(task, e.currentTarget)}
        aria-label={`${task.title} 편집`}
      >
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {showCompletionTime && task.completedAt && (
            <time dateTime={task.completedAt}>
              {new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(
                new Date(task.completedAt),
              )}{' '}
              완료
            </time>
          )}
          {task.dueDate && (
            <span className={task.dueDate < today && !done ? 'meta-overdue' : ''}>
              {dueLabel(task.dueDate, today)}
            </span>
          )}
          {task.priority !== 'none' && (
            <span className={`priority-${task.priority}`}>
              <span className="priority-dot" />
              {priorityLabels[task.priority]}
            </span>
          )}
          {task.category && <span className="category">{task.category}</span>}
          {focused && !done && (
            <span className="focus-label">
              <Icon name="sun" size={13} />
              오늘 집중
            </span>
          )}
          {task.isDemo && <span className="demo-label">예시</span>}
        </span>
      </button>
      {!done && (
        <button
          className={`focus-button ${focused ? 'is-focused' : ''}`}
          onClick={() => onFocus(task)}
          aria-label={`${task.title} ${focused ? '집중 해제' : '집중하기'}`}
          aria-pressed={focused}
          title={focused ? '집중 해제' : '집중하기'}
        >
          <Icon name={focused ? 'sun' : 'plus'} size={18} />
          <span>{focused ? '집중 해제' : '집중하기'}</span>
        </button>
      )}
    </li>
  )
}
