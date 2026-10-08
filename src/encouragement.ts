import { daysBetween, localDate, type Task } from './domain'

export type SentenceMode = 'calm' | 'humor' | 'custom' | 'off'
export type Milestone = 1 | 3
export const CONTENT_VERSION = 1
export const ORIGINAL_GUIDANCE = '해야 할 모든 일보다, 오늘 할 일에 집중하세요.'
export type Sentence = { id: string; kind: 'calm' | 'humor'; text: string }
// Focusday original writing. Stable ids/order within this content version; no runtime API.
export const sentences: readonly Sentence[] = [
  { id: 'calm-01', kind: 'calm', text: '완벽한 하루보다, 시작한 한 가지.' },
  { id: 'calm-02', kind: 'calm', text: '작게 시작해도 오늘의 진전입니다.' },
  { id: 'calm-03', kind: 'calm', text: '지금 할 수 있는 만큼만 골라보세요.' },
  { id: 'calm-04', kind: 'calm', text: '한 번에 하나씩, 마음에 여백을 남기세요.' },
  { id: 'calm-05', kind: 'calm', text: '잠시 쉬어도 하던 일은 여기 있습니다.' },
  { id: 'calm-06', kind: 'calm', text: '오늘의 속도는 오늘 정해도 괜찮아요.' },
  { id: 'calm-07', kind: 'calm', text: '큰 일도 첫 줄부터 시작됩니다.' },
  { id: 'calm-08', kind: 'calm', text: '목록에 담아두면 잠깐 내려놓을 수 있어요.' },
  { id: 'calm-09', kind: 'calm', text: '마친 일 하나를 조용히 돌아보세요.' },
  { id: 'calm-10', kind: 'calm', text: '계획은 바뀌어도 괜찮습니다.' },
  { id: 'calm-11', kind: 'calm', text: '서두르지 않고, 다음 한 걸음.' },
  { id: 'calm-12', kind: 'calm', text: '중요한 일에 작은 자리를 내어주세요.' },
  { id: 'humor-01', kind: 'humor', text: '할 일도 첫인사는 어색하죠. 제목부터 적어볼까요.' },
  { id: 'humor-02', kind: 'humor', text: '머릿속 탭 하나, 목록으로 이사 완료.' },
  { id: 'humor-03', kind: 'humor', text: '시작 버튼은 작아도 눌러볼 만합니다.' },
  { id: 'humor-04', kind: 'humor', text: '할 일 목록에도 빈자리가 필요하대요.' },
  { id: 'humor-05', kind: 'humor', text: '미래의 나에게 보낼 메모, 여기 맡겨두세요.' },
  { id: 'humor-06', kind: 'humor', text: '체크 한 칸의 맛, 의외로 괜찮습니다.' },
  { id: 'humor-07', kind: 'humor', text: '거창한 계획도 일단 한 줄로 입장합니다.' },
  { id: 'humor-08', kind: 'humor', text: '커피가 식기 전에 제목 하나쯤. 식어도 괜찮고요.' },
  { id: 'humor-09', kind: 'humor', text: '오늘의 목록은 무한 뷔페가 아니어도 됩니다.' },
  { id: 'humor-10', kind: 'humor', text: '계획 변경도 계획이 하는 일 중 하나죠.' },
  { id: 'humor-11', kind: 'humor', text: '작은 일부터 시작하면 큰 일도 구경하러 올지 몰라요.' },
  { id: 'humor-12', kind: 'humor', text: '생각은 잠깐 주차하고, 한 가지 출발.' },
]
export const encouragements = {
  calm: {
    1: '첫 한 가지를 마쳤어요. 작은 진전입니다.',
    3: '오늘 세 가지를 마쳤어요. 잠깐 돌아보세요.',
  },
  humor: {
    1: '첫 체크, 목록에 작은 빈자리가 생겼네요.',
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
  if (!length) return '내 문장을 입력해 주세요. 공백을 제외한 1–120자를 사용할 수 있습니다.'
  if (length > 120) return `내 문장은 120자까지 입력할 수 있습니다. 현재 ${length}자입니다.`
  return ''
}
export function selectAchievements(tasks: Task[], day: string): Task[] {
  return tasks
    .filter(
      (task) => !task.isDemo && task.completedAt && localDate(new Date(task.completedAt)) === day,
    )
    .sort(
      (a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!) || a.id.localeCompare(b.id),
    )
}
export function completionMilestone(before: number, after: number): Milestone | null {
  return before === 0 && after === 1 ? 1 : before === 2 && after === 3 ? 3 : null
}
