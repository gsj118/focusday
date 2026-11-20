import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  applyUndo,
  calendarDate,
  createTask,
  isOverdue,
  isToday,
  localDate,
  selectCompleted,
  selectTasks,
  todaySummary,
  yesterdayTasks,
  updateTask,
  type AppData,
  type Task,
  type TaskDraft,
  type UndoAction,
  type View,
} from './domain'
import { loadData, saveData, type LoadResult } from './storage'
import { parseCapture } from './capture'
import { automaticToday, nextCandidate, selectionReason } from './automation'
import { useAutomation } from './useAutomation'
import type { AppSession } from './session'
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
import { PreferencesPanel } from './components/PreferencesPanel'
import { dailySentence, selectAchievements, completionMilestone } from './encouragement'
import { usePreferences } from './usePreferences'

export default function App({ session }: { session: AppSession }) {
  const { demo, getStorage } = session
  const [initial] = useState(() => loadData(getStorage))
  const [data, setData] = useState<AppData>(initial.data)
  const current = useRef(data)
  const [guard, setGuard] = useState<LoadResult['state']>(initial.state)
  const [raw, setRaw] = useState(initial.raw)
  const [loadReason, setLoadReason] = useState(initial.reason)
  const [saveStatus, setSaveStatus] = useState<'initial' | 'saved' | 'error'>('initial')
  const [view, setView] = useState<View>('today')
  const [title, setTitle] = useState('')
  const [recognize, setRecognize] = useState(true)
  const [inputError, setInputError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [panel, setPanel] = useState<'plan' | 'data' | 'preferences' | null>(null)
  const [undo, setUndo] = useState<UndoAction | null>(null)
  const undoToken = useRef(0)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [encouragement, setEncouragement] = useState<{
    token: number
    day: string
    count: number
    text: string
  } | null>(null)
  const [notice, setNotice] = useState<{ text: string; taskId?: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const composer = useRef<HTMLFormElement>(null)
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const pendingFocus = useRef<HTMLElement | 'input' | 'completed' | 'achievements' | null>(null)
  const completedSummary = useRef<HTMLElement>(null)
  const achievementsSummary = useRef<HTMLElement>(null)
  const achievementFocus = useRef(false)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const today = useToday()
  const ui = usePreferences(getStorage)
  const auto = useAutomation(getStorage, today)
  const captured = parseCapture(title, today, recognize)
  const planned = auto.state.enabled
    ? automaticToday(data.tasks, today, auto.state)
    : data.tasks.filter((t) => isToday(t, today))
  const candidate = auto.state.enabled ? nextCandidate(planned, today, auto.state) : null
  const featured = view === 'today' && !query.trim() ? candidate : null
  useVisualViewport()
  const active =
    auto.state.enabled && view === 'today'
      ? planned.filter((t) =>
          `${t.title} ${t.category ?? ''}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
        )
      : selectTasks(data.tasks, view, today, query)
  const listed = featured ? active.filter((t) => t.id !== featured.id) : active
  const completed = selectCompleted(data.tasks, query)
  const achievements = selectAchievements(data.tasks, today, demo)
  const todayCount = planned.length
  const summary = todaySummary(data.tasks, today)
  const yesterdayCount = yesterdayTasks(data.tasks, today).length
  const allCount = data.tasks.filter((t) => !t.completedAt).length
  const searchCount = active.length + (view === 'all' ? completed.length : 0)

  function persist(next: AppData) {
    const result = saveData(next, getStorage)
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
    const selector =
      task.completedAt && view === 'today' ? '.achievements-section .task-row' : '.task-row'
    const rows = [...document.querySelectorAll<HTMLElement>(selector)].filter(
      (row) => row.getClientRects().length > 0 && !row.closest('details:not([open])'),
    )
    const index = rows.findIndex((row) => row.dataset.taskId === task.id)
    const next = rows[index + 1] || rows[index - 1]
    pendingFocus.current =
      next?.querySelector<HTMLElement>('input') ||
      (task.completedAt && view === 'today' ? 'achievements' : 'input')
  }
  function toggle(task: Task) {
    const actual = current.current.tasks.find((item) => item.id === task.id)
    if (!actual) return
    const now = new Date()
    const actionDay = localDate(now)
    const stamp = now.toISOString()
    const next = current.current.tasks.map((t) =>
      t.id === actual.id
        ? { ...t, completedAt: t.completedAt ? null : stamp, updatedAt: stamp }
        : t,
    )
    focusAfterRemoval(task)
    const before = selectAchievements(current.current.tasks, actionDay, demo).length
    change(() => next)
    if (auto.state.currentTaskId === actual.id) auto.update({ currentTaskId: null })
    setEncouragement(null)
    if (!actual.completedAt) {
      const token = ++undoToken.current
      setUndo({ token, kind: 'complete', task: actual })
      const count = selectAchievements(next, actionDay, demo).length
      const milestone = actual.isDemo && !demo ? null : completionMilestone(before, count)
      if (milestone) {
        const text = ui.processMilestone(actionDay, milestone)
        if (text) setEncouragement({ token, day: actionDay, count, text })
      }
    } else {
      if (undo?.kind === 'complete' && undo.task.id === actual.id) setUndo(null)
      setNotice({ text: '미완료로 복원했습니다.' })
    }
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
          ? auto.state.enabled
            ? '직접 선택한 집중을 해제했습니다. 자동 계획에서 다시 추천될 수 있습니다.'
            : '집중을 해제했습니다. 전체에는 남아 있습니다.'
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
    const loaded = loadData(getStorage)
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
  function openPanel(kind: 'plan' | 'data' | 'preferences', origin: HTMLElement) {
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
    const url = new URL(window.location.href)
    url.searchParams.set('demo', '1')
    window.location.assign(url.href)
  }
  function leaveDemo() {
    const url = new URL(window.location.href)
    url.searchParams.delete('demo')
    window.location.assign(url.href)
  }
  function exportBackup() {
    try {
      const serialized = serializeBackup(current.current)
      if (!serialized.ok) return serialized
      downloadJSON(serialized.content, `focusday-${demo ? 'demo-' : ''}backup-${today}.json`)
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
    const result = saveData(next, getStorage)
    if (!result.ok)
      return {
        ok: false,
        reason:
          '복원 저장에 실패했습니다. 적용 전 목록과 저장 원본을 유지했습니다. 다시 시도하거나 취소해 주세요.',
      }
    current.current = next
    setData(next)
    auto.update({ currentTaskId: null, skippedTaskIds: [] })
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
    if (editing || panel) return
    if (!target) {
      if (achievementFocus.current && document.activeElement === document.body)
        achievementsSummary.current?.focus()
      return
    }
    pendingFocus.current = null
    if (target === 'completed') {
      completedSummary.current?.focus()
      completedSummary.current?.scrollIntoView({ block: 'nearest' })
      return
    }
    if (target === 'achievements') {
      achievementsSummary.current?.focus()
      achievementsSummary.current?.scrollIntoView({ block: 'nearest' })
      return
    }
    if (
      target !== 'input' &&
      target.isConnected &&
      target.getClientRects().length > 0 &&
      (!target.closest('details:not([open])') || target.matches('summary'))
    )
      target.focus()
    else focusInput()
  }, [editing, panel, data, view, completedOpen, today, achievementsOpen, auto.state])
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
          <span>{item === 'today' ? '오늘' : '전체 할 일'}</span>
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
        <p>예시 체험은 개인 목록과 분리됩니다. 변경은 체험 화면에만 적용됩니다.</p>
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
        <button
          className="secondary-button"
          onClick={(event) => openPanel('preferences', event.currentTarget)}
        >
          문구와 격려 설정
        </button>
        {ui.error && (
          <p className="field-hint">
            설정 저장 확인이 필요합니다. 문구와 격려 설정에서 복구할 수 있습니다.
          </p>
        )}
        <hr />
        <strong>Focusday 1.5.0</strong>
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
  const row = (task: Task, showCompletionTime = false) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      onToggle={toggle}
      onFocus={toggleFocus}
      onEdit={openEditor}
      showCompletionTime={showCompletionTime}
      reason={
        auto.state.enabled && view === 'today' && !task.completedAt
          ? selectionReason(task, today)
          : undefined
      }
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
        <ul className="task-list">{tasks.map((task) => row(task))}</ul>
      </section>
    )

  return (
    <div
      className={`app-shell ${auto.state.enabled ? 'automation-on' : ''}`}
      onFocusCapture={(event) => {
        achievementFocus.current = !!(event.target as HTMLElement).closest('.achievements-section')
      }}
    >
      <a className="skip-link" href="#main">
        할 일 목록으로 이동
      </a>
      <aside className="sidebar">
        <a className="brand" href="#main" aria-label="Focusday">
          <span className="brand-icon">
            <Icon name="check" size={18} />
          </span>
          <span>
            Focusday<span className="brand-tagline">정리는 자동으로, 실행은 하나씩</span>
          </span>
        </a>
        <button
          className="sidebar-search"
          aria-label="검색"
          onClick={() => {
            search.current?.focus()
            search.current?.scrollIntoView({ block: 'center' })
          }}
        >
          <Icon name="search" size={18} />
          검색
          <kbd>/</kbd>
        </button>
        <p className="nav-label">나의 할 일</p>
        {nav()}
        <div className="sidebar-bottom">
          <button
            className="sidebar-utility"
            onClick={(event) => openPanel('data', event.currentTarget)}
          >
            <Icon name="storage" size={18} />
            백업·복원
          </button>
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
            Focusday <span className="breadcrumb-slash">/</span>{' '}
            {view === 'today' ? '오늘' : '전체 할 일'}
          </span>
          <div className="save-status" role="status">
            <span
              className={`status-dot ${saveStatus === 'saved' && guard === 'ready' ? 'saved' : ''}`}
            />
            {demo
              ? '체험 중 · 저장되지 않음'
              : guard !== 'ready'
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
          <div className="page-heading">
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
            <p className={view === 'today' ? 'daily-sentence' : undefined}>
              {view === 'today'
                ? dailySentence(today, ui.preferences.sentenceMode, ui.preferences.customSentence)
                : '생각난 일은 담아두고, 오늘 할 일을 골라보세요.'}
            </p>
          </div>
        </header>
        {demo && (
          <section className="demo-banner" aria-label="예시 체험 안내">
            <div>
              <strong>자동화 체험</strong>
              <span>개인 목록은 그대로 · 새로고침하면 체험 초기화</span>
            </div>
            <div className="demo-actions">
              <button className="text-button" onClick={() => window.location.reload()}>
                처음부터 체험
              </button>
              <button className="secondary-button" onClick={leaveDemo}>
                내 할 일 사용하기
              </button>
            </div>
          </section>
        )}
        <section className="automation-controls" aria-label="자동 계획 설정">
          <label className="automation-toggle">
            <input
              type="checkbox"
              checked={auto.state.enabled}
              disabled={auto.blocked}
              onChange={(e) =>
                auto.update({ enabled: e.target.checked, currentTaskId: null, skippedTaskIds: [] })
              }
            />
            자동 계획
          </label>
          {auto.state.enabled && (
            <label className="daily-limit">
              기본 분량{' '}
              <select
                aria-label="오늘 기본 분량"
                value={auto.state.limit}
                onChange={(e) => auto.update({ limit: Number(e.target.value) as 1 | 3 | 5 })}
              >
                <option value={1}>1개</option>
                <option value={3}>3개</option>
                <option value={5}>5개</option>
              </select>
            </label>
          )}
          <button
            className="text-button"
            onClick={(event) => openPanel('plan', event.currentTarget)}
          >
            오늘 계획하기
          </button>
        </section>
        {auto.error && (
          <section className="storage-banner" role="alert">
            <p>{auto.error}</p>
            <button className="secondary-button" onClick={auto.retry}>
              자동 계획 설정 다시 읽기·저장
            </button>
            {auto.blocked && (
              <details>
                <summary>자동 계획 설정 초기화…</summary>
                <p>자동 계획 설정만 기본값으로 바꿉니다. 할 일과 문구 설정은 유지합니다.</p>
                <button className="secondary-button" onClick={auto.reset}>
                  자동 계획 설정만 초기화
                </button>
              </details>
            )}
          </section>
        )}
        {view === 'today' && !auto.state.enabled && (
          <section className="today-planning" aria-label="오늘 집중 요약">
            <div className="planning-copy">
              <h2>오늘 집중</h2>
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
        <div className="list-toolbar">
          <div className="list-label">
            <Icon name="list" size={17} />
            <span>할 일 목록</span>
            <span className="list-hint">제목을 눌러 편집</span>
          </div>
          <div className="search-field">
            <Icon name="search" size={17} />
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
        </div>
        <form
          ref={composer}
          className="quick-add"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (composing.current) return
            const parsed = parseCapture(title, localDate(), recognize)
            if (parsed.errors.length) {
              setInputError(
                parsed.errors
                  .map((error) =>
                    title.includes('\n') ? `${error.line}행: ${error.message}` : error.message,
                  )
                  .join(' '),
              )
              input.current?.focus()
              return
            }
            const additions = parsed.tasks.map((item) => ({
              ...createTask(item.title, auto.state.enabled ? 'all' : view, localDate()),
              dueDate: item.dueDate,
              category: item.category,
              priority: item.priority,
            }))
            change((tasks) => [...tasks, ...additions])
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
          <textarea
            rows={Math.min(4, Math.max(1, title.split('\n').length))}
            ref={input}
            id="quick-title"
            value={title}
            maxLength={24000}
            placeholder="할 일을 적어보세요"
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
              ) {
                e.preventDefault()
                return
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                composer.current?.requestSubmit()
              }
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
            {auto.state.enabled
              ? '전체에 담고, 오늘 할 일은 자동으로 고릅니다'
              : view === 'today'
                ? '새 할 일은 오늘에 담깁니다'
                : '먼저 담고, 필요할 때 집중하기로 골라보세요'}
          </span>
          <span className="enter-hint">Enter 추가 · Shift+Enter 줄바꿈</span>
        </div>
        <div className="capture-options">
          <label>
            <input
              type="checkbox"
              checked={recognize}
              onChange={(e) => {
                setRecognize(e.target.checked)
                setInputError('')
              }}
            />
            날짜·분류 자동 인식
          </label>
          <details>
            <summary>입력 예시</summary>
            <p>
              오늘 / 내일 / 모레 / YYYY-MM-DD를 맨 앞에, #분류와 !높음·!보통·!낮음을 맨 뒤에
              적으세요. 한 줄에 한 가지씩 등록합니다.
            </p>
            <button
              className="text-button"
              onClick={() => {
                setTitle('내일 발표 자료 제출 #학교 !높음')
                focusInput()
              }}
            >
              예시 문장 넣기
            </button>
          </details>
        </div>
        {title.trim() && (
          <div className="capture-preview" aria-label="입력 인식 결과">
            {captured.tasks.slice(0, 5).map((item) => (
              <p key={item.line}>
                <strong>{item.title}</strong>
                {item.dueDate && <span>기한 {item.dueDate}</span>}
                {item.category && <span>분류 {item.category}</span>}
                {item.priority !== 'none' && (
                  <span>
                    우선순위 {{ high: '높음', medium: '보통', low: '낮음' }[item.priority]}
                  </span>
                )}
              </p>
            ))}
            {captured.tasks.length > 5 && (
              <p>
                외 {captured.tasks.length - 5}개 · 전체 {captured.tasks.length}개를 함께 등록합니다.
              </p>
            )}
            {captured.errors.map((error) => (
              <p className="field-error" key={error.line}>
                {error.line}행: {error.message}
              </p>
            ))}
          </div>
        )}
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
        {view === 'today' && auto.state.enabled && !query.trim() && data.tasks.length > 0 && (
          <section className="day-overview" aria-label="오늘 자동 요약">
            <span>
              오늘 남은 일 <strong>{planned.length}개</strong>
            </span>
            <span>
              오늘 마친 일 <strong>{achievements.length}개</strong>
            </span>
            <span>
              기한 초과 <strong>{data.tasks.filter((t) => isOverdue(t, today)).length}개</strong>
            </span>
            {planned.length > auto.state.limit && (
              <span className="field-hint">
                기한이 된 일과 직접 고른 일은 기본 분량을 넘어도 유지합니다.
              </span>
            )}
          </section>
        )}
        {featured && (
          <section className="next-task" aria-label="지금 할 하나">
            <div className="next-heading">
              <h2>{auto.state.currentTaskId === featured.id ? '지금 하는 일' : '지금 할 하나'}</h2>
              <span>{selectionReason(featured, today)}</span>
            </div>
            <ul className="task-list">{row(featured)}</ul>
            <div className="next-actions">
              {auto.state.currentTaskId === featured.id ? (
                <button className="primary-button" onClick={() => toggle(featured)}>
                  이 일 완료하기
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={() => auto.update({ currentTaskId: featured.id })}
                >
                  이것부터 시작
                </button>
              )}
              <button
                className="text-button"
                onClick={() => {
                  auto.update({
                    currentTaskId: null,
                    skippedTaskIds: [...new Set([...auto.state.skippedTaskIds, featured.id])],
                  })
                  pendingFocus.current = 'input'
                }}
              >
                다른 일 보기
              </button>
              <span>완료하면 다음 후보가 준비됩니다.</span>
            </div>
          </section>
        )}
        {view === 'today' &&
          auto.state.enabled &&
          !query.trim() &&
          planned.length > 0 &&
          !candidate && (
            <section className="candidate-empty">
              <p>오늘 후보를 모두 살펴봤어요. 목록에서 직접 완료하거나 다시 골라보세요.</p>
              <button
                className="secondary-button"
                onClick={() => auto.update({ skippedTaskIds: [] })}
              >
                추천 다시 보기
              </button>
            </section>
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
                    ? achievements.length
                      ? `오늘 ${achievements.length}개를 마쳤어요`
                      : '오늘은 비어 있습니다'
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
                      예시로 둘러보기
                    </button>
                  ) : (
                    view === 'today' && (
                      <button className="text-button" onClick={() => setView('all')}>
                        전체 할 일 보기
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
              listed.filter((t) => isOverdue(t, today)),
              true,
            )}
            {section(
              featured ? '이어서 할 일' : '오늘',
              listed.filter((t) => !isOverdue(t, today)),
            )}
          </>
        ) : (
          section('미완료 할 일', active)
        )}
        {view === 'today' && (
          <details
            className="completed-section achievements-section"
            open={achievementsOpen}
            onToggle={(event) => {
              setAchievementsOpen(event.currentTarget.open)
              if (
                !event.currentTarget.open &&
                event.currentTarget.contains(document.activeElement) &&
                document.activeElement !== achievementsSummary.current
              )
                achievementsSummary.current?.focus()
            }}
          >
            <summary ref={achievementsSummary}>
              <Icon name="chevron" size={18} />
              오늘 마친 일 {achievements.length}개
            </summary>
            <p className="field-hint">
              {demo ? '이 체험 목록에서' : '현재 목록에 남아 있는 직접 만든 일 중'} 오늘 완료한
              항목입니다. 검색과 무관하며 완료 취소·삭제·복원에 따라 바뀝니다.
            </p>
            {achievements.length ? (
              <ul className="task-list">{achievements.map((task) => row(task, true))}</ul>
            ) : (
              <p className="achievement-empty">오늘 마친 일이 여기에 모입니다.</p>
            )}
          </details>
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
              <ul className="task-list">{completed.map((task) => row(task))}</ul>
            ) : (
              <p className="field-hint">검색어와 일치하는 완료 항목이 없습니다.</p>
            )}
          </details>
        )}
        <footer className="page-footer">
          <span>정리는 자동으로, 실행은 하나씩.</span>
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
      {panel === 'preferences' && (
        <PreferencesPanel
          preferences={ui.preferences}
          guard={ui.guard}
          storageError={ui.error}
          onSave={ui.save}
          onRetry={ui.retry}
          onReset={ui.reset}
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
            if (auto.state.currentTaskId === task.id) auto.update({ currentTaskId: null })
            setUndo({ token: ++undoToken.current, kind: 'delete', task })
            closeEditor()
          }}
        />
      )}
      {undo && (
        <UndoToast
          key={undo.token}
          undo={undo}
          encouragement={
            encouragement?.token === undo.token &&
            encouragement.day === today &&
            encouragement.count === achievements.length &&
            data.tasks.some((task) => task.id === undo.task.id && task.completedAt)
              ? encouragement.text
              : undefined
          }
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
