import { describe, expect, it } from 'vitest'
import { parseMemo } from '../../src/memo'
import { createTask } from '../../src/domain'
import { defaultAutomation } from '../../src/automation'
import { undoTasks, type RecentAction } from '../../src/history'

const day = '2026-11-20'
describe('Korean memo capture', () => {
  it('turns an ordinary memo into editable tasks with traceable original phrases', () => {
    const result = parseMemo(
      '오늘은 빨래 돌리고 내일 과제 제출해야 돼.\n다음 주 월요일 발표 준비도 해놔야 하고.',
      day,
    )
    expect(result.errors).toEqual([])
    expect(
      result.tasks.map(({ title, dueDate, category }) => ({ title, dueDate, category })),
    ).toEqual([
      { title: '빨래 돌리기', dueDate: day, category: '생활' },
      { title: '과제 제출하기', dueDate: '2026-11-21', category: '학교' },
      { title: '발표 준비하기', dueDate: '2026-11-23', category: '학교' },
    ])
    expect(result.tasks.every((task) => task.source.length > 0)).toBe(true)
  })
  it.each([
    ['친구와 내일 만나기', '2026-11-21'],
    ['이번 주 일요일 청소', '2026-11-22'],
    ['월요일 운동', '2026-11-23'],
    ['다다음 주 화요일 병원 가기', '2026-12-01'],
    ['11월 23일까지 보고서 제출', '2026-11-23'],
    ['2027년 1월 2일 장보기', '2027-01-02'],
    ['3일 뒤 도서 반납', '2026-11-23'],
    ['일주일 후 회의', '2026-11-27'],
    ['글피 청소', '2026-11-23'],
    ['주말 산책', '2026-11-21'],
  ])('understands explicit date phrase %s', (input, dueDate) => {
    expect(parseMemo(input, day).tasks[0].dueDate).toBe(dueDate)
  })
  it('preserves ambiguous text and explains unsupported repetition and times', () => {
    expect(parseMemo('내일의 나에게 편지', day).tasks[0].title).toBe('내일의 나에게 편지')
    expect(parseMemo('사고', day).tasks[0].title).toBe('사고')
    expect(parseMemo('사고 그리고 내일 보고', day).tasks[0].title).toBe('사고')
    expect(parseMemo('매주 월요일 오후 3시 운동', day).warnings.length).toBeGreaterThan(0)
    expect(parseMemo('다음 주 언젠가 정리', day).tasks[0].dueDate).toBeNull()
    expect(parseMemo('급하게 할 일은 아님', day).tasks[0].priority).toBe('none')
  })
  it('supports literal capture and explicit metadata overrides', () => {
    expect(parseMemo('내일 과제 제출 #직장 !낮음', day).tasks[0]).toMatchObject({
      category: '직장',
      priority: 'low',
      dueDate: '2026-11-21',
    })
    expect(parseMemo('오늘 빨래하고 내일 과제 제출', day, false).tasks[0]).toMatchObject({
      title: '오늘 빨래하고 내일 과제 제출',
      category: null,
      dueDate: null,
    })
  })
  it('splits a shared-date action sentence without merging the categories', () => {
    const result = parseMemo('내일 과제 제출하고 우유 사기', day)
    expect(result.errors).toEqual([])
    expect(
      result.tasks.map(({ title, dueDate, category, source }) => ({
        title,
        dueDate,
        category,
        source,
      })),
    ).toEqual([
      {
        title: '과제 제출하기',
        dueDate: '2026-11-21',
        category: '학교',
        source: '내일 과제 제출하고',
      },
      { title: '우유 사기', dueDate: '2026-11-21', category: null, source: '우유 사기' },
    ])
    expect(result.warnings).toContain(
      '한 문장에 이어 쓴 할 일에는 앞의 날짜를 함께 적용했어요. 저장 전에 확인해 주세요.',
    )
  })
  it('keeps explicit dates and does not carry dates across sentences or lines', () => {
    expect(
      parseMemo('내일 자료 정리하고 친구와 모레 식사', day).tasks.map((task) => task.dueDate),
    ).toEqual(['2026-11-21', '2026-11-22'])
    expect(
      parseMemo('내일 과제 제출. 우유 사기\n산책하기', day).tasks.map((task) => task.dueDate),
    ).toEqual(['2026-11-21', null, null])
    expect(parseMemo('오늘 빨래 돌리고 물 마시기', day).tasks.map((task) => task.title)).toEqual([
      '빨래 돌리기',
      '물 마시기',
    ])
  })
  it('does not split nouns or auxiliary expressions as independent actions', () => {
    for (const text of [
      '친구하고 점심 먹기',
      '사고 예방 교육 듣기',
      '공부하고 싶은 책 사기',
      '공부하고  싶은 책 사기',
      '자료 정리하고 있는 폴더 확인',
    ]) {
      expect(parseMemo(text, day).tasks.map((task) => task.title)).toEqual([
        text.replace(/\s+/g, ' '),
      ])
    }
  })
  it('preserves every date word in unsupported recurring requests', () => {
    for (const text of [
      '매주 금요일 운동 30분',
      '내일 매주 월요일 운동',
      '매달 25일 월세 내기',
      '매주금요일 운동',
    ]) {
      const result = parseMemo(text, day)
      expect(result.tasks[0]).toMatchObject({ title: text, dueDate: null })
      expect(result.warnings.some((warning) => warning.includes('반복 일정'))).toBe(true)
    }
    expect(parseMemo('매주 금요일 운동 #건강 !낮음', day).tasks[0]).toMatchObject({
      title: '매주 금요일 운동',
      dueDate: null,
      category: '건강',
      priority: 'low',
    })
  })
  it('does not detach recurrence context when actions are connected', () => {
    const result = parseMemo('매주 금요일 운동하고 산책하기', day)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]).toMatchObject({ title: '매주 금요일 운동하고 산책하기', dueDate: null })
  })
  it('does not mistake recurring-word substrings for recurrence', () => {
    expect(parseMemo('내일 매일경제 읽기', day).tasks[0]).toMatchObject({
      title: '매일경제 읽기',
      dueDate: '2026-11-21',
    })
    expect(parseMemo('내일 반복문 과제 제출', day).tasks[0]).toMatchObject({
      title: '반복문 과제 제출',
      dueDate: '2026-11-21',
    })
  })
  it('reports an impossible shared date before any batch can be saved', () => {
    const result = parseMemo('2월 30일 과제 제출하고 우유 사기', day)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].line).toBe(1)
  })
  it('rejects impossible dates and conflicting deadlines without losing valid lines', () => {
    const result = parseMemo('청소\n2월 30일 제출\n오늘 내일 제출', day)
    expect(result.errors.map((e) => e.line)).toEqual([2, 3])
    expect(result.tasks[0].title).toBe('청소')
  })
  it('handles year/leap/DST boundaries in calendar dates', () => {
    expect(parseMemo('다음 주 월요일 제출', '2026-12-31').tasks[0].dueDate).toBe('2027-01-04')
    expect(parseMemo('모레 제출', '2028-02-28').tasks[0].dueDate).toBe('2028-03-01')
    expect(parseMemo('내일 제출', '2026-03-08').tasks[0].dueDate).toBe('2026-03-09')
  })
  it.each([true, false])('limits a batch to 100 items, recognition=%s', (recognize) => {
    expect(parseMemo(Array(101).fill('청소').join('\n'), day, recognize).errors).toEqual([
      expect.objectContaining({ message: expect.stringContaining('100개') }),
    ])
  })
})
describe('context-aware undo', () => {
  const a = createTask('기존 할 일', 'all', day, '2026-11-20T00:00:00.000Z', 'a')
  const b = createTask('메모에서 추가', 'all', day, '2026-11-20T00:00:00.000Z', 'b')
  const context = { token: 1, day, message: '', autoBefore: defaultAutomation(day) }
  it('removes only the captured batch, preserving unrelated tasks', () => {
    expect(undoTasks([a, b], { ...context, kind: 'capture', tasks: [b], raw: '메모' })).toEqual([a])
  })
  it('undoing completion retains later title edits, unlike a whole-data rollback', () => {
    const action: RecentAction = { ...context, kind: 'complete', task: a }
    const undone = undoTasks(
      [{ ...a, title: '수정한 제목', completedAt: '2026-11-20T01:00:00.000Z' }, b],
      action,
    )
    expect(undone[0]).toMatchObject({ title: '수정한 제목', completedAt: null })
    expect(undone[1]).toEqual(b)
  })
  it('restores edited properties and never mutates task data for plan undo', () => {
    expect(
      undoTasks([{ ...a, title: '새 제목' }], { ...context, kind: 'edit', task: a })[0].title,
    ).toBe(a.title)
    const tasks = [a, b]
    expect(undoTasks(tasks, { ...context, kind: 'automation' })).toBe(tasks)
  })
})
