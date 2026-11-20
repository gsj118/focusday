import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { calendarDate, isDate, priorityLabels, validateTitle, type Priority } from '../domain'
import { parseMemo, type MemoTask, type MemoResult } from '../memo'
import { Icon } from './Icon'

type Props = {
  today: string
  value: string
  onChange: (value: string) => void
  inputRef: RefObject<HTMLTextAreaElement | null>
  formRef: RefObject<HTMLFormElement | null>
  onSave: (tasks: MemoTask[], raw: string, includeToday: boolean) => void
  automatic: boolean
  awaitingFirstPlan: boolean
  defaultToday: boolean
}
export const exampleMemo =
  '오늘은 빨래 돌리고 내일 과제 제출해야 돼.\n다음 주 월요일 발표 준비도 해놔야 하고.'

export function CaptureComposer({
  today,
  value,
  onChange,
  inputRef,
  formRef,
  onSave,
  automatic,
  awaitingFirstPlan,
  defaultToday,
}: Props) {
  const [recognize, setRecognize] = useState(automatic)
  const [review, setReview] = useState<MemoResult | null>(null)
  const [reviewDay, setReviewDay] = useState(today)
  const [confirmedDay, setConfirmedDay] = useState(today)
  const [error, setError] = useState('')
  const [includeToday, setIncludeToday] = useState(defaultToday)
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  const reviewedSource = useRef('')
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const visibleReview = review && reviewedSource.current === value ? review : null
  const hasReview = !!visibleReview
  const dateChanged = hasReview && reviewDay !== today
  const needsDateConfirmation = dateChanged && confirmedDay !== today
  const dueTodayCount =
    visibleReview?.tasks.filter((task) => task.dueDate && task.dueDate <= today).length || 0
  useLayoutEffect(() => {
    if (!hasReview) return
    reviewHeading.current?.focus({ preventScroll: true })
    reviewHeading.current?.scrollIntoView({ block: window.innerWidth < 1180 ? 'start' : 'nearest' })
  }, [hasReview])
  function change(value: string) {
    onChange(value)
    setReview(null)
    setError('')
  }
  function update(index: number, patch: Partial<MemoTask>) {
    if (!visibleReview) return
    setReview({
      ...visibleReview,
      tasks: visibleReview.tasks.map((task, i) => (i === index ? { ...task, ...patch } : task)),
    })
    setError('')
  }
  function submit() {
    if (composing.current || Date.now() - lastCompositionEnd.current < 80) return
    if (!visibleReview) {
      const parsed = parseMemo(value, today, recognize)
      if (parsed.errors.length) {
        setError(parsed.errors.map((e) => `${e.line}번째 줄: ${e.message}`).join(' '))
        inputRef.current?.focus()
        return
      }
      reviewedSource.current = value
      if (!recognize) {
        onSave(parsed.tasks, value, includeToday)
        setError('')
        inputRef.current?.focus()
        return
      }
      setReview(parsed)
      setReviewDay(today)
      setConfirmedDay(today)
      setError('')
      return
    }
    if (needsDateConfirmation) {
      setError('날짜가 바뀌었어요. 정리한 기한을 확인한 뒤 담아 주세요.')
      return
    }
    if (!visibleReview.tasks.length) {
      setError('담을 할 일을 하나 이상 남겨 주세요.')
      return
    }
    for (const task of visibleReview.tasks) {
      const invalid =
        validateTitle(task.title) ||
        (task.dueDate && !isDate(task.dueDate) ? '기한을 확인해 주세요.' : '') ||
        (task.category && task.category.trim().length > 24
          ? '분류는 24자까지 입력할 수 있어요.'
          : '')
      if (invalid) {
        setError(invalid)
        return
      }
    }
    onSave(
      visibleReview.tasks.map((task) => ({
        ...task,
        title: task.title.trim(),
        category: task.category?.trim() || null,
      })),
      value,
      includeToday,
    )
    setReview(null)
    setError('')
    setIncludeToday(defaultToday)
    inputRef.current?.focus()
  }
  return (
    <section
      className={`capture-panel ${hasReview ? 'has-review' : ''}`}
      aria-label="메모로 할 일 담기"
    >
      <header className="capture-header">
        <span className="capture-symbol">
          <Icon name="plus" size={18} />
        </span>
        <div>
          <h2>생각난 일 담기</h2>
          <p>
            {recognize
              ? '평소 쓰는 말로 적으면 할 일로 정리해 드려요.'
              : '한 줄에 하나씩 적으면 그대로 담아 드려요.'}
          </p>
        </div>
      </header>
      <form
        ref={formRef}
        className="quick-add"
        noValidate
        onCompositionStartCapture={() => {
          composing.current = true
        }}
        onCompositionEndCapture={() => {
          composing.current = false
          lastCompositionEnd.current = Date.now()
        }}
        onKeyDownCapture={(event) => {
          if (
            event.key === 'Enter' &&
            (composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229 ||
              Date.now() - lastCompositionEnd.current < 80)
          )
            event.preventDefault()
        }}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <label className="sr-only" htmlFor="quick-title">
          할 일 메모
        </label>
        <textarea
          ref={inputRef}
          id="quick-title"
          rows={4}
          value={value}
          maxLength={24000}
          placeholder={'내일 과제 제출하고\n다음 주 월요일에는 발표 준비하기'}
          autoComplete="off"
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            if (
              composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229 ||
              Date.now() - lastCompositionEnd.current < 80
            )
              return
            submit()
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'quick-error' : 'quick-hint'}
        />
        <div className="capture-input-footer">
          <span id="quick-hint">
            {recognize ? 'Enter 확인' : 'Enter 담기'} · Shift+Enter 줄바꿈
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const next = value.trim()
                ? `${value}${value.endsWith('\n') ? '' : '\n'}${exampleMemo}`
                : exampleMemo
              if (next.length > 24000) {
                setError('메모가 길어 예시를 덧붙일 수 없어요. 현재 메모를 먼저 담아 주세요.')
                inputRef.current?.focus()
                return
              }
              change(next)
              inputRef.current?.focus()
            }}
          >
            {value.trim() ? '예시 덧붙이기' : '예시 넣기'}
          </button>
        </div>
        <div className="capture-options">
          <label>
            <input
              type="checkbox"
              checked={recognize}
              onChange={(event) => {
                setRecognize(event.target.checked)
                setReview(null)
                setError('')
              }}
            />
            문장 자동 정리
          </label>
          <span>{recognize ? '저장 전에 확인해요' : '한 줄씩 그대로 담아요'}</span>
        </div>
        {visibleReview && (
          <div className="capture-review" aria-label="입력 인식 결과">
            <header>
              <h3 ref={reviewHeading} tabIndex={-1}>
                할 일 {visibleReview.tasks.length}개로 정리했어요
              </h3>
              <p>제목과 기한을 확인한 뒤 목록에 담아 주세요.</p>
            </header>
            {dateChanged && (
              <div className="capture-date-notice">
                <p role="status">
                  <strong>날짜가 바뀌었어요.</strong>{' '}
                  {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(
                    calendarDate(reviewDay),
                  )}
                  에 정리한 기한과 수정한 내용은 그대로예요. 저장 전에 기한을 다시 확인해 주세요.
                </p>
                <details>
                  <summary>오늘 날짜로 다시 정리하려면</summary>
                  <p>
                    ‘메모로 돌아가기’를 누르고 다시 정리해 주세요. 오늘·내일을 새 날짜로 해석해요.
                  </p>
                </details>
                <label>
                  <input
                    type="checkbox"
                    checked={!needsDateConfirmation}
                    onChange={(event) => {
                      setConfirmedDay(event.target.checked ? today : '')
                      setError('')
                    }}
                  />
                  정리한 기한을 확인했어요
                </label>
              </div>
            )}
            <div className="capture-review-list">
              {visibleReview.tasks.map((task, index) => (
                <fieldset key={`${task.line}-${index}`} className="capture-item">
                  <legend className="sr-only">정리한 할 일 {index + 1}</legend>
                  <div className="capture-item-title">
                    <input
                      aria-label={`정리한 제목 ${index + 1}`}
                      value={task.title}
                      maxLength={200}
                      onChange={(e) => update(index, { title: e.target.value })}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${task.title} 정리 결과에서 제외`}
                      onClick={() =>
                        setReview({
                          ...visibleReview,
                          tasks: visibleReview.tasks.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <details className="capture-item-properties">
                    <summary aria-label={`할 일 ${index + 1} 기한·분류 수정`}>
                      <span>
                        {task.dueDate
                          ? new Intl.DateTimeFormat('ko-KR', {
                              month: 'long',
                              day: 'numeric',
                            }).format(calendarDate(task.dueDate))
                          : '기한 없음'}
                      </span>
                      {task.category && <span>{task.category}</span>}
                      {task.priority !== 'none' && <span>{priorityLabels[task.priority]}</span>}
                      <span className="property-edit-label">
                        수정 <Icon name="chevron" size={14} />
                      </span>
                    </summary>
                    <div className="capture-properties">
                      <label>
                        기한
                        <input
                          type="date"
                          aria-label={`정리한 기한 ${index + 1}`}
                          value={task.dueDate || ''}
                          onChange={(e) => update(index, { dueDate: e.target.value || null })}
                        />
                      </label>
                      <label>
                        분류
                        <input
                          aria-label={`정리한 분류 ${index + 1}`}
                          value={task.category || ''}
                          placeholder="분류 없음"
                          maxLength={24}
                          onChange={(e) => update(index, { category: e.target.value || null })}
                        />
                      </label>
                      <label>
                        우선순위
                        <select
                          aria-label={`정리한 우선순위 ${index + 1}`}
                          value={task.priority}
                          onChange={(e) => update(index, { priority: e.target.value as Priority })}
                        >
                          {Object.entries(priorityLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </details>
                </fieldset>
              ))}
            </div>
            {visibleReview.warnings.map((warning) => (
              <p className="capture-warning" key={warning}>
                {warning}
              </p>
            ))}
            <label className="include-today">
              <input
                type="checkbox"
                checked={includeToday}
                onChange={(e) => setIncludeToday(e.target.checked)}
              />
              모두 오늘 할 일에 넣기
            </label>
            <p className="capture-destination">
              {includeToday
                ? '기한과 관계없이 모두 오늘 계획에 넣어요. 정해 둔 분량보다 많아질 수 있어요.'
                : automatic
                  ? awaitingFirstPlan
                    ? dueTodayCount
                      ? '오늘까지 할 일은 모두 포함하고, 나머지 할 일에서 기본 분량을 채워요.'
                      : '전체 목록에 담고, 이 중에서 오늘 할 분량을 자동으로 골라요.'
                    : dueTodayCount
                      ? `오늘까지 할 일 ${dueTodayCount}개는 오늘 계획에 자동으로 넣어요. 나머지는 전체 목록에 담아요.`
                      : '전체 목록에 담아요. 이미 정한 오늘 분량은 바뀌지 않아요.'
                  : '전체 목록에 담아요. 오늘 할 일은 따로 고를 수 있어요.'}
            </p>
          </div>
        )}
        {error && (
          <p className="field-error" id="quick-error" role="alert">
            {error}
          </p>
        )}
        <div className="capture-submit">
          <button
            type="submit"
            className="primary-button add-submit"
            disabled={needsDateConfirmation}
          >
            {visibleReview
              ? `${visibleReview.tasks.length}개 담기`
              : recognize
                ? '메모 정리하기'
                : '그대로 담기'}
          </button>
          {visibleReview && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setReview(null)
                inputRef.current?.focus()
              }}
            >
              메모로 돌아가기
            </button>
          )}
        </div>
      </form>
      <details className="capture-help">
        <summary>어떤 표현을 알아보나요?</summary>
        <p>
          오늘·내일·모레, 다음 주 월요일, 11월 23일처럼 날짜가 분명한 표현을 알아봐요. 여러 문장과
          줄바꿈으로 적어도 돼요. ‘제출하고’, ‘정리하고’처럼 지원하는 행동 표현은 항목으로 나눠요.
          한 항목에 여러 일이 남으면 줄을 나눠 주세요.
        </p>
        <p>
          문맥에 따라 분류가 맞지 않을 수 있어요. 정리 결과에서 바꾸거나 자동 정리를 끄면 한 줄씩
          원문 그대로 담을 수 있어요.
        </p>
      </details>
    </section>
  )
}
