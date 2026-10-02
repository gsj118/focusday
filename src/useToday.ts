import { useEffect, useState } from 'react'
import { localDate, nextMidnightDelay } from './domain'

export function useToday() {
  const [today, setToday] = useState(() => localDate())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const now = new Date()
      setToday(localDate(now))
      timer = setTimeout(refresh, nextMidnightDelay(now))
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}
