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
          ? '저장된 원본을 보호하고 있어요. 이 탭에서 바꾼 내용은 아직 저장되지 않았어요. 창을 닫고 원본을 다시 읽거나 복구해 주세요.'
          : '아직 저장되지 않은 변경이 있어요. 이 탭의 내용을 백업 파일로 보관할 수 있어요.'}
      </p>
      {guard === 'ready' && onRetry && (
        <button className="secondary-button" onClick={onRetry}>
          저장 재시도
        </button>
      )}
    </div>
  )
}
