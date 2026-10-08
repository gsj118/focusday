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
        '설정 형식 또는 버전을 지원하지 않습니다. 원본을 유지하고 이번 탭에서는 기본 설정을 사용합니다.',
    }
  } catch (error) {
    return error instanceof SyntaxError
      ? {
          data: defaultPreferences(),
          state: 'blocked',
          reason:
            '설정 JSON이 손상되었습니다. 원본을 유지하고 이번 탭에서는 기본 설정을 사용합니다.',
        }
      : {
          data: defaultPreferences(),
          state: 'unavailable',
          reason: '설정을 읽을 수 없습니다. 이번 탭에서는 기본 설정을 사용합니다.',
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
      reason: '설정 저장에 실패했습니다. 초안을 유지했습니다. 저장을 다시 시도해 주세요.',
    }
  }
}
