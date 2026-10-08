import { useRef, useState } from 'react'
import { encouragements, validateSentence, type Milestone } from './encouragement'
import {
  defaultPreferences,
  loadPreferences,
  mergeProcessed,
  savePreferences,
  type PreferenceDraft,
  type ProcessedDays,
} from './preferences'

export function usePreferences() {
  const [initial] = useState(() => loadPreferences())
  const [preferences, setPreferences] = useState(initial.data)
  const current = useRef(initial.data)
  const sessionProcessed = useRef<ProcessedDays>({})
  const [guard, setGuard] = useState(initial.state)
  const [error, setError] = useState(initial.reason)

  function applySaved(next: typeof preferences) {
    const result = savePreferences(next)
    if (result.ok) {
      current.current = next
      setPreferences(next)
      setGuard('ready')
      setError('')
    } else setError(result.reason)
    return result
  }
  function save(draft: PreferenceDraft) {
    const invalid =
      draft.sentenceMode === 'custom' || draft.customSentence.trim()
        ? validateSentence(draft.customSentence)
        : ''
    if (invalid) return { ok: false, reason: invalid }
    if (guard !== 'ready')
      return {
        ok: false,
        reason: '설정 원본 보호 중입니다. 다시 읽기 또는 설정만 초기화를 먼저 진행해 주세요.',
      }
    return applySaved({ ...current.current, ...draft, customSentence: draft.customSentence.trim() })
  }
  function processMilestone(day: string, milestone: Milestone): string | undefined {
    const previous = current.current
    if (previous.processed[day]?.includes(milestone)) return
    sessionProcessed.current = mergeProcessed(sessionProcessed.current, { [day]: [milestone] })
    const next = {
      ...previous,
      processed: mergeProcessed(previous.processed, sessionProcessed.current),
    }
    // Consume in memory before attempting persistence. A failed mark write never re-runs completion.
    current.current = next
    setPreferences(next)
    if (guard === 'ready') {
      const result = savePreferences(next)
      setError(
        result.ok
          ? ''
          : '격려 처리 표시를 저장하지 못했습니다. 이번 세션에서는 중복을 막지만 새로고침 후에는 저장 상태에 따라 다시 표시될 수 있습니다. 설정에서 저장 재시도를 사용할 수 있습니다.',
      )
    }
    if (previous.encouragementEnabled)
      return encouragements[previous.sentenceMode === 'humor' ? 'humor' : 'calm'][milestone]
  }
  function retry() {
    if (guard === 'ready') {
      const result = applySaved(current.current)
      return result.ok
        ? {
            ok: true,
            reason:
              '현재 적용된 설정과 격려 표시를 저장했습니다. 편집 중인 초안은 별도로 설정 저장을 눌러 적용해 주세요.',
          }
        : result
    }
    const loaded = loadPreferences()
    if (loaded.state !== 'ready') {
      setGuard(loaded.state)
      setError(loaded.reason)
      return { ok: false, reason: loaded.reason }
    }
    const next = {
      ...loaded.data,
      processed: mergeProcessed(loaded.data.processed, sessionProcessed.current),
    }
    current.current = next
    setPreferences(next)
    setGuard('ready')
    setError('')
    if (Object.keys(sessionProcessed.current).length) {
      const result = applySaved(next)
      return result.ok
        ? {
            ok: true,
            reason:
              '설정을 다시 읽고 이번 세션의 격려 표시를 저장했습니다. 편집 중인 초안은 별도로 저장해 주세요.',
          }
        : result
    }
    return { ok: true, reason: '설정을 다시 읽었습니다. 초안을 저장하면 적용됩니다.' }
  }
  function reset() {
    return applySaved({
      ...defaultPreferences(),
      processed: mergeProcessed(current.current.processed, sessionProcessed.current),
    })
  }
  return { preferences, guard, error, save, retry, reset, processMilestone }
}
