import { isDate } from './domain'
import { sentenceLength, type SentenceMode, type Milestone } from './encouragement'
import type { StoragePort, SaveResult } from './storage'

export const UI_STORAGE_KEY = 'focusday:ui:v1'
export type PreferenceDraft = {
  sentenceMode: SentenceMode
  customSentence: string
  encouragementEnabled: boolean
}
export type ProcessedDays = Record<string, Milestone[]>
export type UIPreferences = PreferenceDraft & { version: 1; processed: ProcessedDays }
export type PreferenceLoad = {
  data: UIPreferences
  state: 'ready' | 'blocked' | 'unavailable'
  reason: string
}
export const defaultPreferences = (): UIPreferences => ({
  version: 1,
  sentenceMode: 'calm',
  customSentence: '',
  encouragementEnabled: true,
  processed: {},
})
export function isPreferences(value: unknown): value is UIPreferences {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    data.version === 1 &&
    ['calm', 'humor', 'custom', 'off'].includes(data.sentenceMode as string) &&
    typeof data.customSentence === 'string' &&
    data.customSentence === data.customSentence.trim() &&
    sentenceLength(data.customSentence) <= 120 &&
    (data.sentenceMode !== 'custom' || !!data.customSentence) &&
    typeof data.encouragementEnabled === 'boolean' &&
    !!data.processed &&
    typeof data.processed === 'object' &&
    !Array.isArray(data.processed) &&
    Object.entries(data.processed).every(
      ([day, marks]) =>
        isDate(day) &&
        Array.isArray(marks) &&
        marks.every((mark) => mark === 1 || mark === 3) &&
        new Set(marks).size === marks.length,
    )
  )
}
export function mergeProcessed(a: ProcessedDays, b: ProcessedDays): ProcessedDays {
  const next = { ...a }
  for (const [day, marks] of Object.entries(b))
    next[day] = [...new Set([...(next[day] || []), ...marks])].sort()
  return next
}
export function loadPreferences(
  getStorage: () => StoragePort = () => window.localStorage,
): PreferenceLoad {
  try {
    const raw = getStorage().getItem(UI_STORAGE_KEY)
    if (raw === null) return { data: defaultPreferences(), state: 'ready', reason: '' }
    const parsed: unknown = JSON.parse(raw)
    if (isPreferences(parsed)) return { data: parsed, state: 'ready', reason: '' }
    return {
      data: defaultPreferences(),
      state: 'blocked',
      reason:
        '이 문구 설정은 불러올 수 없는 형식이에요. 원본은 그대로 두고 이 탭에서는 기본 문구를 보여드려요.',
    }
  } catch (error) {
    return error instanceof SyntaxError
      ? {
          data: defaultPreferences(),
          state: 'blocked',
          reason:
            '문구 설정이 손상되어 읽지 못했어요. 원본은 그대로 두고 이 탭에서는 기본 문구를 보여드려요.',
        }
      : {
          data: defaultPreferences(),
          state: 'unavailable',
          reason: '문구 설정을 불러오지 못했어요. 이 탭에서는 기본 문구를 보여드려요.',
        }
  }
}
export function savePreferences(
  data: UIPreferences,
  getStorage: () => StoragePort = () => window.localStorage,
): SaveResult {
  try {
    getStorage().setItem(UI_STORAGE_KEY, JSON.stringify(data))
    return { ok: true, reason: '' }
  } catch {
    return {
      ok: false,
      reason: '설정을 저장하지 못했어요. 편집한 내용은 남아 있으니 다시 저장해 주세요.',
    }
  }
}
