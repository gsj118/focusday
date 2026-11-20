import { useLayoutEffect, useRef, useState } from 'react'
import { sentenceLength, validateSentence, type SentenceMode } from '../encouragement'
import type { PreferenceDraft, UIPreferences } from '../preferences'
import type { SaveResult } from '../storage'
import { PanelDialog } from './PanelDialog'

export function PreferencesPanel({
  preferences,
  guard,
  storageError,
  onSave,
  onRetry,
  onReset,
  onClose,
}: {
  preferences: UIPreferences
  guard: 'ready' | 'blocked' | 'unavailable'
  storageError: string
  onSave: (draft: PreferenceDraft) => SaveResult
  onRetry: () => SaveResult
  onReset: () => SaveResult
  onClose: () => void
}) {
  const [draft, setDraft] = useState<PreferenceDraft>({
    sentenceMode: preferences.sentenceMode,
    customSentence: preferences.customSentence,
    encouragementEnabled: preferences.encouragementEnabled,
  })
  const [feedback, setFeedback] = useState<SaveResult | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const error = useRef<HTMLParagraphElement>(null)
  const composing = useRef(false)
  const lastCompositionEnd = useRef(0)
  useLayoutEffect(() => {
    if (feedback) {
      if (!feedback.ok) error.current?.focus()
      error.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [feedback])
  function save() {
    if (composing.current || Date.now() - lastCompositionEnd.current < 80) return
    const invalid = draft.sentenceMode === 'custom' ? validateSentence(draft.customSentence) : ''
    setFeedback(invalid ? { ok: false, reason: invalid } : onSave(draft))
  }
  return (
    <PanelDialog
      title="문구와 격려 설정"
      kind="preferences"
      onClose={onClose}
      footer={
        <div className="editor-footer">
          <button className="secondary-button" onClick={onClose}>
            취소
          </button>
          <button className="primary-button" onClick={save}>
            {feedback && !feedback.ok ? '설정 저장 재시도' : '설정 저장'}
          </button>
        </div>
      }
    >
      <p className="panel-intro">오늘 화면에 보일 문장과 완료했을 때의 격려를 골라 주세요.</p>
      <p className="field-hint">
        문구 설정과 내 문장은 이 브라우저에만 저장돼요. 할 일 백업에는 포함되지 않아요.
      </p>
      {storageError && (
        <div className="storage-banner" role="alert">
          <p>{storageError}</p>
          <button className="secondary-button" onClick={() => setFeedback(onRetry())}>
            {guard === 'ready' ? '설정 저장 재시도' : '설정 다시 읽기'}
          </button>
          {guard === 'blocked' && (
            <button className="text-button danger" onClick={() => setConfirmReset(true)}>
              설정만 초기화…
            </button>
          )}
        </div>
      )}
      {confirmReset && (
        <div className="preferences-reset">
          <p>
            문구와 격려 설정을 처음 상태로 바꿔요. 할 일은 그대로예요. 이전 설정은 되돌릴 수 없어요.
          </p>
          <button className="secondary-button" onClick={() => setConfirmReset(false)}>
            초기화 취소
          </button>
          <button
            className="danger-button"
            onClick={() => {
              const result = onReset()
              setFeedback(
                result.ok
                  ? {
                      ok: true,
                      reason:
                        '저장된 설정을 초기화했어요. 지금 편집 중인 문장은 그대로 남겨 두었어요.',
                    }
                  : result,
              )
              if (result.ok) setConfirmReset(false)
            }}
          >
            설정 원본 초기화 확인
          </button>
        </div>
      )}
      <div
        className="preferences-fields"
        onCompositionStartCapture={() => {
          composing.current = true
        }}
        onCompositionEndCapture={() => {
          composing.current = false
          lastCompositionEnd.current = Date.now()
        }}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            (composing.current ||
              e.nativeEvent.isComposing ||
              e.keyCode === 229 ||
              Date.now() - lastCompositionEnd.current < 80)
          )
            e.preventDefault()
        }}
      >
        <fieldset>
          <legend>오늘의 한 문장</legend>
          {(
            [
              ['calm', '차분한 문구'],
              ['humor', '유머'],
              ['custom', '내 문장'],
              ['off', '끄기'],
            ] as [SentenceMode, string][]
          ).map(([mode, label]) => (
            <label className="preference-choice" key={mode}>
              <input
                type="radio"
                name="sentence-mode"
                value={mode}
                checked={draft.sentenceMode === mode}
                onChange={() => {
                  setDraft({ ...draft, sentenceMode: mode })
                  setFeedback(null)
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        {draft.sentenceMode === 'custom' && (
          <div className="custom-sentence-field">
            <label htmlFor="custom-sentence">내 문장 입력</label>
            <textarea
              id="custom-sentence"
              rows={3}
              value={draft.customSentence}
              aria-describedby="custom-sentence-hint"
              onChange={(e) => {
                setDraft({ ...draft, customSentence: e.target.value })
                setFeedback(null)
              }}
            />
            <p className="field-hint" id="custom-sentence-hint">
              {sentenceLength(draft.customSentence)} / 120자 · 앞뒤 빈칸은 빼고 저장해요.
            </p>
          </div>
        )}
        <label className="preference-choice">
          <input
            type="checkbox"
            checked={draft.encouragementEnabled}
            onChange={(e) => {
              setDraft({ ...draft, encouragementEnabled: e.target.checked })
              setFeedback(null)
            }}
          />
          <span>완료 순간의 격려</span>
        </label>
        <p className="field-hint">
          오늘 첫 번째와 세 번째 일을 마치면 짧은 격려를 보여 드려요. 오늘의 한 문장과 따로 켜고 끌
          수 있어요.
        </p>
      </div>
      {feedback && (
        <p
          ref={error}
          tabIndex={feedback.ok ? undefined : -1}
          className={feedback.ok ? 'panel-feedback' : 'field-error'}
          role={feedback.ok ? 'status' : 'alert'}
        >
          {feedback.ok ? feedback.reason || '설정을 저장했어요.' : feedback.reason}
        </p>
      )}
      <p className="editor-draft-note">
        저장을 누르면 적용돼요. 취소하거나 닫으면 기존 설정을 유지해요.
      </p>
    </PanelDialog>
  )
}
