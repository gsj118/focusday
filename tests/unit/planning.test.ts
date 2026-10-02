import { describe, expect, it } from 'vitest'
import {
  createTask,
  planCandidates,
  todaySummary,
  yesterdayTasks,
  isToday,
  type Task,
} from '../../src/domain'

const today = '2026-10-02'
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  ...createTask(id, 'all', today, '2026-10-01T01:00:00.000Z', id),
  ...extra,
})
describe('계획과 어제 이어가기', () => {
  it('그룹 순서·중복 제거·모든 사실 이유·완료 제외', () => {
    const input = [
      task('high', { priority: 'high' }),
      task('yesterday', { focusDate: '2026-10-01' }),
      task('due', { dueDate: today }),
      task('both', { dueDate: '2026-09-30', focusDate: '2026-10-01', priority: 'high' }),
      task('done', { dueDate: today, completedAt: '2026-10-01T01:00:00.000Z' }),
      task('normal'),
    ]
    const candidates = planCandidates(input, today)
    expect(candidates.map((c) => [c.task.id, c.group])).toEqual([
      ['both', 'overdue'],
      ['due', 'dueToday'],
      ['yesterday', 'yesterday'],
      ['high', 'high'],
    ])
    expect(candidates[0].reasons).toEqual(['기한 초과', '어제 선택한 일', '높은 우선순위'])
    expect(input[0].id).toBe('high')
  })
  it('그룹 안 기존 날짜/우선순위/생성/id 정렬과 집중 중 후보', () => {
    const input = [
      task('late', { dueDate: '2026-10-01', priority: 'high' }),
      task('old-low', { dueDate: '2026-09-30', priority: 'low' }),
      task('old-high', { dueDate: '2026-09-30', priority: 'high' }),
      task('b', { priority: 'high', focusDate: today }),
      task('a', { priority: 'high' }),
    ]
    expect(planCandidates(input, today).map((c) => c.task.id)).toEqual([
      'old-high',
      'old-low',
      'late',
      'a',
      'b',
    ])
  })
  it('후보 없음, 오래된 집중·낮음·보통 제외', () => {
    expect(
      planCandidates(
        [
          task('old', { focusDate: '2026-09-30' }),
          task('low', { priority: 'low' }),
          task('medium', { priority: 'medium' }),
        ],
        today,
      ),
    ).toEqual([])
    expect(planCandidates([], today)).toEqual([])
  })
  it.each([
    ['2026-03-01', '2026-02-28'],
    ['2027-01-01', '2026-12-31'],
    ['2026-11-02', '2026-11-01'],
  ])('로컬 달력 %s의 어제 %s만 포함·자동 이월 없음', (date, yesterday) => {
    const original = task('continue', { focusDate: yesterday, dueDate: '2027-02-01' })
    const tasks = [
      original,
      task('older', { focusDate: '2025-12-01' }),
      task('done', { focusDate: yesterday, completedAt: '2026-10-01T01:00:00.000Z' }),
    ]
    expect(yesterdayTasks(tasks, date)).toEqual([original])
    expect(planCandidates(tasks, date).find((c) => c.task.id === 'continue')?.group).toBe(
      'yesterday',
    )
    expect(original.focusDate).toBe(yesterday)
    expect(original.dueDate).toBe('2027-02-01')
  })
  it('직접 선택과 기한 표시 집합은 겹치지 않고 오늘 수와 일치', () => {
    const tasks = [
      task('both', { focusDate: today, dueDate: today }),
      task('focus', { focusDate: today }),
      task('due', { dueDate: '2026-10-01', focusDate: '2026-10-01' }),
      task('future', { dueDate: '2026-11-01' }),
      task('done', { focusDate: today, completedAt: '2026-10-01T01:00:00.000Z' }),
    ]
    expect(todaySummary(tasks, today)).toEqual({ focused: 2, dueOnly: 1, total: 3 })
    expect(todaySummary(tasks, today).total).toBe(tasks.filter((t) => isToday(t, today)).length)
    expect(
      todaySummary(
        tasks.map((t) => ({ ...t, focusDate: null })),
        today,
      ),
    ).toEqual({ focused: 0, dueOnly: 2, total: 2 })
  })
})
