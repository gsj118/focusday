import { addDays, createTask, localDate, type AppData } from './domain'
import { STORAGE_KEY, type StoragePort } from './storage'
import { UI_STORAGE_KEY, defaultPreferences } from './preferences'
import { AUTO_STORAGE_KEY, defaultAutomation } from './automation'

export type AppSession = { demo: boolean; getStorage: () => StoragePort }
export const browserStorage = () => window.localStorage
export function createSession(search: string, today = localDate()): AppSession {
  if (new URLSearchParams(search).get('demo') !== '1')
    return { demo: false, getStorage: browserStorage }
  const rows = [
    { title: '발표 자료 다듬기', dueDate: addDays(today, 3), focusDate: today, category: '학교' },
    { title: '도서 반납하기', dueDate: today, category: '생활' },
    { title: '지난 메모 정리하기', focusDate: addDays(today, -3), category: '개인' },
    { title: '주말 장보기 목록 적기', category: '생활' },
    { title: '친구에게 안부 보내기', category: '개인' },
  ]
  const data: AppData = {
    version: 1,
    tasks: rows.map((row, i) => ({
      ...createTask(row.title, 'all', today, new Date().toISOString(), `demo-${i}`),
      ...row,
      isDemo: true,
    })),
  }
  const values = new Map<string, string>([
    [STORAGE_KEY, JSON.stringify(data)],
    [UI_STORAGE_KEY, JSON.stringify(defaultPreferences())],
    [AUTO_STORAGE_KEY, JSON.stringify(defaultAutomation(today))],
  ])
  const memory: StoragePort = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
  return { demo: true, getStorage: () => memory }
}
