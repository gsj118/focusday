import { describe, expect, it } from 'vitest'
import { parseCapture } from '../../src/capture'
import {
  automaticToday,
  currentAutomation,
  defaultAutomation,
  loadAutomation,
  nextCandidate,
  saveAutomation,
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
  it('retains ALL overdue/due/manual tasks even beyond the target', () => {
    const tasks = [
      task('future', { dueDate: '2027-01-03' }),
      task('manual', { focusDate: day }),
      task('due', { dueDate: day }),
      task('late', { dueDate: '2026-12-29' }),
    ]
    const before = JSON.stringify(tasks)
    expect(
      automaticToday(tasks, day, { ...defaultAutomation(day), limit: 1 }).map((t) => t.id),
    ).toEqual(['late', 'due', 'manual'])
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
  it('keeps a started item when new urgent work arrives; then offers next after completion', () => {
    const settings = { ...defaultAutomation(day), limit: 1 as const, currentTaskId: 'working' }
    const tasks = [task('working'), task('urgent', { dueDate: day })]
    const planned = automaticToday(tasks, day, settings)
    expect(planned).toHaveLength(2)
    expect(nextCandidate(planned, day, settings)?.id).toBe('working')
    tasks[0].completedAt = '2026-12-31T01:00:00.000Z'
    expect(nextCandidate(automaticToday(tasks, day, settings), day, settings)?.id).toBe('urgent')
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
