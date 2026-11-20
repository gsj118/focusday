import { useLayoutEffect, useRef, useState } from 'react'
import {
  isDate,
  addDays,
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
  onSave: (draft: TaskDraft, includeToday: boolean) => void
  onClose: () => void
  onDelete: () => void
  automatic?: boolean
  planned?: boolean
}
export function TaskEditor({ task, today, onSave, onClose, onDelete, automatic, planned }: Props) {
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
  const [openedDay] = useState(today)
  const [selection, setSelection] = useState<{ day: string; included: boolean } | null>(null)
  const includeToday =
    selection?.day === today ? selection.included : (planned ?? task.focusDate === today)
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  useLayoutEffect(() => {
    const el = dialog.current!
    el.showModal()
    titleInput.current?.focus()
    return () => el.close()
  }, [])
  const dueForcesToday = draft.dueDate !== null && draft.dueDate <= today
  function chooseDate(dueDate: string | null) {
    setDraft({ ...draft, dueDate })
    if (automatic && dueDate && dueDate <= today && dueDate !== draft.dueDate)
      setSelection({ day: today, included: true })
  }
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
            (draft.dueDate !== null && !isDate(draft.dueDate) ? '기한을 확인해 주세요.' : '')
          if (invalid) {
            setError(invalid)
            titleInput.current?.focus()
            return
          }
          onSave(
            {
              ...draft,
              focusDate: selection?.day === today ? (includeToday ? today : null) : task.focusDate,
            },
            includeToday,
          )
        }}
      >
        <div className="sheet-handle" />
        <header className="editor-header">
          <div>
            <p className="eyebrow">Focusday / 할 일</p>
            <h2 id="editor-heading">할 일 편집</h2>
          </div>
          <button type="button" className="icon-button" aria-label="편집 닫기" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="editor-fields">
          {openedDay !== today && (
            <p className="field-hint due-guidance" role="status">
              날짜가 바뀌었어요. 오늘 계획 선택은 새 날짜 기준으로 표시해요. 작성 중인 제목과 기한은
              그대로예요.
            </p>
          )}
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
          <div className="property-list">
            <div className="property-row">
              <span className="property-label">
                <Icon name="sun" size={16} />
                오늘 계획
              </span>
              <label className="focus-setting">
                <input
                  type="checkbox"
                  aria-label={includeToday ? '오늘에서 빼기' : '오늘에 넣기'}
                  checked={includeToday}
                  onChange={(e) => {
                    setSelection({ day: today, included: e.target.checked })
                  }}
                />
                <span>{includeToday ? '오늘에 포함' : '선택 안 함'}</span>
              </label>
            </div>
            <p className="field-hint property-hint">
              오늘 계획에 넣거나 빼도 기한은 그대로예요.
              {automatic &&
                ' 기한을 오늘이나 지난 날짜로 바꾸면 자동으로 포함돼요. 원하면 직접 뺄 수 있어요.'}
            </p>
            {!automatic && !includeToday && dueForcesToday && (
              <p className="field-hint due-guidance">
                기한이 되어 오늘 목록에 표시돼요. 필요하면 아래에서 기한을 바꿔 주세요.
              </p>
            )}
            <div className="property-row">
              <label htmlFor="edit-due" className="property-label">
                기한
              </label>
              <div className="date-control">
                <input
                  id="edit-due"
                  type="date"
                  value={draft.dueDate ?? ''}
                  onChange={(e) => chooseDate(e.target.value || null)}
                />
                <button
                  type="button"
                  className="text-button"
                  disabled={!draft.dueDate}
                  onClick={() => chooseDate(null)}
                >
                  해제
                </button>
              </div>
            </div>
            <div className="date-shortcuts" aria-label="빠른 기한 선택">
              {(['오늘', '내일', '일주일 뒤', '기한 없음'] as const).map((label, index) => {
                const value = index === 3 ? null : addDays(today, [0, 1, 7][index])
                return (
                  <button
                    key={label}
                    type="button"
                    className="secondary-button"
                    aria-pressed={draft.dueDate === value}
                    onClick={() => chooseDate(value)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="property-row">
              <label htmlFor="edit-priority" className="property-label">
                우선순위
              </label>
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
            </div>
            <div className="property-row">
              <label htmlFor="edit-category" className="property-label">
                분류 <span className="optional">선택</span>
              </label>
              <input
                id="edit-category"
                value={draft.category ?? ''}
                placeholder="예: 개인, 업무, 생활"
                maxLength={24}
                onChange={(e) => setDraft({ ...draft, category: e.target.value || null })}
              />
            </div>
            <p className="field-hint property-hint">분류는 하나만, 24자까지 입력할 수 있어요.</p>
          </div>
          <p className="editor-draft-note">저장을 누르면 변경 내용이 적용돼요.</p>
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
