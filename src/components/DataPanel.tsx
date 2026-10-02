import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  dataCounts,
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
  useLayoutEffect(() => {
    if (backup) {
      previewHeading.current?.focus()
      previewHeading.current?.scrollIntoView({ block: 'start' })
    }
  }, [backup, confirmReplace])
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
      setError('5MiB 이하의 백업 파일을 다시 선택해 주세요.')
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
        setError('파일을 읽을 수 없습니다. 백업 파일을 다시 선택해 주세요.')
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
      JSON 백업 다운로드
    </button>
  )
  return (
    <PanelDialog title="백업·복원" kind="data" onClose={onClose}>
      <p className="panel-intro">
        내 할 일을 파일로 보관하고 필요할 때 가져오세요. 파일은 직접 보관해야 하며 자동 서버
        백업·동기화가 아닙니다.
      </p>
      <PanelStorageNotice guard={guard} saveError={saveError} />
      {guard !== 'ready' && (
        <p className="field-hint">
          지금 백업하면 현재 탭의 목록만 포함됩니다. 보호 중인 저장 원본은 포함되지 않습니다.
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
          <p>실제 저장을 완료했습니다. 현재 목록은 전체 {currentCounts.total}개입니다.</p>
          <button className="primary-button" onClick={onClose}>
            목록으로 돌아가기
          </button>
        </section>
      )}
      {!confirmReplace && (
        <>
          <section className="data-section" aria-labelledby="export-heading">
            <h3 id="export-heading">전체 데이터 백업</h3>
            <p>
              현재 탭의 전체 {currentCounts.total}개 · 미완료 {currentCounts.unfinished}개 · 완료{' '}
              {currentCounts.completed}개
            </p>
            <p className="field-hint">
              완료·예시와 모든 속성을 포함합니다. 저장 실패 중의 변경도 포함됩니다.
            </p>
            {exportButton}
          </section>
          <section className="data-section" aria-labelledby="import-heading">
            <h3 id="import-heading">백업 파일 가져오기</h3>
            <p className="field-hint">
              Focusday 정식 JSON 백업 · 최대 5MiB. 선택만으로 목록은 바뀌지 않습니다.
            </p>
            <label htmlFor="backup-file" className="file-label">
              백업 파일 선택 / 다시 선택
            </label>
            <input
              id="backup-file"
              type="file"
              accept=".json,application/json"
              onChange={chooseFile}
            />
            {reading && (
              <p role="status" className="field-hint">
                백업을 확인하고 있습니다…
              </p>
            )}
            {filename && <p className="file-name">{filename}</p>}
          </section>
        </>
      )}
      {error && (
        <p className="field-error" role="alert">
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
                현재 목록 {currentCounts.total}개가 백업의 {counts.total}개로 대체됩니다. 현재
                목록에만 있는 항목은 사라집니다. 교체 전 백업을 보관해 주세요.
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
                    추가 {prepared.added}개 · 중복 id 유지 {prepared.duplicates}개
                  </p>
                  <p>내용이 다른 중복 {prepared.conflicts}개도 현재 항목을 유지합니다.</p>
                  <p className="field-hint">
                    제목이 같아도 id가 다르면 별도 항목으로 추가합니다. 복원 후 전체{' '}
                    {prepared.data.tasks.length}개.
                  </p>
                </div>
              ) : (
                <p className="replace-warning">
                  현재 {currentCounts.total}개 → 교체 후 {counts.total}개. 다음 단계에서 확인해야
                  적용됩니다.
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
            <p className="field-error">저장 보호를 먼저 해결해야 복원할 수 있습니다.</p>
          )}
        </section>
      )}
    </PanelDialog>
  )
}
