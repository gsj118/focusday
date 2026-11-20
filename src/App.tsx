import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
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
  type View,
} from './domain'
import { loadData, saveData, type LoadResult } from './storage'
import {
  automaticToday,
  nextCandidate,
  selectionReason,
  dailyPlan,
  resizePlan,
  addToPlan,
  rankedTasks,
  planCapturedTasks,
  type AutoState,
} from './automation'
import { undoTasks, undoLabel, type RecentAction } from './history'
import { CaptureComposer } from './components/CaptureComposer'
import type { MemoTask } from './memo'
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
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [panel, setPanel] = useState<'plan' | 'data' | 'preferences' | null>(null)
  const [undo, setUndo] = useState<RecentAction | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
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
  const returnFocus = useRef<HTMLElement | null>(null)
  const pendingFocus = useRef<HTMLElement | 'input' | 'completed' | 'achievements' | 'next' | null>(
    null,
  )
  const nextButton = useRef<HTMLButtonElement>(null)
  const finishHeading = useRef<HTMLHeadingElement>(null)
  const completedSummary = useRef<HTMLElement>(null)
  const achievementsSummary = useRef<HTMLElement>(null)
  const achievementFocus = useRef(false)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const today = useToday()
  const ui = usePreferences(getStorage)
  const auto = useAutomation(getStorage, today, data.tasks)
  const dayPlan = dailyPlan(data.tasks, today, auto.state)
  const planCompleted = dayPlan.filter((task) => task.completedAt).length
  const planFinished = dayPlan.length > 0 && dayPlan.length === planCompleted
  const outsideDue = data.tasks.filter(
    (task) =>
      !task.completedAt &&
      task.dueDate &&
      task.dueDate <= today &&
      !dayPlan.some((planned) => planned.id === task.id),
  )
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
  function remember(action: RecentAction) {
    setUndo(action)
    setToastVisible(true)
    setNotice(null)
  }
  function actionContext(message: string) {
    return { token: ++undoToken.current, day: today, message, autoBefore: auto.state }
  }
  function changePlan(patch: Partial<Omit<AutoState, 'version' | 'day'>>, message: string) {
    remember({ ...actionContext(message), kind: 'automation' })
    auto.update(patch)
  }
  function revert() {
    if (!undo) return
    if (undo.kind === 'automation' && undo.day !== today) return
    if (undo.kind !== 'automation') change((tasks) => undoTasks(tasks, undo))
    auto.restore(undo.autoBefore)
    if (undo.kind === 'capture' && !title.trim()) setTitle(undo.raw)
    setUndo(null)
    setToastVisible(false)
    setEncouragement(null)
    setNotice({ text: '최근 작업을 되돌렸어요.' })
    pendingFocus.current = undo.kind === 'capture' ? 'input' : 'next'
  }
  useEffect(() => {
    if (undo?.kind !== 'automation' || undo.day === today) return
    setUndo(null)
    setToastVisible(false)
    setNotice({ text: '날짜가 바뀌어 이전 계획은 되돌릴 수 없어요.' })
  }, [today, undo])
  function captureTasks(items: MemoTask[], raw: string, includeToday: boolean) {
    const additions = items.map((item) => ({
      ...createTask(item.title, includeToday ? 'today' : 'all', today),
      dueDate: item.dueDate,
      category: item.category,
      priority: item.priority,
    }))
    const dueCount = additions.filter((task) => task.dueDate && task.dueDate <= today).length
    const nextTasks = [...current.current.tasks, ...additions]
    const nextPlan = planCapturedTasks(
      current.current.tasks,
      additions,
      today,
      auto.state,
      includeToday,
    )
    remember({
      ...actionContext(
        `할 일 ${additions.length}개를 담았어요.${auto.state.enabled && dueCount && !includeToday ? ` 오늘까지 할 일 ${dueCount}개를 오늘 계획에 넣었어요.` : ''}`,
      ),
      kind: 'capture',
      tasks: additions,
      raw,
    })
    change(() => nextTasks)
    if (nextPlan !== auto.state) auto.update(nextPlan, nextTasks)
    setTitle('')
  }
  function focusInput() {
    input.current?.focus({ preventScroll: true })
    input.current?.scrollIntoView({ block: 'center' })
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
    if (featured?.id === task.id) pendingFocus.current = 'next'
    else focusAfterRemoval(task)
    const before = selectAchievements(current.current.tasks, actionDay, demo).length
    change(() => next)
    if (auto.state.currentTaskId === actual.id) auto.update({ currentTaskId: null })
    setEncouragement(null)
    if (!actual.completedAt) {
      const token = ++undoToken.current
      remember({
        token,
        day: today,
        message: '할 일을 완료했어요.',
        autoBefore: auto.state,
        kind: 'complete',
        task: actual,
      })
      const count = selectAchievements(next, actionDay, demo).length
      const milestone = actual.isDemo && !demo ? null : completionMilestone(before, count)
      if (milestone) {
        const text = ui.processMilestone(actionDay, milestone)
        if (text) setEncouragement({ token, day: actionDay, count, text })
      }
    } else {
      remember({
        ...actionContext('완료한 일을 다시 할 일로 바꿨어요.'),
        kind: 'edit',
        task: actual,
      })
    }
  }
  function toggleFocus(task: Task, fromPlan = false) {
    const removing = auto.state.enabled
      ? (auto.state.planTaskIds || []).includes(task.id)
      : task.focusDate === today
    remember({
      ...actionContext(removing ? '오늘 계획에서 뺐어요.' : '오늘 할 일에 넣었어요.'),
      kind: 'edit',
      task,
    })
    change((tasks) =>
      tasks.map((t) =>
        t.id === task.id
          ? { ...t, focusDate: removing ? null : today, updatedAt: new Date().toISOString() }
          : t,
      ),
    )
    if (auto.state.enabled)
      auto.update(
        removing
          ? {
              planTaskIds: (auto.state.planTaskIds || []).filter((id) => id !== task.id),
              currentTaskId: auto.state.currentTaskId === task.id ? null : auto.state.currentTaskId,
            }
          : addToPlan(auto.state, [task.id]),
      )
    if (removing && !auto.state.enabled && task.dueDate && task.dueDate <= today)
      setNotice({
        text: '오늘 선택은 해제했어요. 기한이 오늘까지라 목록에는 남아 있어요.',
        taskId: task.id,
      })
    else {
      setNotice({
        text: removing
          ? auto.state.enabled
            ? '오늘 계획에서 뺐어요. 전체 목록에는 그대로 남아 있어요.'
            : '오늘 계획에서 뺐어요. 전체 목록에는 그대로 남아 있어요.'
          : '기한은 그대로 두고 오늘 할 일에 넣었어요.',
      })
      if (removing && view === 'today' && !fromPlan) focusAfterRemoval(task)
    }
  }
  function saveEditor(draft: TaskDraft, includeToday: boolean) {
    const task = editing!
    remember({ ...actionContext('할 일을 수정했어요.'), kind: 'edit', task })
    change((tasks) => tasks.map((t) => (t.id === task.id ? updateTask(t, draft) : t)))
    if (auto.state.enabled && dayPlan.some((planned) => planned.id === task.id) !== includeToday) {
      auto.update(
        includeToday
          ? addToPlan(auto.state, [task.id])
          : {
              planTaskIds: (auto.state.planTaskIds || []).filter((id) => id !== task.id),
              currentTaskId: auto.state.currentTaskId === task.id ? null : auto.state.currentTaskId,
            },
      )
    }
    if (
      !auto.state.enabled &&
      task.focusDate === today &&
      draft.focusDate !== today &&
      draft.dueDate &&
      draft.dueDate <= today
    )
      setNotice({
        text: '오늘 선택은 해제했어요. 기한이 오늘까지라 목록에는 남아 있어요.',
        taskId: task.id,
      })
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
        reason: `할 일 ${current.current.tasks.length}개를 담은 백업 파일 다운로드를 시작했어요. (${(serialized.byteSize / 1024 / 1024).toFixed(2)}MiB)`,
      }
    } catch {
      return { ok: false, reason: '백업 파일을 만들지 못했어요. 다시 시도해 주세요.' }
    }
  }
  function restoreBackup(incoming: AppData, mode: RestoreMode) {
    if (guard !== 'ready')
      return {
        ok: false,
        reason: '저장된 원본을 보호하고 있어요. 먼저 원본을 다시 읽거나 복구해 주세요.',
      }
    const next = prepareRestore(current.current, incoming, mode).data
    const result = saveData(next, getStorage)
    if (!result.ok)
      return {
        ok: false,
        reason:
          '복원한 내용을 저장하지 못했어요. 기존 목록은 그대로예요. 다시 시도하거나 취소해 주세요.',
      }
    current.current = next
    setData(next)
    auto.update({ currentTaskId: null, skippedTaskIds: [], planTaskIds: null }, next.tasks)
    setSaveStatus('saved')
    setUndo(null)
    setEditing(null)
    setQuery('')
    setCompletedOpen(false)
    setNotice({ text: `복원했어요. 전체 할 일 ${next.tasks.length}개를 저장했어요.` })
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
    if (target === 'next') {
      if (nextButton.current) nextButton.current.focus()
      else if (finishHeading.current) finishHeading.current.focus()
      else focusInput()
      return
    }
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
          aria-label={mobile && item === 'all' ? `전체 할 일 ${allCount}` : undefined}
          onClick={() => {
            setView(item)
            setNotice(null)
            if (mobile) window.scrollTo({ top: 0 })
          }}
        >
          <Icon name={item === 'today' ? 'sun' : 'list'} />
          <span>{item === 'today' ? '오늘' : mobile ? '전체' : '전체 할 일'}</span>
          <span className="nav-count">{item === 'today' ? todayCount : allCount}</span>
        </button>
      ))}
      {mobile && (
        <button className="mobile-capture" aria-label="메모 입력" onClick={focusInput}>
          <Icon name="plus" />
          <span>메모</span>
        </button>
      )}
    </nav>
  )
  const menu = (
    <details
      className="app-menu"
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.currentTarget.open = false
      }}
    >
      <summary aria-label="설정 및 도움말">
        <Icon name="more" />
        <span>설정 및 도움말</span>
      </summary>
      <div className="menu-content">
        <strong>먼저 써 보세요</strong>
        <p>예시로 기능을 써 보세요. 내 할 일에는 영향을 주지 않아요.</p>
        <button className="secondary-button" onClick={addExamples}>
          예시로 둘러보기
        </button>
        <button
          className="text-button"
          disabled={!data.tasks.some((t) => t.isDemo)}
          onClick={() => {
            change((tasks) => tasks.filter((t) => !t.isDemo))
            setUndo(null)
            setNotice({ text: '예시만 지웠어요. 직접 적은 할 일은 그대로예요.' })
          }}
        >
          예시 할 일 지우기
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
            문구 설정을 저장하지 못했어요. 문구와 격려 설정에서 다시 확인해 주세요.
          </p>
        )}
        <hr />
        <strong>Focusday 1.5.0</strong>
        <p>
          계정 없이 이 브라우저에 저장해요. 다른 기기에서도 쓰려면 백업 파일을 내려받아 가져와
          주세요.
        </p>
        <p className="field-hint">
          N 새 입력 · / 검색
          <br />
          글을 입력하는 동안에는 실행되지 않아요.
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
      planned={auto.state.enabled ? dayPlan.some((planned) => planned.id === task.id) : undefined}
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
            Focusday<span className="brand-tagline">정리는 자동으로</span>
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
              ? '체험 · 저장 안 됨'
              : guard !== 'ready'
                ? '저장 보호 중'
                : saveStatus === 'error'
                  ? '저장 실패'
                  : saveStatus === 'saved'
                    ? '저장됨'
                    : initial.raw
                      ? '저장된 할 일 불러옴'
                      : '이 브라우저에 저장'}
          </div>
        </div>
        <header className="page-header">
          <div className="page-heading">
            <div className="page-title">
              <h1>{view === 'today' ? '오늘 할 일' : '전체 할 일'}</h1>
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
          <div className="page-actions">
            <button className="text-button history-button" onClick={focusInput}>
              <Icon name="plus" size={17} />
              메모 담기
            </button>
            {!auto.state.enabled && (
              <button
                className="text-button"
                onClick={(event) => openPanel('plan', event.currentTarget)}
              >
                오늘 계획하기
              </button>
            )}
            <button
              className="text-button history-button"
              disabled={!undo}
              onClick={revert}
              aria-label="최근 작업 되돌리기"
            >
              <Icon name="undo" size={17} />
              <span>{undo ? undoLabel(undo) : '되돌리기'}</span>
            </button>
            <details
              className="plan-options"
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.open = false
              }}
            >
              <summary>
                <Icon name="sliders" size={17} />
                계획 설정
              </summary>
              <section className="automation-controls" aria-label="자동 계획 설정">
                <label className="automation-toggle">
                  <input
                    type="checkbox"
                    checked={auto.state.enabled}
                    disabled={auto.blocked}
                    onChange={(e) =>
                      changePlan(
                        { enabled: e.target.checked, currentTaskId: null, skippedTaskIds: [] },
                        e.target.checked ? '자동 계획을 켰어요.' : '수동 계획으로 바꿨어요.',
                      )
                    }
                  />
                  자동 계획
                </label>
                {auto.state.enabled && (
                  <label className="daily-limit">
                    오늘 분량
                    <select
                      aria-label="오늘 기본 분량"
                      value={auto.state.limit}
                      onChange={(e) =>
                        changePlan(
                          resizePlan(
                            data.tasks,
                            today,
                            auto.state,
                            Number(e.target.value) as 1 | 3 | 5,
                          ),
                          '오늘 분량을 다시 정했어요.',
                        )
                      }
                    >
                      <option value={1}>1개</option>
                      <option value={3}>3개</option>
                      <option value={5}>5개</option>
                    </select>
                  </label>
                )}
                <p>기한과 우선순위를 보고 골라요. 마친 자리에는 새 일을 채우지 않아요.</p>
                {auto.state.enabled && (
                  <button
                    className="secondary-button"
                    onClick={(event) => openPanel('plan', event.currentTarget)}
                  >
                    오늘 계획하기
                  </button>
                )}
              </section>
            </details>
          </div>
        </header>
        {demo && (
          <section className="demo-banner" aria-label="예시 체험 안내">
            <div>
              <strong>자동화 체험</strong>
              <span>내 목록은 그대로 · 새로고침하면 체험 초기화</span>
            </div>
            <div className="demo-actions">
              <button className="text-button" onClick={() => window.location.reload()}>
                처음부터 체험
              </button>
              <button className="secondary-button" onClick={leaveDemo}>
                내 할 일 시작하기
              </button>
            </div>
          </section>
        )}
        {auto.error && (
          <section className="storage-banner" role="alert">
            <p>{auto.error}</p>
            <button className="secondary-button" onClick={auto.retry}>
              오늘 계획 다시 저장
            </button>
            {auto.blocked && (
              <details>
                <summary>자동 계획 설정 초기화…</summary>
                <p>오늘 계획 설정만 처음 상태로 바꿔요. 할 일과 문구 설정은 그대로예요.</p>
                <button className="secondary-button" onClick={auto.reset}>
                  자동 계획 설정만 초기화
                </button>
              </details>
            )}
          </section>
        )}
        {view === 'today' && !auto.state.enabled && (
          <section className="today-planning" aria-label="오늘 계획 요약">
            <div className="planning-copy">
              <h2>오늘 계획</h2>
              <p>
                직접 고른 <strong>{summary.focused}개</strong> · 기한으로 표시된{' '}
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
              저장된 원본은 그대로 보관하고 있어요. 이 탭에서 바꾼 내용은 아직 저장되지 않았어요.
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
              변경 내용을 저장하지 못했어요. 새로고침하기 전에 저장을 다시 시도하거나 백업해 주세요.
            </p>
            <button className="secondary-button" onClick={retry}>
              저장 재시도
            </button>
          </section>
        )}
        <div className="workspace-grid">
          <section className="work-column" aria-label="할 일 작업 영역">
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
                <button
                  className="icon-button"
                  aria-label="안내 닫기"
                  onClick={() => setNotice(null)}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}
            {query.trim() && (
              <p className="search-results" role="status">
                검색 결과 {searchCount}개{' '}
                <span>현재 {view === 'today' ? '오늘' : '전체'} 보기</span>
              </p>
            )}
            {view === 'today' && auto.state.enabled && dayPlan.length > 0 && !query.trim() && (
              <section className="day-overview" aria-label="오늘 자동 요약">
                <div className="plan-progress-label">
                  <strong>오늘 계획 {dayPlan.length}개</strong>
                  <span aria-live="polite">
                    {planCompleted} / {dayPlan.length} 완료
                  </span>
                </div>
                <div
                  className="plan-progress"
                  role="progressbar"
                  aria-label="오늘 계획 완료"
                  aria-valuemin={0}
                  aria-valuemax={dayPlan.length}
                  aria-valuenow={planCompleted}
                >
                  <span style={{ width: (planCompleted / dayPlan.length) * 100 + '%' }} />
                </div>
                <p>
                  {planFinished
                    ? outsideDue.length
                      ? `정한 분량은 마쳤지만, 오늘까지 할 일 ${outsideDue.length}개가 남아 있어요.`
                      : '정해 둔 분량을 모두 마쳤어요.'
                    : '계획에 남은 일 ' + planned.length + '개 · 마치면 다음 일이 이어져요.'}
                </p>
              </section>
            )}
            {view === 'today' && auto.state.enabled && outsideDue.length > 0 && !planFinished && (
              <div className="outside-due">
                <Icon name="calendar" size={16} />
                <span>오늘까지 해야 할 일 {outsideDue.length}개가 계획 밖에 있어요.</span>
                <button className="text-button" onClick={() => setView('all')}>
                  전체에서 확인
                </button>
              </div>
            )}
            {featured && (
              <section className="next-task" aria-label="지금 할 일">
                <div className="next-heading">
                  <h2>
                    <Icon name="spark" size={17} />
                    지금 할 일
                  </h2>
                  <span>{selectionReason(featured, today)}</span>
                </div>
                <button
                  className="featured-title"
                  aria-label={featured.title + ' 편집'}
                  onClick={(event) => openEditor(featured, event.currentTarget)}
                >
                  {featured.title}
                </button>
                <div className="featured-meta">
                  {featured.category && <span>{featured.category}</span>}
                  {featured.dueDate && (
                    <span>
                      {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(
                        calendarDate(featured.dueDate),
                      )}
                      까지
                    </span>
                  )}
                  {featured.priority !== 'none' && (
                    <span>
                      우선순위 {{ high: '높음', medium: '보통', low: '낮음' }[featured.priority]}
                    </span>
                  )}
                </div>
                <div className="next-actions">
                  <button
                    ref={nextButton}
                    className="primary-button"
                    onClick={() => toggle(featured)}
                  >
                    <Icon name="check" size={18} />
                    완료했어요
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      changePlan(
                        {
                          currentTaskId: null,
                          skippedTaskIds: [...new Set([...auto.state.skippedTaskIds, featured.id])],
                        },
                        '이 일은 잠시 뒤로 미뤘어요.',
                      )
                      pendingFocus.current = 'next'
                    }}
                  >
                    나중에 하기
                  </button>
                </div>
                <p className="next-reassurance">잘못 눌러도 최근 작업을 되돌릴 수 있어요.</p>
              </section>
            )}
            {view === 'today' && auto.state.enabled && planFinished && !query.trim() && (
              <section
                className={`day-finished ${outsideDue.length ? 'needs-attention' : 'is-complete'}`}
                aria-label={outsideDue.length ? '오늘 기한 확인 안내' : '오늘 계획 완료 안내'}
              >
                <span className="finish-mark">
                  <Icon name={outsideDue.length ? 'calendar' : 'check'} size={24} />
                </span>
                <h2 ref={finishHeading} tabIndex={-1}>
                  {outsideDue.length ? '오늘까지 할 일이 남아 있어요.' : '오늘 분량을 다 마쳤어요.'}
                </h2>
                <p>
                  {outsideDue.length
                    ? `오늘이 기한이거나 기한이 지난 일 ${outsideDue.length}개를 확인해 주세요. 오늘 계획에 넣고 이어서 할 수 있어요.`
                    : '여기서 마무리해도 좋아요. 나머지 일은 전체 목록에 그대로 있어요.'}
                </p>
                <div>
                  {outsideDue.length > 0 && (
                    <button
                      className="primary-button"
                      onClick={() => {
                        changePlan(
                          addToPlan(
                            auto.state,
                            outsideDue.map((task) => task.id),
                          ),
                          '오늘까지 해야 할 일을 오늘 계획에 넣었어요.',
                        )
                        pendingFocus.current = 'next'
                      }}
                    >
                      남은 일 오늘에 넣기
                    </button>
                  )}
                  <button className="secondary-button" onClick={() => setView('all')}>
                    전체 할 일 보기
                  </button>
                  {!outsideDue.length && rankedTasks(data.tasks, today).length > 0 && (
                    <button
                      className="text-button"
                      onClick={() => {
                        const next = rankedTasks(data.tasks, today).find(
                          (task) => !dayPlan.some((p) => p.id === task.id),
                        )
                        if (next)
                          changePlan(
                            addToPlan(auto.state, [next.id]),
                            '오늘 할 일을 하나 더 골랐어요.',
                          )
                      }}
                    >
                      하나 더 하기
                    </button>
                  )}
                </div>
              </section>
            )}
            {view === 'today' &&
              auto.state.enabled &&
              !query.trim() &&
              planned.length > 0 &&
              !candidate && (
                <section className="candidate-empty">
                  <p>남은 일을 모두 미뤄 두었어요. 준비되면 다시 이어가세요.</p>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      changePlan({ skippedTaskIds: [] }, '미뤄 둔 일을 다시 이어가요.')
                    }
                  >
                    미뤄 둔 일 이어가기
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
            {active.length === 0 &&
              (!query.trim() || searchCount === 0) &&
              !(view === 'today' && auto.state.enabled && planFinished) && (
                <section className="empty-state">
                  <div className="empty-icon">
                    <Icon name={query.trim() ? 'search' : 'sun'} size={32} />
                  </div>
                  <h2>
                    {query.trim()
                      ? '검색 결과가 없어요'
                      : data.tasks.length === 0
                        ? '해야 할 일을 하나 적어보세요'
                        : view === 'today'
                          ? achievements.length
                            ? `오늘 ${achievements.length}개를 마쳤어요`
                            : '오늘 정한 일이 없어요'
                          : '남은 할 일이 없어요'}
                  </h2>
                  <p>
                    {query.trim()
                      ? `“${query}” 검색어를 지우거나 다른 말로 찾아보세요.`
                      : data.tasks.length === 0
                        ? '생각난 일 하나부터. 계정 없이 가볍게 시작하세요.'
                        : view === 'today'
                          ? '전체 할 일에서 오늘 할 일을 고르거나 새로 추가해 보세요.'
                          : '완료한 일은 아래에서 확인하고 완료를 취소할 수 있어요.'}
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
                  {demo ? '체험 중에' : '직접 적은 할 일 중'} 오늘 마친 일이에요. 완료를 취소하면
                  다시 할 일로 돌아가요.
                </p>
                {achievements.length ? (
                  <ul className="task-list">{achievements.map((task) => row(task, true))}</ul>
                ) : (
                  <p className="achievement-empty">오늘 마친 일이 여기에 모여요.</p>
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
                  <p className="field-hint">검색어와 맞는 완료 항목이 없어요.</p>
                )}
              </details>
            )}
          </section>
          <aside className="capture-column">
            <CaptureComposer
              key={`${view}-${auto.state.enabled}`}
              today={today}
              value={title}
              onChange={setTitle}
              inputRef={input}
              formRef={composer}
              onSave={captureTasks}
              automatic={auto.state.enabled}
              awaitingFirstPlan={auto.state.planTaskIds === null}
              defaultToday={!auto.state.enabled && view === 'today'}
            />
          </aside>
        </div>
        <footer className="page-footer">
          <span>생각은 담고, 하나씩 끝내요.</span>
          <span>Focusday</span>
        </footer>
      </main>
      {nav(true)}
      {panel === 'plan' && (
        <PlanPanel
          tasks={data.tasks}
          plannedIds={auto.state.enabled ? auto.state.planTaskIds || [] : undefined}
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
          automatic={auto.state.enabled}
          planned={auto.state.enabled ? dayPlan.some((task) => task.id === editing.id) : undefined}
          today={today}
          onClose={closeEditor}
          onSave={saveEditor}
          onDelete={() => {
            const task = editing
            change((tasks) => tasks.filter((t) => t.id !== task.id))
            if (auto.state.currentTaskId === task.id) auto.update({ currentTaskId: null })
            remember({ ...actionContext('할 일을 삭제했어요.'), kind: 'delete', task })
            closeEditor()
          }}
        />
      )}
      {undo && toastVisible && (
        <UndoToast
          key={undo.token}
          undo={undo}
          encouragement={
            encouragement?.token === undo.token &&
            encouragement.day === today &&
            encouragement.count === achievements.length &&
            undo.kind === 'complete' &&
            data.tasks.some((task) => task.id === undo.task.id && task.completedAt)
              ? encouragement.text
              : undefined
          }
          onUndo={revert}
          onExpire={(token) => {
            if (undo?.token === token) setToastVisible(false)
          }}
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
            손상되거나 지원하지 않는 원본을 지우고 현재 탭의 할 일 {data.tasks.length}개를 저장해요.
            원본은 되돌릴 수 없어요. 필요한 경우 먼저 내려받아 주세요.
          </p>
          {saveStatus === 'error' && (
            <p className="field-error" role="alert">
              초기화하지 못했어요. 원본은 그대로예요. 브라우저 저장 권한을 확인하거나 다시 시도해
              주세요.
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
                } else setLoadReason('초기화하지 못했어요. 원본은 그대로예요. 다시 시도해 주세요.')
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
