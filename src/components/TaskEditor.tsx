import { useLayoutEffect, useRef, useState } from 'react'
import {
  isDate,
  priorityLabels,
  validateTitle,
  type Task,
  type TaskDraft,
  type Priority,
} from '../domain'
import { Icon } from './Icon'

type Props = {
  task: Task
  today: string
  onSave: (draft: TaskDraft) => void
  onClose: () => void
  onDelete: () => void
}
export function TaskEditor({ task, today, onSave, onClose, onDelete }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleInput = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState<TaskDraft>({
    title: task.title,
    dueDate: task.dueDate,
    focusDate: task.focusDate,
    priority: task.priority,
    category: task.category,
  })
  const [error, setError] = useState('')
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  useLayoutEffect(() => {
    const el = dialog.current!
    el.showModal()
    titleInput.current?.focus()
    return () => el.close()
  }, [])
  const dueForcesToday = draft.dueDate !== null && draft.dueDate <= today
  return (
    <dialog
      ref={dialog}
      className="editor-dialog"
      aria-labelledby="editor-heading"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (
          e.key === 'Enter' &&
          (composing.current ||
            e.nativeEvent.isComposing ||
            e.keyCode === 229 ||
            Date.now() - lastCompositionEnd.current < 80)
        ) {
          e.preventDefault()
          return
        }
        if (e.key !== 'Tab') return
        const controls = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]',
          ),
        ]
        const first = controls[0],
          last = controls[controls.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }}
    >
      <form
        className="editor-content"
        noValidate
        onCompositionStartCapture={() => {
          composing.current = true
        }}
        onCompositionEndCapture={() => {
          composing.current = false
          lastCompositionEnd.current = Date.now()
        }}
        onSubmit={(e) => {
          e.preventDefault()
          if (composing.current) return
          const invalid =
            validateTitle(draft.title) ||
            (draft.dueDate !== null && !isDate(draft.dueDate) ? '유효한 기한을 선택해 주세요.' : '')
          if (invalid) {
            setError(invalid)
            titleInput.current?.focus()
            return
          }
          onSave(draft)
        }}
      >
        <div className="sheet-handle" />
        <header className="editor-header">
          <div>
            <p className="eyebrow">TASK DETAILS</p>
            <h2 id="editor-heading">할 일 편집</h2>
          </div>
          <button type="button" className="icon-button" aria-label="편집 닫기" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="editor-fields">
          <label htmlFor="edit-title">제목</label>
          <textarea
            ref={titleInput}
            id="edit-title"
            value={draft.title}
            maxLength={200}
            rows={3}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value })
              setError('')
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'edit-error' : 'title-limit'}
          />
          <div id="title-limit" className="field-hint align-right">
            {draft.title.length} / 200
          </div>
          {error && (
            <p className="field-error" id="edit-error" role="alert">
              {error}
            </p>
          )}
          <label className="focus-setting">
            <span className="focus-setting-icon">
              <Icon name="sun" />
            </span>
            <span>
              <strong>오늘 집중</strong>
              <small>집중하기 / 집중 해제는 기한을 바꾸지 않아요.</small>
            </span>
            <input
              type="checkbox"
              aria-label={draft.focusDate === today ? '집중 해제' : '집중하기'}
              checked={draft.focusDate === today}
              onChange={(e) => setDraft({ ...draft, focusDate: e.target.checked ? today : null })}
            />
          </label>
          {draft.focusDate !== today && dueForcesToday && (
            <p className="field-hint due-guidance">
              기한 때문에 오늘에도 표시됩니다. 아래에서 기한을 변경할 수 있습니다.
            </p>
          )}
          <label htmlFor="edit-due">기한</label>
          <div className="date-control">
            <input
              id="edit-due"
              type="date"
              value={draft.dueDate ?? ''}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
            />
            <button
              type="button"
              className="text-button"
              disabled={!draft.dueDate}
              onClick={() => setDraft({ ...draft, dueDate: null })}
            >
              해제
            </button>
          </div>
          <label htmlFor="edit-priority">우선순위</label>
          <select
            id="edit-priority"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
          >
            {Object.entries(priorityLabels).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
          <label htmlFor="edit-category">
            분류 <span className="optional">선택</span>
          </label>
          <input
            id="edit-category"
            value={draft.category ?? ''}
            placeholder="예: 개인, 업무, 생활"
            maxLength={24}
            onChange={(e) => setDraft({ ...draft, category: e.target.value || null })}
          />
          <p className="field-hint">분류는 하나만, 24자까지 입력할 수 있어요.</p>
        </div>
        <footer className="editor-footer">
          <button type="button" className="delete-button" onClick={onDelete}>
            <Icon name="trash" size={18} />
            삭제
          </button>
          <div>
            <button type="button" className="secondary-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="primary-button">
              저장
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
