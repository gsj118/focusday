import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export function PanelDialog({
  title,
  kind,
  onClose,
  children,
}: {
  title: string
  kind: 'plan' | 'data'
  onClose: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    const element = dialog.current!
    element.showModal()
    close.current?.focus()
    return () => element.close()
  }, [])
  useLayoutEffect(() => {
    if (document.activeElement === document.body || document.activeElement === dialog.current)
      close.current?.focus()
  })
  return (
    <dialog
      ref={dialog}
      className={`editor-dialog panel-dialog ${kind}-dialog`}
      aria-labelledby={`${kind}-heading`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0)
        const first = controls[0],
          last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className="editor-content">
        <div className="sheet-handle" />
        <header className="editor-header">
          <div>
            <p className="eyebrow">FOCUSDAY</p>
            <h2 id={`${kind}-heading`}>{title}</h2>
          </div>
          <button
            ref={close}
            className="icon-button"
            aria-label={`${title} 닫기`}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </div>
    </dialog>
  )
}
