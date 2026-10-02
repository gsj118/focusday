import type { LoadResult } from '../storage'

export function PanelStorageNotice({
  guard,
  saveError,
  onRetry,
}: {
  guard: LoadResult['state']
  saveError: boolean
  onRetry?: () => void
}) {
  if (guard === 'ready' && !saveError) return null
  return (
    <div className="storage-banner" role="alert">
      <p>
        {guard !== 'ready'
          ? '저장 보호 중입니다. 현재 탭의 변경은 저장되지 않습니다. 패널을 닫고 기존 원본 복구 절차를 먼저 진행해 주세요.'
          : '아직 브라우저에 저장되지 않은 변경이 있습니다. 현재 탭의 변경을 백업할 수 있습니다.'}
      </p>
      {guard === 'ready' && onRetry && (
        <button className="secondary-button" onClick={onRetry}>
          저장 재시도
        </button>
      )}
    </div>
  )
}
