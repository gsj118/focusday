import { useEffect } from 'react'

// Keep the editor above a mobile keyboard when the visual viewport shrinks.
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => {
      const height = viewport?.height ?? window.innerHeight
      const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))
      document.documentElement.style.setProperty('--visual-height', `${height}px`)
      document.documentElement.style.setProperty('--visual-bottom', `${bottom}px`)
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
}
