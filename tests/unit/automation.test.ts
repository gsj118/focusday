import { describe, expect, it } from 'vitest'
import { parseCapture } from '../../src/capture'
import {
  automaticToday,
  currentAutomation,
  defaultAutomation,
  loadAutomation,
  nextCandidate,
  saveAutomation,
  initializePlan,
  dailyPlan,
  resizePlan,
  addToPlan,
  planCapturedTasks,
  AUTO_STORAGE_KEY,
} from '../../src/automation'
import { createTask, type Task } from '../../src/domain'
import { createSession } from '../../src/session'
import { loadData, saveData, type StoragePort } from '../../src/storage'
import { loadPreferences, savePreferences } from '../../src/preferences'
import { selectAchievements } from '../../src/encouragement'

const day = '2026-12-31'
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', day, '2026-12-01T00:00:00.000Z', id),
  ...extra,
})
describe('explicit capture, without guesses', () => {
  it('parses a batch, preserving order, duplicate titles and independent properties', () => {
    const parsed = parseCapture(
      '내일 발표 자료 제출 #학교 !높음\r\n\n발표 자료 제출\n발표 자료 제출',
      day,
    )
    expect(parsed.errors).toEqual([])
    expect(parsed.tasks).toHaveLength(3)
    expect(parsed.tasks[0]).toEqual({
      line: 1,
      title: '발표 자료 제출',
      dueDate: '2027-01-01',
      category: '학교',
      priority: 'high',
    })
    expect(parsed.tasks[1]).toMatchObject({
      line: 3,
      dueDate: null,
      priority: 'none',
      category: null,
    })
  })
  it.each([
    '2026-02-30 제출',
    '오늘 내일 제출',
    '할 일 #학교 #생활',
    '할 일 !높음 !낮음',
    '오늘 #학교',
    'a'.repeat(201),
    '할 일 #' + '가'.repeat(25),
  ])('rejects invalid line: %s', (input) => {
    expect(parseCapture(input, day).errors).toHaveLength(1)
  })
  it('does not consume middle words, unsupported time language or parts of a word', () => {
    for (const title of [
      '내일의 나에게 편지',
      '친구와 내일 만나기',
      '매주 운동',
      '한 일 그리고 다른 일',
      '업무 !긴급',
    ]) {
      expect(parseCapture(title, day).tasks[0]).toMatchObject({
        title,
        dueDate: null,
        priority: 'none',
        category: null,
      })
    }
  })
  it('literal mode preserves syntax, while still validating each title', () => {
    expect(parseCapture('내일 할 일 #집 !높음', day, false).tasks[0]).toMatchObject({
      title: '내일 할 일 #집 !높음',
      dueDate: null,
      category: null,
    })
    expect(parseCapture(' \n ', day).errors).toHaveLength(1)
    expect(parseCapture('유효\n2026-02-30 잘못된 날짜', day).errors[0].line).toBe(2)
  })
  it('calendar dates survive month/year and DST boundaries', () => {
    expect(parseCapture('모레 할 일', day).tasks[0].dueDate).toBe('2027-01-02')
    expect(parseCapture('내일 할 일', '2026-03-08').tasks[0].dueDate).toBe('2026-03-09')
    expect(parseCapture('내일 할 일', '2028-02-28').tasks[0].dueDate).toBe('2028-02-29')
  })
})
describe('automatic today is a projection, never a task mutation', () => {
  it('limits the fixed plan while preserving every task outside it', () => {
    const tasks = [
      task('future', { dueDate: '2027-01-03' }),
      task('manual', { focusDate: day }),
      task('due', { dueDate: day }),
      task('late', { dueDate: '2026-12-29' }),
    ]
    const before = JSON.stringify(tasks)
    expect(
      automaticToday(tasks, day, { ...defaultAutomation(day), limit: 1 }).map((t) => t.id),
    ).toEqual(['late'])
    expect(JSON.stringify(tasks)).toBe(before)
  })
  it('returns old unfinished focus, high priority, future due then oldest items', () => {
    const tasks = [
      task('plain'),
      task('future', { dueDate: '2027-01-03' }),
      task('high', { priority: 'high' }),
      task('old-focus', { focusDate: '2026-10-01' }),
      task('done', { completedAt: '2026-12-31T00:00:00.000Z' }),
    ]
    expect(automaticToday(tasks, day, defaultAutomation(day)).map((t) => t.id)).toEqual([
      'old-focus',
      'high',
      'future',
    ])
  })
  it('keeps a started item and finishes the fixed plan without replacing it with urgent work', () => {
    const tasks = [task('working'), task('urgent', { dueDate: day })]
    const settings = initializePlan(tasks, day, {
      ...defaultAutomation(day),
      limit: 1 as const,
      currentTaskId: 'working',
    })
    const planned = automaticToday(tasks, day, settings)
    expect(planned).toHaveLength(1)
    expect(nextCandidate(planned, day, settings)?.id).toBe('working')
    tasks[0].completedAt = '2026-12-31T01:00:00.000Z'
    expect(nextCandidate(automaticToday(tasks, day, settings), day, settings)).toBeNull()
    expect(dailyPlan(tasks, day, settings).map((t) => t.id)).toEqual(['working'])
  })
  it('skipping never removes required work, and day rollover clears only daily state', () => {
    const settings = { ...defaultAutomation(day), skippedTaskIds: ['due'], currentTaskId: 'gone' }
    const tasks = [task('due', { dueDate: day })]
    expect(automaticToday(tasks, day, settings)).toHaveLength(1)
    expect(nextCandidate(tasks, day, settings)).toBeNull()
    expect(currentAutomation(settings, '2027-01-01')).toMatchObject({
      limit: 3,
      enabled: true,
      skippedTaskIds: [],
      currentTaskId: null,
    })
    expect(nextCandidate(tasks, '2027-01-01', settings)?.id).toBe('due')
  })
  it('breaks ties deterministically without mutating input order', () => {
    const tasks = [task('z'), task('a')]
    expect(automaticToday(tasks, day, defaultAutomation(day)).map((t) => t.id)).toEqual(['a', 'z'])
    expect(tasks.map((t) => t.id)).toEqual(['z', 'a'])
  })
  it('does not expand a saved projection from raw data changes; explicit resize can be reversed', () => {
    const original = [task('a'), task('b'), task('c'), task('d')]
    const settings = initializePlan(original, day, defaultAutomation(day))
    const changed = original
      .filter((t) => t.id !== 'b')
      .map((t) => (t.id === 'a' ? { ...t, completedAt: '2026-12-31T01:00:00.000Z' } : t))
    changed.push(task('urgent', { dueDate: day }))
    expect(automaticToday(changed, day, settings).map((t) => t.id)).toEqual(['c'])
    const expanded = resizePlan(changed, day, settings, 5)
    expect(dailyPlan(changed, day, expanded).map((t) => t.id)).toEqual(['a', 'urgent', 'c', 'd'])
    expect(automaticToday(changed, day, settings).map((t) => t.id)).toEqual(['c'])
    expect(addToPlan(settings, ['d', 'd']).planTaskIds).toEqual(['a', 'b', 'c', 'd'])
  })
  it('includes only newly captured due-today/overdue work in an existing plan and prioritizes it', () => {
    const existing = [task('a'), task('b'), task('c')]
    const state = initializePlan(existing, day, defaultAutomation(day))
    const captured = [
      task('today', { dueDate: day }),
      task('tomorrow', { dueDate: '2027-01-01' }),
      task('next-week', { dueDate: '2027-01-04' }),
      task('undated'),
      task('overdue', { dueDate: '2026-12-30' }),
    ]
    const before = JSON.stringify({ existing, captured, state })
    const changed = planCapturedTasks(existing, captured, day, state, false)
    expect(changed.planTaskIds).toEqual(['a', 'b', 'c', 'today', 'overdue'])
    expect(automaticToday([...existing, ...captured], day, changed).map((t) => t.id)).toEqual([
      'overdue',
      'today',
      'a',
      'b',
      'c',
    ])
    expect(JSON.stringify({ existing, captured, state })).toBe(before)
    expect(dailyPlan([...existing, ...captured], day, state).map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
  it('includes every newly entered current deadline even when the initial quota is smaller', () => {
    const captured = ['a', 'b', 'c', 'd'].map((id) => task(id, { dueDate: day }))
    captured.push(task('future', { dueDate: '2027-01-01' }))
    const state = planCapturedTasks([], captured, day, defaultAutomation(day), false)
    expect(state.limit).toBe(3)
    expect(state.planTaskIds).toEqual(['a', 'b', 'c', 'd'])
  })
  it('reopens a completed plan for a new current deadline without filling it with future work', () => {
    const existing = [task('done', { completedAt: '2026-12-31T01:00:00.000Z' })]
    const state = { ...defaultAutomation(day), planTaskIds: ['done'] }
    const captured = [task('today', { dueDate: day }), task('future', { dueDate: '2027-01-01' })]
    const next = planCapturedTasks(existing, captured, day, state, false)
    expect(next.planTaskIds).toEqual(['done', 'today'])
    expect(automaticToday([...existing, ...captured], day, next).map((t) => t.id)).toEqual([
      'today',
    ])
    expect(planCapturedTasks(existing, [captured[1]], day, state, false)).toBe(state)
  })
  it('keeps manual mode untouched and allows an explicit include-all action', () => {
    const existing = [task('a')]
    const captured = [task('future', { dueDate: '2027-01-01' }), task('undated')]
    const state = initializePlan(existing, day, defaultAutomation(day))
    expect(planCapturedTasks(existing, captured, day, state, true).planTaskIds).toEqual([
      'a',
      'future',
      'undated',
    ])
    const manual = { ...state, enabled: false }
    expect(planCapturedTasks(existing, captured, day, manual, true)).toBe(manual)
  })
  it('migrates v1 settings on read without overwriting them', () => {
    let writes = 0
    const { planTaskIds: _ids, ...old } = defaultAutomation(day)
    void _ids
    const loaded = loadAutomation(
      () => ({
        getItem: () => JSON.stringify({ ...old, version: 1, limit: 5 }),
        setItem: () => {
          writes++
        },
      }),
      day,
    )
    expect(loaded.blocked).toBe(false)
    expect(loaded.data).toMatchObject({ version: 2, limit: 5, planTaskIds: null })
    expect(writes).toBe(0)
  })
})
describe('separate settings and demo storage', () => {
  it('does not write empty defaults or overwrite broken settings', () => {
    let writes = 0
    const empty: StoragePort = {
      getItem: () => null,
      setItem: () => {
        writes++
      },
    }
    expect(loadAutomation(() => empty, day).data.enabled).toBe(true)
    expect(writes).toBe(0)
    expect(loadAutomation(() => ({ ...empty, getItem: () => '{broken' }), day).blocked).toBe(true)
    expect(writes).toBe(0)
    expect(
      saveAutomation(defaultAutomation(day), () => {
        throw new Error('denied')
      }),
    ).toContain('저장하지 못')
  })
  it('guards unknown schema and inaccessible storage', () => {
    const invalid = { ...defaultAutomation(day), limit: 8 }
    expect(
      loadAutomation(() => ({ getItem: () => JSON.stringify(invalid), setItem: () => {} }), day)
        .data.enabled,
    ).toBe(false)
    expect(
      loadAutomation(() => {
        throw new Error('denied')
      }, day).blocked,
    ).toBe(true)
  })
  it('demo isolates every key, resets between visits and supports real saves/preferences', () => {
    const first = createSession('?demo=1', day),
      second = createSession('?demo=1', day)
    const data = loadData(first.getStorage).data
    expect(data.tasks).toHaveLength(5)
    data.tasks[0].completedAt = '2026-12-31T10:00:00.000Z'
    expect(saveData(data, first.getStorage).ok).toBe(true)
    expect(selectAchievements(data.tasks, day, true)).toHaveLength(1)
    expect(selectAchievements(data.tasks, day)).toHaveLength(0)
    const pref = loadPreferences(first.getStorage).data
    pref.sentenceMode = 'off'
    savePreferences(pref, first.getStorage)
    saveAutomation({ ...defaultAutomation(day), limit: 5 }, first.getStorage)
    expect(loadPreferences(second.getStorage).data.sentenceMode).toBe('calm')
    expect(loadData(second.getStorage).data.tasks[0].completedAt).toBeNull()
    expect(JSON.parse(second.getStorage().getItem(AUTO_STORAGE_KEY)!).limit).toBe(3)
  })
})
