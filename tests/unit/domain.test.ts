import { describe, expect, it } from 'vitest'
import { addDays, appendDemo, applyUndo, createTask, daysBetween, isDate, isToday, localDate, nextMidnightDelay, selectCompleted, selectTasks, updateTask, validateTitle, type Task } from '../../src/domain'

const today = '2026-10-02'
const make = (id: string, overrides: Partial<Task> = {}): Task => ({ ...createTask(id, 'all', today, '2026-10-02T00:00:00.000Z', id), ...overrides })
describe('입력·보기·정렬', () => {
  it('현재 보기의 기본값과 제목 trim, 일반 항목 표식', () => {
    expect(createTask('  할 일  ', 'today', today)).toMatchObject({ title: '할 일', focusDate: today, dueDate: null, priority: 'none', category: null, isDemo: false, completedAt: null })
    expect(createTask('할 일', 'all', today).focusDate).toBeNull()
  })
  it('빈 제목·201자 거부와 200자 허용', () => {
    expect(validateTitle('   ')).toBeTruthy()
    expect(validateTitle('가'.repeat(200))).toBeNull()
    expect(() => createTask('가'.repeat(201), 'all', today)).toThrow()
  })
  it('기한과 집중은 독립적이며 오늘의 합집합에 한 번만 포함', () => {
    const future = make('future', { dueDate: '2026-10-03', focusDate: today })
    expect(isToday(future, today)).toBe(true)
    expect(updateTask(future, { ...future, focusDate: null }).dueDate).toBe('2026-10-03')
    expect(isToday({ ...future, focusDate: null }, today)).toBe(false)
    expect(isToday(make('due', { dueDate: today }), today)).toBe(true)
    expect(selectTasks([make('both', { dueDate: today, focusDate: today })], 'today', today)).toHaveLength(1)
    expect(isToday(make('done', { dueDate: today, completedAt: '2026-10-02T00:00:00.000Z' }), today)).toBe(false)
  })
  it('지난 집중은 전체에 보존하고 지난 기한은 계속 오늘에 표시', () => {
    const tasks = [make('focus', { focusDate: today }), make('due', { dueDate: today })]
    expect(selectTasks(tasks, 'today', '2026-10-03').map(t => t.id)).toEqual(['due'])
    expect(selectTasks(tasks, 'all', '2026-10-03')).toHaveLength(2)
  })
  it('기한 초과 날짜 → 우선순위 → 생성 순, 오늘은 우선순위', () => {
    const tasks = [make('today', { focusDate: today, priority: 'high' }), make('late', { dueDate: '2026-10-01', priority: 'high' }), make('old-low', { dueDate: '2026-09-30', priority: 'low' }), make('old-high', { dueDate: '2026-09-30', priority: 'high' })]
    expect(selectTasks(tasks, 'today', today).map(t => t.id)).toEqual(['old-high', 'old-low', 'late', 'today'])
  })
  it('전체는 오늘 → 미래 → 나머지, 그룹 안 우선순위·안정 기준', () => {
    const tasks = [make('none', { priority: 'high' }), make('future', { dueDate: '2026-11-01' }), make('today', { focusDate: today }), make('a', { dueDate: '2026-11-01', priority: 'high' })]
    expect(selectTasks(tasks, 'all', today).map(t => t.id)).toEqual(['today', 'a', 'future', 'none'])
  })
  it('제목·분류 검색과 완료 최근 순·동률 기준', () => {
    const tasks = [make('a', { title: 'Report', category: '업무' }), make('b', { title: '이메일', completedAt: '2026-10-02T02:00:00.000Z' }), make('c', { completedAt: '2026-10-02T03:00:00.000Z' })]
    expect(selectTasks(tasks, 'all', today, 'REPORT')).toHaveLength(1)
    expect(selectTasks(tasks, 'all', today, '업무')).toHaveLength(1)
    expect(selectCompleted(tasks).map(t => t.id)).toEqual(['c', 'b'])
  })
})
describe('달력 날짜', () => {
  it('UTC 변환 없이 로컬 성분 사용', () => {
    expect(localDate(new Date(2026, 9, 2, 0, 1))).toBe(today)
  })
  it('월말·연말·윤년·잘못된 날짜', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(isDate('2026-02-29')).toBe(false)
    expect(isDate('2026-13-01')).toBe(false)
    expect(isDate('0001-01-01')).toBe(true)
  })
  it('날짜 간 차이는 DST에도 달력 기준', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })
  it('다음 로컬 자정에 타이머 예약', () => {
    const now = new Date(2026, 11, 31, 23, 59, 59)
    expect(nextMidnightDelay(now)).toBe(1020)
  })
})
describe('복구·예시', () => {
  it('삭제 취소는 모든 속성을 보존하며 다른 항목 변경을 되돌리지 않는다', () => {
    const deleted = make('d', { focusDate: today, dueDate: '2026-10-03', priority: 'high', category: '업무', completedAt: '2026-10-02T02:00:00.000Z', isDemo: true })
    const changed = make('x', { title: '변경된 제목' })
    expect(applyUndo([changed], { token: 1, kind: 'delete', task: deleted })).toEqual([changed, deleted])
  })
  it('완료 취소는 현재 속성 편집을 보존하며 완료 여부만 복구한다', () => {
    const old = make('a')
    const edited = { ...old, title: '나중 편집', completedAt: '2026-10-02T02:00:00.000Z' }
    expect(applyUndo([edited], { token: 1, kind: 'complete', task: old })[0]).toMatchObject({ title: '나중 편집', completedAt: null })
  })
  it('예시는 선택적·중복 방지, 제거 시 사용자 항목 보존', () => {
    const user = make('user')
    const tasks = appendDemo([user], today)
    expect(tasks).toHaveLength(6)
    expect(appendDemo(tasks, today)).toBe(tasks)
    expect(tasks.filter(t => !t.isDemo)).toEqual([user])
  })
})
