import { addDays, isDate, validateTitle, type Priority } from './domain'

export type CapturedTask = {
  line: number
  title: string
  dueDate: string | null
  category: string | null
  priority: Priority
}
export type CaptureResult = { tasks: CapturedTask[]; errors: { line: number; message: string }[] }
const priorities: Record<string, Priority> = { 높음: 'high', 보통: 'medium', 낮음: 'low' }
const datePrefix = /^(오늘|내일|모레|\d{4}-\d{2}-\d{2})(?:\s+|$)/u

/** Only explicit prefix/suffix syntax is consumed. No semantic guesses or partial commits. */
export function parseCapture(input: string, today: string, recognize = true): CaptureResult {
  const result: CaptureResult = { tasks: [], errors: [] }
  input.split(/\r?\n/u).forEach((raw, index) => {
    let title = raw.trim()
    if (!title) return
    const task: CapturedTask = {
      line: index + 1,
      title,
      dueDate: null,
      category: null,
      priority: 'none',
    }
    const fail = (message: string) => result.errors.push({ line: index + 1, message })
    if (recognize) {
      const date = title.match(datePrefix)
      if (date) {
        const word = date[1]
        task.dueDate =
          word === '오늘'
            ? today
            : word === '내일'
              ? addDays(today, 1)
              : word === '모레'
                ? addDays(today, 2)
                : word
        if (!isDate(task.dueDate)) {
          fail('유효한 날짜를 입력해 주세요.')
          return
        }
        title = title.slice(date[0].length).trim()
        if (datePrefix.test(title)) {
          fail('기한은 한 개만 지정해 주세요.')
          return
        }
      }
      let suffix: RegExpMatchArray | null
      while ((suffix = title.match(/(?:^|\s)(#\S+|!높음|!보통|!낮음)$/u))) {
        const token = suffix[1]
        if (token.startsWith('#')) {
          if (task.category !== null) {
            fail('분류는 한 개만 지정해 주세요.')
            return
          }
          task.category = token.slice(1)
          if (task.category.length > 24) {
            fail('분류는 24자 이내로 입력해 주세요.')
            return
          }
        } else {
          if (task.priority !== 'none') {
            fail('우선순위는 한 개만 지정해 주세요.')
            return
          }
          task.priority = priorities[token.slice(1)]
        }
        title = title.slice(0, suffix.index).trim()
      }
    }
    const invalid = validateTitle(title)
    if (invalid) {
      fail(invalid)
      return
    }
    result.tasks.push({ ...task, title })
  })
  if (!result.tasks.length && !result.errors.length)
    result.errors.push({ line: 1, message: '할 일 제목을 입력해 주세요.' })
  return result
}
