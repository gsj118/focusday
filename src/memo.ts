import { addDays, calendarDate, isDate, validateTitle } from './domain'
import { parseCapture, type CapturedTask } from './capture'

export type MemoTask = CapturedTask & { source: string; suggestions: string[] }
export type MemoResult = {
  tasks: MemoTask[]
  errors: { line: number; message: string }[]
  warnings: string[]
}

const dateWords =
  '(?:오늘|내일|모레|글피|(?:이번|다음|다다음)\\s*주\\s*[월화수목금토일]요일|[월화수목금토일]요일|\\d{4}-\\d{2}-\\d{2}|(?:\\d{4}년\\s*)?\\d{1,2}월\\s*\\d{1,2}일|\\d+일\\s*(?:뒤|후)|일주일\\s*(?:뒤|후)|이번\\s*주말|주말)'
const datePattern = new RegExp(`(^|\\s)(${dateWords})(?:까지|에는|에|은|는|쯤)?(?=\\s|$)`, 'gu')
const leadingDatePattern = new RegExp(`^(${dateWords})(?:까지|에는|에|은|는|쯤)?(?=\\s|$)`, 'u')
const repeatPattern =
  /(?:^|\s)(?:매일|매주|매달|매월|매년|격주)(?=\s|[월화수목금토일]요일|$)|(?:요일|\d+(?:일|주|달|개월|년))마다|(?:^|\s)반복(?:해서|하기)?(?=\s|$)/u
// Split known action endings, never an arbitrary noun such as "친구하고" or "사고".
const actionConnector =
  /(?:(?<=(?:제출|준비|정리|청소|빨래|세탁|설거지|운동|산책|예약|확인|결제|신청|연락|공부|조사|작성|출력|반납|구매|분리수거)하고)|(?<=(?:돌리|읽|먹|마시|챙기|치우)고))\s+(?!(?:\s|싶|있|나서|나면|보니|보면))/u
const categories: [string, RegExp][] = [
  ['학교', /과제|수업|강의|교수|시험|레포트|리포트|논문|발표/],
  ['업무', /회의|보고서|견적|업무|고객|거래처|출근|프로젝트/],
  ['생활', /빨래|세탁|설거지|장보기|장 봐|청소|쓰레기|택배|공과금|반납|분리수거/],
  ['건강', /운동|산책|병원|치과|약국|검진|헬스|스트레칭/],
  ['개인', /친구|안부|생일|여행|부모님|가족/],
]

function dateFromPhrase(phrase: string, today: string): string | null {
  const compact = phrase.replace(/\s/gu, '')
  const relative: Record<string, number> = { 오늘: 0, 내일: 1, 모레: 2, 글피: 3 }
  if (compact in relative) return addDays(today, relative[compact])
  if (/^\d{4}-/u.test(compact)) return isDate(compact) ? compact : null
  const offset = compact.match(/^(\d+|일주일)(?:일)?(?:뒤|후)$/u)
  if (offset) {
    const days = offset[1] === '일주일' ? 7 : Number(offset[1])
    return days <= 3650 ? addDays(today, days) : null
  }
  const explicit = compact.match(/^(?:(\d{4})년)?(\d{1,2})월(\d{1,2})일$/u)
  if (explicit) {
    const key = `${explicit[1] || today.slice(0, 4)}-${explicit[2].padStart(2, '0')}-${explicit[3].padStart(2, '0')}`
    return isDate(key) ? key : null
  }
  const day = (calendarDate(today).getDay() + 6) % 7
  if (compact === '주말' || compact === '이번주말') return addDays(today, (5 - day + 7) % 7)
  const weekday = compact.match(/^(이번주|다음주|다다음주)?([월화수목금토일])요일$/u)
  if (weekday) {
    const target = '월화수목금토일'.indexOf(weekday[2])
    const shift = weekday[1] === '다음주' ? 7 : weekday[1] === '다다음주' ? 14 : 0
    return addDays(today, weekday[1] ? target - day + shift : (target - day + 7) % 7)
  }
  return null
}

function tidyTitle(value: string, connectsNext: boolean) {
  const title = value
    .replace(/^(?:그리고|또는|또|그다음에?|그 다음에?)\s+/u, '')
    .replace(/[.!?。]+$/u, '')
    .replace(/\s+/gu, ' ')
    .replace(/도?\s*해\s*(?:놔|놓아)야\s*(?:하고|해요|해|돼요|돼|한다|함)?$/u, '하기')
    .replace(/해야\s*(?:돼요|돼|해요|해|한다|함|겠어요|겠어|겠다|지)(?:\s*하고)?$/u, '하기')
    .replace(/해야$/u, '하기')
    .replace(/(?:장도?\s*봐야\s*(?:해요|해|돼요|돼)|장\s*보기)$/u, '장보기')
    .replace(/(?:하기로\s*했어(?:요)?|할\s*예정(?:이에요|이야)?|할\s*것)$/u, '하기')
    .replace(/하고$/u, '하기')
    .trim()
  return connectsNext ? title.replace(/(돌리|읽|먹|마시|챙기|치우|내|준비하)고$/u, '$1기') : title
}

