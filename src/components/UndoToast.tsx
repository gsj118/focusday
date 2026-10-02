import { useEffect, useRef } from 'react'
import type { UndoAction } from '../domain'

type Props = { undo: UndoAction; onUndo: () => void; onExpire: (token: number) => void; onCompleted: () => void }
export function UndoToast({ undo, onUndo, onExpire, onCompleted }: Props) {
  const remaining = useRef(8000)
  const started = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hovered = useRef(false)
  const focused = useRef(false)
  const schedule = () => {
    if (timer.current !== null || hovered.current || focused.current) return
    started.current = Date.now()
    timer.current = setTimeout(() => { timer.current = null; onExpire(undo.token) }, Math.max(0, remaining.current))
  }
  const pause = () => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; remaining.current -= Date.now() - started.current }
  }
  useEffect(() => { schedule(); return pause }, []) // keyed by token; one lifetime per action
  return <div className="undo-toast" onMouseEnter={() => { hovered.current = true; pause() }} onMouseLeave={() => { hovered.current = false; schedule() }} onFocusCapture={() => { focused.current = true; pause() }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { focused.current = false; schedule() } }}>
    <span role="status">할 일을 {undo.kind === 'complete' ? '완료' : '삭제'}했습니다.</span>
    <div className="toast-actions"><button onClick={onUndo}>실행 취소</button>{undo.kind === 'complete' && <button onClick={onCompleted}>완료 목록</button>}</div>
  </div>
}
