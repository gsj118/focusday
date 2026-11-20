import { useEffect, useRef, useState } from 'react'
import {
  currentAutomation,
  defaultAutomation,
  loadAutomation,
  saveAutomation,
  initializePlan,
  type AutoState,
} from './automation'
import type { StoragePort } from './storage'
import type { Task } from './domain'

export function useAutomation(getStorage: () => StoragePort, today: string, tasks: Task[]) {
  const [initial] = useState(() => loadAutomation(getStorage, today))
  const [stored, setStored] = useState(initial.data)
  const current = useRef(stored)
  const [blocked, setBlocked] = useState(initial.blocked)
  const [error, setError] = useState(initial.error)
  const state = initializePlan(tasks, today, currentAutomation(stored, today))
  useEffect(() => {
    const next = initializePlan(tasks, today, current.current)
    if (JSON.stringify(next) === JSON.stringify(current.current)) return
    current.current = next
    setStored(next)
    if (!blocked && next.planTaskIds !== null) setError(saveAutomation(next, getStorage))
  }, [tasks, today, blocked, getStorage])
  function update(patch: Partial<Omit<AutoState, 'version' | 'day'>>, availableTasks = tasks) {
    const next = initializePlan(availableTasks, today, { ...state, ...patch })
    current.current = next
    setStored(next)
    if (!blocked) setError(saveAutomation(next, getStorage))
  }
  function restore(previous: AutoState) {
    // Undo from yesterday must not overwrite today's plan.
    if (previous.day !== today) return
    current.current = previous
    setStored(previous)
    if (!blocked) setError(saveAutomation(previous, getStorage))
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
  return { state, blocked, error, update, restore, retry, reset }
}
