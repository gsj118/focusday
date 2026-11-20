import { daysBetween, localDate, type Task } from './domain'

export type SentenceMode = 'calm' | 'humor' | 'custom' | 'off'
export type Milestone = 1 | 3
export const CONTENT_VERSION = 1
export const ORIGINAL_GUIDANCE = '오늘 정한 일부터 하나씩 마쳐 보세요.'
export type Sentence = { id: string; kind: 'calm' | 'humor'; text: string }
// Focusday original writing. Stable ids/order within this content version; no runtime API.
export const sentences: readonly Sentence[] = [
  { id: 'calm-01', kind: 'calm', text: '오늘 할 수 있는 일 하나부터 시작해 보세요.' },
  { id: 'calm-02', kind: 'calm', text: '작게 시작해도 한 걸음 나아간 거예요.' },
  { id: 'calm-03', kind: 'calm', text: '지금 할 수 있는 만큼만 골라보세요.' },
  { id: 'calm-04', kind: 'calm', text: '한 번에 하나씩 해도 괜찮아요.' },
  { id: 'calm-05', kind: 'calm', text: '잠시 쉬어도 하던 일은 여기 있어요.' },
  { id: 'calm-06', kind: 'calm', text: '오늘 할 만큼만 정해 보세요.' },
  { id: 'calm-07', kind: 'calm', text: '막막한 일도 한 줄부터 적어 보세요.' },
  { id: 'calm-08', kind: 'calm', text: '목록에 담아두면 잠깐 내려놓을 수 있어요.' },
  { id: 'calm-09', kind: 'calm', text: '작은 일도 마쳤다면 오늘 해낸 일이에요.' },
  { id: 'calm-10', kind: 'calm', text: '계획은 바뀌어도 괜찮아요.' },
  { id: 'calm-11', kind: 'calm', text: '서두르지 말고 하나씩 마쳐 보세요.' },
  { id: 'calm-12', kind: 'calm', text: '가장 신경 쓰이는 일부터 적어 보세요.' },
  { id: 'humor-01', kind: 'humor', text: '머릿속으로만 기억하기엔 할 일이 좀 많죠.' },
  { id: 'humor-02', kind: 'humor', text: '머릿속 탭이 너무 많다면 여기 하나 옮겨 두세요.' },
  { id: 'humor-03', kind: 'humor', text: '한 가지부터 해봐요. 시작이 반이라니까요.' },
  { id: 'humor-04', kind: 'humor', text: '할 일 목록에도 쉬는 시간이 필요하죠.' },
  { id: 'humor-05', kind: 'humor', text: '미래의 나에게 보낼 메모, 여기 맡겨두세요.' },
  { id: 'humor-06', kind: 'humor', text: '체크 하나만 해도 제법 뿌듯하죠.' },
  { id: 'humor-07', kind: 'humor', text: '거창한 계획도 일단 한 줄로 입장합니다.' },
  { id: 'humor-08', kind: 'humor', text: '커피가 식기 전에 제목 하나쯤. 식어도 괜찮고요.' },
  { id: 'humor-09', kind: 'humor', text: '오늘의 목록은 무한 뷔페가 아니어도 돼요.' },
  { id: 'humor-10', kind: 'humor', text: '계획 변경도 계획이 하는 일 중 하나죠.' },
  { id: 'humor-11', kind: 'humor', text: '미래의 나도 바쁠 테니, 작은 일 하나만 해둘까요.' },
  { id: 'humor-12', kind: 'humor', text: '고민은 잠깐 쉬고, 작은 일부터 해봐요.' },
]
export const encouragements = {
  calm: {
    1: '오늘 첫 번째 일을 마쳤어요. 수고했어요.',
    3: '오늘 벌써 세 가지를 마쳤어요. 잠깐 쉬어 가도 좋아요.',
  },
  humor: {
    1: '첫 체크 완료! 목록이 한 칸 가벼워졌네요.',
    3: '오늘 체크 세 칸. 목록이 조금 가벼워졌네요.',
  },
} as const
export function dailySentence(day: string, mode: SentenceMode, custom = ''): string {
  if (mode === 'off') return ORIGINAL_GUIDANCE
  if (mode === 'custom') return custom
  const pool = sentences.filter((sentence) => sentence.kind === mode)
  const ordinal = daysBetween('2000-01-01', day)
  const index = (((ordinal + CONTENT_VERSION - 1) % pool.length) + pool.length) % pool.length
  return pool[index].text
}
export function sentenceLength(value: string) {
  return Array.from(value.trim()).length
}
export function validateSentence(value: string) {
  const length = sentenceLength(value)
  if (!length) return '내 문장을 입력해 주세요. 앞뒤 빈칸을 뺀 1~120자로 적을 수 있어요.'
  if (length > 120) return `내 문장은 120자까지 입력할 수 있어요. 현재 ${length}자입니다.`
  return ''
}
export function selectAchievements(tasks: Task[], day: string, includeDemo = false): Task[] {
  return tasks
    .filter(
      (task) =>
        (includeDemo || !task.isDemo) &&
        task.completedAt &&
        localDate(new Date(task.completedAt)) === day,
    )
    .sort(
      (a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!) || a.id.localeCompare(b.id),
    )
}
export function completionMilestone(before: number, after: number): Milestone | null {
  return before === 0 && after === 1 ? 1 : before === 2 && after === 3 ? 3 : null
}
