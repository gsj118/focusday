import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  appendDemo,
  applyUndo,
  calendarDate,
  createTask,
  isOverdue,
  isToday,
  selectCompleted,
  selectTasks,
  todaySummary,
  yesterdayTasks,
  updateTask,
  validateTitle,
  type AppData,
  type Task,
  type TaskDraft,
  type UndoAction,
  type View,
} from './domain'
import { loadData, saveData, type LoadResult } from './storage'
import { serializeBackup, prepareRestore, type RestoreMode } from './backup'
import { downloadJSON } from './download'
import { useToday } from './useToday'
import { useVisualViewport } from './useVisualViewport'
import { Icon } from './components/Icon'
import { TaskEditor } from './components/TaskEditor'
import { TaskRow } from './components/TaskRow'
import { UndoToast } from './components/UndoToast'
import { PlanPanel } from './components/PlanPanel'
import { DataPanel } from './components/DataPanel'

export default function App() {
  const [initial] = useState(() => loadData())
  const [data, setData] = useState<AppData>(initial.data)
  const current = useRef(data)
  const [guard, setGuard] = useState<LoadResult['state']>(initial.state)
  const [raw, setRaw] = useState(initial.raw)
  const [loadReason, setLoadReason] = useState(initial.reason)
  const [saveStatus, setSaveStatus] = useState<'initial' | 'saved' | 'error'>('initial')
  const [view, setView] = useState<View>('today')
  const [title, setTitle] = useState('')
  const [inputError, setInputError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [panel, setPanel] = useState<'plan' | 'data' | null>(null)
  const [undo, setUndo] = useState<UndoAction | null>(null)
  const undoToken = useRef(0)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [notice, setNotice] = useState<{ text: string; taskId?: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const composer = useRef<HTMLFormElement>(null)
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const pendingFocus = useRef<HTMLElement | 'input' | 'completed' | null>(null)
  const completedSummary = useRef<HTMLElement>(null)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const today = useToday()
  useVisualViewport()
  const active = selectTasks(data.tasks, view, today, query)
  const completed = selectCompleted(data.tasks, query)
  const todayCount = data.tasks.filter((t) => isToday(t, today)).length
  const summary = todaySummary(data.tasks, today)
  const yesterdayCount = yesterdayTasks(data.tasks, today).length
  const allCount = data.tasks.filter((t) => !t.completedAt).length
  const searchCount = active.length + (view === 'all' ? completed.length : 0)

  function persist(next: AppData) {
    const result = saveData(next)
    setSaveStatus(result.ok ? 'saved' : 'error')
    return result.ok
  }
  function change(updater: (tasks: Task[]) => Task[]) {
    const next: AppData = { version: 1, tasks: updater(current.current.tasks) }
    current.current = next
    setData(next)
    if (guard === 'ready') persist(next)
  }
  function focusInput() {
    input.current?.focus()
    composer.current?.scrollIntoView({ block: 'nearest' })
  }
  function openEditor(task: Task, origin: HTMLElement) {
    returnFocus.current = origin
    setEditing(task)
    setNotice(null)
  }
  function closeEditor() {
    pendingFocus.current = returnFocus.current || 'input'
    setEditing(null)
  }
  function focusAfterRemoval(task: Task) {
    const rows = [...document.querySelectorAll<HTMLElement>('.task-row')]
    const index = rows.findIndex((row) => row.dataset.taskId === task.id)
    const next = rows[index + 1] || rows[index - 1]
    pendingFocus.current = next?.querySelector<HTMLElement>('input') || 'input'
  }
  function toggle(task: Task) {
    if (!task.completedAt) {
      setUndo({ token: ++undoToken.current, kind: 'complete', task })
    }
    focusAfterRemoval(task)
    change((tasks) =>
      tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completedAt: t.completedAt ? null : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
    if (task.completedAt) setNotice({ text: '미완료로 복원했습니다.' })
  }
  function toggleFocus(task: Task, fromPlan = false) {
    const removing = task.focusDate === today
    change((tasks) =>
      tasks.map((t) =>
        t.id === task.id
          ? { ...t, focusDate: removing ? null : today, updatedAt: new Date().toISOString() }
          : t,
      ),
    )
    if (removing && task.dueDate && task.dueDate <= today)
      setNotice({ text: '집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', taskId: task.id })
    else {
      setNotice({
        text: removing
          ? '집중을 해제했습니다. 전체에는 남아 있습니다.'
          : '기한을 바꾸지 않고 오늘 집중으로 선택했습니다.',
      })
      if (removing && view === 'today' && !fromPlan) focusAfterRemoval(task)
    }
  }
  function saveEditor(draft: TaskDraft) {
    const task = editing!
    change((tasks) => tasks.map((t) => (t.id === task.id ? updateTask(t, draft) : t)))
    if (
      task.focusDate === today &&
      draft.focusDate !== today &&
      draft.dueDate &&
      draft.dueDate <= today
    )
      setNotice({ text: '집중은 해제했습니다. 기한 때문에 오늘에도 표시됩니다.', taskId: task.id })
    closeEditor()
  }
  function retry() {
    if (guard === 'ready') {
      persist(current.current)
      return
    }
    const loaded = loadData()
    if (loaded.state !== 'ready') {
      setGuard(loaded.state)
      setRaw(loaded.raw)
      setLoadReason(loaded.reason)
      return
    }
    const ids = new Set(current.current.tasks.map((t) => t.id))
    const next: AppData = {
      version: 1,
      tasks: [...loaded.data.tasks.filter((t) => !ids.has(t.id)), ...current.current.tasks],
    }
    current.current = next
    setData(next)
    setGuard('ready')
    persist(next)
  }
  function downloadRaw() {
    downloadJSON(raw ?? '', 'focusday-original.json')
  }
  function openPanel(kind: 'plan' | 'data', origin: HTMLElement) {
    if (editing || confirmReset) return
    const menu = origin.closest('details')
    returnFocus.current = menu?.querySelector('summary') || origin
    if (menu) menu.open = false
    setNotice(null)
    setPanel(kind)
  }
  function closePanel() {
    pendingFocus.current = returnFocus.current || 'input'
    setPanel(null)
  }
  function addExamples() {
    const next = appendDemo(current.current.tasks, today)
    if (next === current.current.tasks) {
      setNotice({ text: '예시가 이미 추가되어 있습니다.' })
      return
    }
    change(() => next)
    setNotice({ text: '예시 5개를 추가했습니다.' })
  }
  function exportBackup() {
    try {
      const serialized = serializeBackup(current.current)
      if (!serialized.ok) return serialized
      downloadJSON(serialized.content, `focusday-backup-${today}.json`)
      return {
        ok: true,
        reason: `전체 ${current.current.tasks.length}개 백업 파일 다운로드를 시작했습니다. (${(serialized.byteSize / 1024 / 1024).toFixed(2)}MiB)`,
      }
    } catch {
      return { ok: false, reason: '백업 파일을 만들지 못했습니다. 다시 시도해 주세요.' }
    }
  }
  function restoreBackup(incoming: AppData, mode: RestoreMode) {
    if (guard !== 'ready')
      return { ok: false, reason: '저장 보호 중입니다. 기존 원본 복구 절차를 먼저 진행해 주세요.' }
    const next = prepareRestore(current.current, incoming, mode).data
    const result = saveData(next)
    if (!result.ok)
      return {
        ok: false,
        reason:
          '복원 저장에 실패했습니다. 적용 전 목록과 저장 원본을 유지했습니다. 다시 시도하거나 취소해 주세요.',
      }
    current.current = next
    setData(next)
    setSaveStatus('saved')
    setUndo(null)
    setEditing(null)
    setQuery('')
    setInputError('')
    setCompletedOpen(false)
    setNotice({ text: `복원 완료: 전체 ${next.tasks.length}개를 저장했습니다.` })
    return { ok: true, reason: '' }
  }
  useEffect(() => {
    if (!confirmReset) return
    const dialog = resetDialog.current!
    dialog.showModal()
    return () => dialog.close()
  }, [confirmReset])
  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (!target || editing || panel) return
    pendingFocus.current = null
    if (target === 'completed') {
      completedSummary.current?.focus()
      completedSummary.current?.scrollIntoView({ block: 'nearest' })
      return
    }
    if (target !== 'input' && target.isConnected) target.focus()
    else focusInput()
  }, [editing, panel, data, view, completedOpen])
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        e.isComposing ||
        composing.current ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.shiftKey ||
        editing ||
        panel ||
        confirmReset ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        focusInput()
      }
      if (e.key === '/') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [editing, panel, confirmReset])

  const nav = (mobile = false) => (
    <nav
      className={mobile ? 'mobile-nav' : 'main-nav'}
      aria-label={mobile ? '모바일 보기' : '할 일 보기'}
    >
      {(['today', 'all'] as const).map((item) => (
        <button
          key={item}
          className={view === item ? 'active' : ''}
          aria-current={view === item ? 'page' : undefined}
          onClick={() => {
            setView(item)
            setNotice(null)
          }}
        >
          <Icon name={item === 'today' ? 'sun' : 'list'} />
          <span>{item === 'today' ? '오늘' : '전체'}</span>
          <span className="nav-count">{item === 'today' ? todayCount : allCount}</span>
        </button>
      ))}
    </nav>
  )
  const menu = (
    <details
      className="app-menu"
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.currentTarget.open = false
      }}
    >
      <summary aria-label="예시 및 앱 정보">
        <Icon name="more" />
        <span>예시 및 앱 정보</span>
      </summary>
      <div className="menu-content">
        <strong>가볍게 시작해 보세요</strong>
        <p>예시는 직접 선택할 때만 추가됩니다.</p>
        <button className="secondary-button" onClick={addExamples}>
          예시로 둘러보기
        </button>
        <button
          className="text-button"
          disabled={!data.tasks.some((t) => t.isDemo)}
          onClick={() => {
            change((tasks) => tasks.filter((t) => !t.isDemo))
            setUndo(null)
            setNotice({ text: '예시만 제거했습니다. 직접 만든 할 일은 유지됩니다.' })
          }}
        >
          예시 데이터 제거
        </button>
        <hr />
        <button
          className="secondary-button"
          onClick={(event) => openPanel('data', event.currentTarget)}
        >
          백업·복원
        </button>
        <hr />
        <strong>Focusday 1.2.0</strong>
        <p>
          계정 없이 이 브라우저에 저장합니다. JSON 파일로 직접 백업할 수 있습니다. 자동 서버
          백업·기기 간 동기화는 제공하지 않습니다.
        </p>
        <p className="field-hint">
          N 새 입력 · / 검색
          <br />
          입력 중에는 단축키가 실행되지 않습니다.
        </p>
      </div>
    </details>
  )
  const row = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      onToggle={toggle}
      onFocus={toggleFocus}
      onEdit={openEditor}
    />
  )
  const section = (label: string, tasks: Task[], overdue = false) =>
    tasks.length > 0 && (
      <section className={`task-section ${overdue ? 'overdue-section' : ''}`} aria-label={label}>
        <div className="section-heading">
          <h2>{label}</h2>
          <span>{tasks.length}</span>
          {overdue && <p>기한을 확인해 주세요</p>}
        </div>
        <ul className="task-list">{tasks.map(row)}</ul>
      </section>
    )

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        할 일 목록으로 이동
      </a>
      <aside className="sidebar">
        <a className="brand" href="#main" aria-label="Focusday">
          <span className="brand-icon">
            <Icon name="check" size={23} />
          </span>
          <span>
            Focusday<span className="brand-tagline">오늘에 집중하는 작은 습관</span>
          </span>
        </a>
        <p className="nav-label">나의 할 일</p>
        {nav()}
        <div className="sidebar-bottom">
          {menu}
          <div className="local-note">
            <Icon name="storage" size={16} />
            <span>내 브라우저, 나의 할 일</span>
          </div>
        </div>
      </aside>
      <main id="main" className="main-content">
        <div className="topline">
          <span>
            나의 하루 <span className="breadcrumb-slash">/</span>{' '}
            {view === 'today' ? '오늘' : '전체'}
          </span>
          <div className="save-status" role="status">
            <span
              className={`status-dot ${saveStatus === 'saved' && guard === 'ready' ? 'saved' : ''}`}
            />
            {guard !== 'ready'
              ? '저장 보호 중'
              : saveStatus === 'error'
                ? '저장 실패'
                : saveStatus === 'saved'
                  ? '저장됨'
                  : initial.raw
                    ? '로컬 데이터 불러옴'
                    : '이 브라우저에 저장'}
          </div>
        </div>
        <header className="page-header">
          <div>
            <div className="page-title">
              <h1>{view === 'today' ? '오늘' : '전체 할 일'}</h1>
              <span className="header-date">
                {new Intl.DateTimeFormat('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                }).format(calendarDate(today))}
              </span>
            </div>
            <p>
              {view === 'today'
                ? '해야 할 모든 일보다, 오늘 할 일에 집중하세요.'
                : '생각난 일은 담아두고, 오늘 할 일을 골라보세요.'}
            </p>
          </div>
          <div className="search-field">
            <Icon name="search" size={18} />
            <label className="sr-only" htmlFor="search">
              제목·분류 검색
            </label>
            <input
              ref={search}
              id="search"
              type="search"
              value={query}
              placeholder="제목·분류 검색"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                aria-label="검색 지우기"
                onClick={() => {
                  setQuery('')
                  search.current?.focus()
                }}
              >
                <Icon name="close" size={17} />
              </button>
            )}
          </div>
        </header>
        {view === 'today' && (
          <section className="today-planning" aria-label="오늘 집중 요약">
            <div>
              <p>
                직접 집중으로 고른 <strong>{summary.focused}개</strong> · 기한으로 표시된{' '}
                <strong>{summary.dueOnly}개</strong>
              </p>
              {yesterdayCount > 0 && (
                <p className="yesterday-note">
                  어제 마치지 못한 일 {yesterdayCount}개 · 계획에서 이어갈 일을 골라보세요.
                </p>
              )}
            </div>
            <button
              className="secondary-button"
              onClick={(event) => openPanel('plan', event.currentTarget)}
            >
              <Icon name="sun" size={18} />
              오늘 계획하기
            </button>
          </section>
        )}
        <div className="mobile-menu">{menu}</div>
        {guard !== 'ready' && (
          <section className="storage-banner" role="alert">
            <strong>{loadReason}</strong>
            <p>
              원본은 자동으로 덮어쓰지 않습니다. 현재 탭에서 만든 할 일은 아직 저장되지 않습니다.
            </p>
            <div>
              {guard === 'unavailable' ? (
                <button className="secondary-button" onClick={retry}>
                  다시 읽기
                </button>
              ) : (
                <>
                  <button className="secondary-button" onClick={downloadRaw}>
                    원본 다운로드
                  </button>
                  <button className="text-button danger" onClick={() => setConfirmReset(true)}>
                    원본 초기화…
                  </button>
                </>
              )}
            </div>
          </section>
        )}
        {guard === 'ready' && saveStatus === 'error' && (
          <section className="storage-banner" role="alert">
            <p>
              변경 사항을 이 브라우저에 저장하지 못했습니다. 현재 탭에서는 사용할 수 있지만
              새로고침하면 변경 내용이 사라질 수 있습니다.
            </p>
            <button className="secondary-button" onClick={retry}>
              저장 재시도
            </button>
          </section>
        )}
        <form
          ref={composer}
          className="quick-add"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (composing.current) return
            const error = validateTitle(title)
            if (error) {
              setInputError(error)
              input.current?.focus()
              return
            }
            change((tasks) => [...tasks, createTask(title, view, today)])
            setTitle('')
            setInputError('')
            focusInput()
          }}
        >
          <span className="add-icon">
            <Icon name="plus" size={22} />
          </span>
          <label className="sr-only" htmlFor="quick-title">
            새 할 일 제목
          </label>
          <input
            ref={input}
            id="quick-title"
            value={title}
            maxLength={200}
            placeholder="무엇을 해야 하나요?"
            autoComplete="off"
            onChange={(e) => {
              setTitle(e.target.value)
              setInputError('')
            }}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={() => {
              composing.current = false
              lastCompositionEnd.current = Date.now()
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                (composing.current ||
                  e.nativeEvent.isComposing ||
                  e.keyCode === 229 ||
                  Date.now() - lastCompositionEnd.current < 80)
              )
                e.preventDefault()
            }}
            aria-invalid={!!inputError}
            aria-describedby={inputError ? 'quick-error' : 'quick-hint'}
          />
          <button className="primary-button add-submit" type="submit">
            <span className="desktop-add">추가</span>
            <span className="mobile-add">+ 할 일 추가</span>
          </button>
        </form>
        <div className="composer-caption">
          <span id="quick-hint">
            {view === 'today'
              ? '새 할 일은 오늘에 담깁니다'
              : '먼저 담고, 필요할 때 집중하기로 골라보세요'}
          </span>
          <span className="enter-hint">
            Enter로 추가 <kbd>↵</kbd>
          </span>
        </div>
        {inputError && (
          <p className="field-error" id="quick-error" role="alert">
            {inputError}
          </p>
        )}
        {notice && (
          <div className="inline-notice">
            <span role="status">{notice.text}</span>
            {notice.taskId && (
              <button
                className="text-button"
                onClick={(e) => {
                  const task = data.tasks.find((t) => t.id === notice.taskId)
                  if (task) openEditor(task, e.currentTarget)
                }}
              >
                기한 편집
              </button>
            )}
            <button className="icon-button" aria-label="안내 닫기" onClick={() => setNotice(null)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        {query.trim() && (
          <p className="search-results" role="status">
            검색 결과 {searchCount}개 <span>현재 {view === 'today' ? '오늘' : '전체'} 보기</span>
          </p>
        )}
        {active.length === 0 && (!query.trim() || searchCount === 0) && (
          <section className="empty-state">
            <div className="empty-icon">
              <Icon name={query.trim() ? 'search' : 'sun'} size={32} />
            </div>
            <h2>
              {query.trim()
                ? '일치하는 할 일이 없습니다'
                : data.tasks.length === 0
                  ? '해야 할 일을 하나 적어보세요'
                  : view === 'today'
                    ? '오늘은 비어 있습니다'
                    : '미완료 할 일이 없습니다'}
            </h2>
            <p>
              {query.trim()
                ? `“${query}” 검색어를 지우거나 다른 말로 찾아보세요.`
                : data.tasks.length === 0
                  ? '생각난 일 하나부터. 계정 없이 가볍게 시작하세요.'
                  : view === 'today'
                    ? '전체 할 일에서 오늘 할 일을 고르거나 새로 추가해 보세요.'
                    : '완료한 일은 아래에서 다시 확인하고 복원할 수 있어요.'}
            </p>
            <div>
              {query.trim() ? (
                <button className="secondary-button" onClick={() => setQuery('')}>
                  검색 지우기
                </button>
              ) : (
                <>
                  <button className="primary-button" onClick={focusInput}>
                    {data.tasks.length === 0 ? '첫 할 일 추가' : '+ 새 할 일'}
                  </button>
                  {data.tasks.length === 0 ? (
                    <button className="text-button" onClick={addExamples}>
                      예시로 둘러보기 <Icon name="arrow" size={15} />
                    </button>
                  ) : (
                    view === 'today' && (
                      <button className="text-button" onClick={() => setView('all')}>
                        전체 할 일 보기 <Icon name="arrow" size={15} />
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </section>
        )}
        {view === 'today' ? (
          <>
            {section(
              '기한 초과',
              active.filter((t) => isOverdue(t, today)),
              true,
            )}
            {section(
              '오늘',
              active.filter((t) => !isOverdue(t, today)),
            )}
          </>
        ) : (
          section('미완료 할 일', active)
        )}
        {view === 'all' && data.tasks.some((t) => t.completedAt) && (
          <details
            className="completed-section"
            open={completedOpen || !!query.trim()}
            onToggle={(e) => setCompletedOpen(e.currentTarget.open)}
          >
            <summary ref={completedSummary}>
              <Icon name="chevron" size={18} />
              완료된 할 일 <span>{completed.length}</span>
            </summary>
            {completed.length ? (
              <ul className="task-list">{completed.map(row)}</ul>
            ) : (
              <p className="field-hint">검색어와 일치하는 완료 항목이 없습니다.</p>
            )}
          </details>
        )}
        <footer className="page-footer">
          <span>생각난 일은 빠르게 담고, 오늘 할 일만 선명하게.</span>
          <span>Focusday</span>
        </footer>
      </main>
      {nav(true)}
      {panel === 'plan' && (
        <PlanPanel
          tasks={data.tasks}
          today={today}
          guard={guard}
          saveError={saveStatus === 'error'}
          onFocus={(task) => toggleFocus(task, true)}
          onRetry={retry}
          onClose={closePanel}
          onAll={() => {
            setView('all')
            closePanel()
          }}
        />
      )}
      {panel === 'data' && (
        <DataPanel
          data={data}
          guard={guard}
          saveError={saveStatus === 'error'}
          onExport={exportBackup}
          onRestore={restoreBackup}
          onClose={closePanel}
        />
      )}
      {editing && (
        <TaskEditor
          key={editing.id}
          task={editing}
          today={today}
          onClose={closeEditor}
          onSave={saveEditor}
          onDelete={() => {
            const task = editing
            change((tasks) => tasks.filter((t) => t.id !== task.id))
            setUndo({ token: ++undoToken.current, kind: 'delete', task })
            closeEditor()
          }}
        />
      )}
      {undo && (
        <UndoToast
          key={undo.token}
          undo={undo}
          onUndo={() => {
            change((tasks) => applyUndo(tasks, undo))
            setUndo(null)
            setNotice({ text: '실행을 취소했습니다.' })
            focusInput()
          }}
          onExpire={(token) => setUndo((previous) => (previous?.token === token ? null : previous))}
          onCompleted={() => {
            pendingFocus.current = 'completed'
            setQuery('')
            setView('all')
            setCompletedOpen(true)
          }}
        />
      )}
      {confirmReset && (
        <dialog
          ref={resetDialog}
          className="confirm-dialog"
          aria-labelledby="reset-heading"
          onCancel={(e) => {
            e.preventDefault()
            setConfirmReset(false)
          }}
        >
          <h2 id="reset-heading">저장 원본을 초기화할까요?</h2>
          <p>
            손상되거나 지원하지 않는 원본을 지우고 현재 탭의 할 일 {data.tasks.length}개를
            저장합니다. 원본은 되돌릴 수 없습니다. 필요한 경우 먼저 다운로드해 주세요.
          </p>
          {saveStatus === 'error' && (
            <p className="field-error" role="alert">
              초기화에 실패했습니다. 원본을 유지했습니다. 브라우저 저장 권한을 확인하거나 다시
              시도해 주세요.
            </p>
          )}
          <div>
            <button className="secondary-button" autoFocus onClick={() => setConfirmReset(false)}>
              취소
            </button>
            <button
              className="danger-button"
              onClick={() => {
                if (persist(current.current)) {
                  setGuard('ready')
                  setRaw(null)
                  setLoadReason('')
                  setConfirmReset(false)
                } else
                  setLoadReason('초기화에 실패했습니다. 원본을 유지했습니다. 다시 시도해 주세요.')
              }}
            >
              원본 삭제 후 현재 목록 저장
            </button>
          </div>
        </dialog>
      )}
    </div>
  )
}
