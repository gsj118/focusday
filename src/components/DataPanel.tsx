import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  dataCounts,
  BACKUP_LIMIT_LABEL,
  MAX_BACKUP_BYTES,
  parseBackup,
  prepareRestore,
  type Backup,
  type RestoreMode,
} from '../backup'
import type { AppData } from '../domain'
import type { LoadResult, SaveResult } from '../storage'
import { PanelDialog } from './PanelDialog'
import { PanelStorageNotice } from './PanelStorageNotice'

export function DataPanel({
  data,
  guard,
  saveError,
  onExport,
  onRestore,
  onClose,
}: {
  data: AppData
  guard: LoadResult['state']
  saveError: boolean
  onExport: () => SaveResult
  onRestore: (incoming: AppData, mode: RestoreMode) => SaveResult
  onClose: () => void
}) {
  const [backup, setBackup] = useState<Backup | null>(null)
  const [filename, setFilename] = useState('')
  const [mode, setMode] = useState<RestoreMode>('merge')
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const [exportFeedback, setExportFeedback] = useState<SaveResult | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [restored, setRestored] = useState(false)
  const request = useRef(0)
  const previewHeading = useRef<HTMLHeadingElement>(null)
  const errorMessage = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    if (backup) {
      previewHeading.current?.focus()
      previewHeading.current?.scrollIntoView({ block: 'start' })
    }
  }, [backup, confirmReplace])
  useLayoutEffect(() => {
    if (error) {
      errorMessage.current?.focus()
      errorMessage.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [error])
  useEffect(
    () => () => {
      request.current++
    },
    [],
  )
  const currentCounts = dataCounts(data)
  const counts = backup ? dataCounts(backup.data) : null
  const prepared = backup ? prepareRestore(data, backup.data, mode) : null

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    event.currentTarget.value = ''
    const token = ++request.current
    setFilename(file.name)
    setBackup(null)
    setError('')
    setMode('merge')
    setConfirmReplace(false)
    setRestored(false)
    if (file.size > MAX_BACKUP_BYTES) {
      setReading(false)
      setError(`${BACKUP_LIMIT_LABEL} 이하의 백업 파일을 다시 선택해 주세요.`)
      return
    }
    setReading(true)
    try {
      const parsed = parseBackup(await file.text(), file.size)
      if (token !== request.current) return
      if (parsed.ok) setBackup(parsed.backup)
      else setError(parsed.reason)
    } catch {
      if (token === request.current)
        setError('파일을 읽지 못했어요. 백업 파일을 다시 선택해 주세요.')
    } finally {
      if (token === request.current) setReading(false)
    }
  }
  function apply() {
    if (!backup) return
    const result = onRestore(backup.data, mode)
    if (result.ok) {
      setError('')
      setRestored(true)
      setConfirmReplace(false)
      setBackup(null)
    } else setError(result.reason)
  }
  const exportButton = (
    <button className="secondary-button" onClick={() => setExportFeedback(onExport())}>
      백업 파일 다운로드
    </button>
  )
  return (
    <PanelDialog title="백업·복원" kind="data" onClose={onClose}>
      <p className="panel-intro">
        할 일을 파일로 보관하거나 다른 기기로 옮길 수 있어요. 문구 설정과 오늘 계획은 백업에
        포함되지 않아요.
      </p>
      <PanelStorageNotice guard={guard} saveError={saveError} />
      {guard !== 'ready' && (
        <p className="field-hint">
          지금 백업하면 이 탭에 보이는 목록만 담겨요. 보호 중인 저장 원본은 따로 내려받아 주세요.
        </p>
      )}
      {exportFeedback && (
        <p
          className={exportFeedback.ok ? 'panel-feedback' : 'field-error'}
          role={exportFeedback.ok ? 'status' : 'alert'}
        >
          {exportFeedback.reason}
        </p>
      )}
      {restored && (
        <section className="restore-success" role="status">
          <h3>복원 완료</h3>
          <p>백업 내용을 저장했어요. 현재 목록에는 할 일 {currentCounts.total}개가 있어요.</p>
          <button className="primary-button" onClick={onClose}>
            목록으로 돌아가기
          </button>
        </section>
      )}
      {!confirmReplace && (
        <>
          <section className="data-section" aria-labelledby="export-heading">
            <h3 id="export-heading">전체 할 일 백업</h3>
            <p>
              현재 탭의 전체 {currentCounts.total}개 · 미완료 {currentCounts.unfinished}개 · 완료{' '}
              {currentCounts.completed}개
            </p>
            <p className="field-hint">
              완료한 일과 예시, 기한·분류도 함께 담아요. 아직 저장되지 않은 변경도 포함해요.
            </p>
            <p className="field-hint">
              최대 {BACKUP_LIMIT_LABEL}까지 백업할 수 있어요. 용량을 넘으면 다운로드를 멈추고 목록은
              그대로 둬요.
            </p>
            {exportButton}
          </section>
          <section className="data-section" aria-labelledby="import-heading">
            <h3 id="import-heading">백업 파일 가져오기</h3>
            <p className="field-hint">
              Focusday 백업 파일(.json, 최대 {BACKUP_LIMIT_LABEL})을 골라 주세요. 내용을 확인한 뒤
              복원해요.
            </p>
            <label htmlFor="backup-file" className="file-label">
              백업 파일 선택
            </label>
            <input
              id="backup-file"
              type="file"
              accept=".json,application/json"
              onChange={chooseFile}
            />
            {reading && (
              <p role="status" className="field-hint">
                백업 파일을 확인하고 있어요…
              </p>
            )}
            {filename && <p className="file-name">{filename}</p>}
          </section>
        </>
      )}
      {error && (
        <p ref={errorMessage} tabIndex={-1} className="field-error" role="alert">
          {error}
        </p>
      )}
      {backup && counts && prepared && (
        <section className="restore-preview" aria-labelledby="preview-heading">
          <h3 ref={previewHeading} tabIndex={-1} id="preview-heading">
            {confirmReplace ? '전체 교체 확인' : '복원 미리보기'}
          </h3>
          <p>
            백업 전체 {counts.total}개 · 미완료 {counts.unfinished}개 · 완료 {counts.completed}개
          </p>
          <p className="field-hint">
            백업 시각:{' '}
            {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
              new Date(backup.exportedAt),
            )}
          </p>
          {confirmReplace ? (
            <>
              <p className="replace-warning">
                현재 목록 {currentCounts.total}개를 백업의 {counts.total}개로 바꿔요. 현재 목록에만
                있는 할 일은 사라져요. 교체하기 전에 백업을 보관해 주세요.
              </p>
              {exportButton}
              <div className="restore-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setConfirmReplace(false)
                    setError('')
                  }}
                >
                  교체 취소
                </button>
                <button className="danger-button" disabled={guard !== 'ready'} onClick={apply}>
                  {error ? '전체 교체 다시 시도' : '확인 후 전체 교체'}
                </button>
              </div>
            </>
          ) : (
            <>
              <fieldset className="restore-modes">
                <legend>복원 방식</legend>
                <label>
                  <input
                    type="radio"
                    name="restore-mode"
                    checked={mode === 'merge'}
                    onChange={() => {
                      setMode('merge')
                      setError('')
                    }}
                  />
                  기존 데이터에 합치기
                </label>
                <label>
                  <input
                    type="radio"
                    name="restore-mode"
                    checked={mode === 'replace'}
                    onChange={() => {
                      setMode('replace')
                      setError('')
                    }}
                  />
                  백업으로 전체 교체
                </label>
              </fieldset>
              {mode === 'merge' ? (
                <div className="merge-summary">
                  <p>
                    추가 {prepared.added}개 · 기존 항목 유지 {prepared.duplicates}개
                  </p>
                  <p>내용이 달라진 기존 항목 {prepared.conflicts}개도 현재 내용을 유지해요.</p>
                  <p className="field-hint">
                    제목이 같아도 별도로 만든 할 일은 각각 남아요. 합치면 전체{' '}
                    {prepared.data.tasks.length}개가 돼요.
                  </p>
                </div>
              ) : (
                <p className="replace-warning">
                  현재 {currentCounts.total}개 → 교체 후 {counts.total}개. 다음 단계에서 한 번 더
                  확인한 뒤 적용해요.
                </p>
              )}
              <div className="restore-actions">
                <button className="secondary-button" onClick={onClose}>
                  복원 취소
                </button>
                <button
                  className={mode === 'replace' ? 'danger-button' : 'primary-button'}
                  disabled={guard !== 'ready' || reading}
                  onClick={() => (mode === 'replace' ? setConfirmReplace(true) : apply())}
                >
                  {mode === 'replace'
                    ? '전체 교체 확인으로 이동'
                    : error
                      ? '합치기 다시 시도'
                      : '합치기 적용'}
                </button>
              </div>
            </>
          )}
          {guard !== 'ready' && (
            <p className="field-error">저장된 원본을 확인한 뒤에 백업을 가져올 수 있어요.</p>
          )}
        </section>
      )}
    </PanelDialog>
  )
}
