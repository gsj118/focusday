import { useRef, useState } from 'react'
import {
  currentAutomation,
  defaultAutomation,
  loadAutomation,
  saveAutomation,
  type AutoState,
} from './automation'
import type { StoragePort } from './storage'

export function useAutomation(getStorage: () => StoragePort, today: string) {
  const [initial] = useState(() => loadAutomation(getStorage, today))
  const [stored, setStored] = useState(initial.data)
  const current = useRef(stored)
  const [blocked, setBlocked] = useState(initial.blocked)
  const [error, setError] = useState(initial.error)
  const state = currentAutomation(stored, today)
  function update(
    patch: Partial<Pick<AutoState, 'enabled' | 'limit' | 'currentTaskId' | 'skippedTaskIds'>>,
  ) {
    const next = { ...currentAutomation(current.current, today), ...patch }
    current.current = next
    setStored(next)
    if (!blocked) setError(saveAutomation(next, getStorage))
  }
  function retry() {
    if (!blocked) {
      setError(saveAutomation(currentAutomation(current.current, today), getStorage))
      return
    }
    const loaded = loadAutomation(getStorage, today)
    current.current = loaded.data
    setStored(loaded.data)
    setBlocked(loaded.blocked)
    setError(loaded.error)
  }
  function reset() {
    const next = defaultAutomation(today)
    const failure = saveAutomation(next, getStorage)
    if (!failure) {
      current.current = next
      setStored(next)
      setBlocked(false)
    }
    setError(failure)
  }
  return { state, blocked, error, update, retry, reset }
}