/** Conservative Korean rules. Unknown expressions remain visible; suggestions are editable. */
export function parseMemo(input: string, today: string, recognize = true): MemoResult {
  const result: MemoResult = { tasks: [], errors: [], warnings: [] }
  if (!recognize) {
    const literal = parseCapture(input, today, false)
    if (literal.tasks.length > 100)
      literal.errors.push({
        line: 1,
        message: '한 번에 100개까지 담을 수 있어요. 메모를 나눠 주세요.',
      })
    return {
      ...literal,
      tasks: literal.tasks.map((t) => ({ ...t, source: t.title, suggestions: [] })),
      warnings: [],
    }
  }
  input.split(/\r?\n/u).forEach((raw, index) => {
    const line = index + 1
    const sentences = raw
      .replace(/^\s*(?:[-*•]|\d+[.)])\s+/u, '')
      .split(
        /(?:[;；]|[.!?。](?=\s|$)|,\s+|\s+(?:그리고|그다음에?|그 다음에?)\s+|(?<=[가-힣]고)\s+(?=(?:오늘|내일|모레|글피|다음\s*주|이번\s*주|다다음\s*주|[월화수목금토일]요일)\s*))/u,
      )
      .map((s) => s.trim())
      .filter(Boolean)
    const clauses = sentences.flatMap((sentence) => {
      const parts = repeatPattern.test(sentence) ? [sentence] : sentence.split(actionConnector)
      const sharedDate =
        parts.length > 1 && !repeatPattern.test(sentence)
          ? sentence.match(leadingDatePattern)?.[1]
          : undefined
      return parts.map((source, partIndex) => ({
        source,
        inheritedDate:
          partIndex > 0 && sharedDate && ![...source.matchAll(datePattern)].length
            ? dateFromPhrase(sharedDate, today)
            : null,
      }))
    })
    clauses.forEach(({ source, inheritedDate }, clauseIndex) => {
      // Reuse the existing explicit #category / !priority validation.
      const repeating = repeatPattern.test(source)
      const explicit = parseCapture(source, today, true, { dates: !repeating })
      if (explicit.errors.length) {
        result.errors.push(...explicit.errors.map((e) => ({ ...e, line })))
        return
      }
      const task = explicit.tasks[0]
      if (!task) return
      const suggestions: string[] = []
      let text = task.title
      const dates = repeating ? [] : [...text.matchAll(datePattern)]
      if (dates.length + Number(task.dueDate !== null) > 1) {
        result.errors.push({
          line,
          message: '한 할 일에 날짜가 두 개 있어요. 줄을 나누거나 기한 하나만 남겨 주세요.',
        })
        return
      }
      if (dates.length) {
        const date = dateFromPhrase(dates[0][2], today)
        if (!date) {
          result.errors.push({
            line,
            message: '날짜를 확인해 주세요. 달력에 없는 날짜이거나 지원 범위를 벗어났어요.',
          })
          return
        }
        task.dueDate = date
        text = text.replace(datePattern, ' ').trim()
      }
      if (!task.dueDate && inheritedDate && !repeating) {
        task.dueDate = inheritedDate
        result.warnings.push(
          '한 문장에 이어 쓴 할 일에는 앞의 날짜를 함께 적용했어요. 저장 전에 확인해 주세요.',
        )
      }
      if (task.dueDate) suggestions.push('기한 인식')
      const title = tidyTitle(text, clauseIndex < clauses.length - 1)
      const invalid = validateTitle(title)
      if (invalid) {
        result.errors.push({ line, message: invalid })
        return
      }
      if (!task.category) {
        const matches = categories.filter(([, pattern]) => pattern.test(title))
        if (matches.length === 1) {
          task.category = matches[0][0]
          suggestions.push('분류 제안')
        }
      }
      if (
        task.priority === 'none' &&
        /(?:^|\s)(?:긴급|최우선|급하게)(?:\s|$)/u.test(title) &&
        !/아니|아님|않|없/u.test(title)
      ) {
        task.priority = 'high'
        suggestions.push('우선순위 제안')
      }
      if (repeating)
        result.warnings.push(
          '반복 일정은 만들지 않아요. 날짜 표현을 제목에 남겼으니, 이번에 할 기한은 직접 골라 주세요.',
        )
      if (/(?:오전|오후)\s*\d|\d+시|\d{1,2}:\d{2}/u.test(source))
        result.warnings.push('시간 표현은 제목에 남겨 두었어요. 시간 알림은 제공하지 않아요.')
      if (!task.dueDate && /언젠가|이번\s*주|다음\s*주|나중에|월말/u.test(source))
        result.warnings.push(
          '날짜가 분명하지 않은 표현은 제목에 남겨 두었어요. 필요하면 기한을 직접 골라 주세요.',
        )
      result.tasks.push({ ...task, line, title, source, suggestions })
    })
  })
  if (!result.tasks.length && !result.errors.length)
    result.errors.push({ line: 1, message: '생각난 할 일을 적어 주세요.' })
  if (result.tasks.length > 100)
    result.errors.push({
      line: 1,
      message: '한 번에 100개까지 정리할 수 있어요. 메모를 나눠 주세요.',
    })
  result.warnings = [...new Set(result.warnings)]
  return result
}
