import { describe, expect, it } from 'vitest'
import { createTask } from '../../src/domain'
import { loadData, saveData, STORAGE_KEY, type StoragePort } from '../../src/storage'

function memory(raw: string | null): StoragePort & { raw: string | null; writes: number } {
  return {
    raw,
    writes: 0,
    getItem() {
      return this.raw
    },
    setItem(key, value) {
      expect(key).toBe(STORAGE_KEY)
      this.writes++
      this.raw = value
    },
  }
}
describe('저장 경계', () => {
  it('빈 첫 로드가 저장을 수행하지 않는다', () => {
    const store = memory(null)
    expect(loadData(() => store).data.tasks).toEqual([])
    expect(store.writes).toBe(0)
  })
  it('정상 round trip', () => {
    const store = memory(null)
    const data = { version: 1 as const, tasks: [createTask('정상', 'today', '2026-10-02')] }
    expect(saveData(data, () => store).ok).toBe(true)
    expect(loadData(() => store).data).toEqual(data)
  })
  it.each([
    '{bad',
    '{"version":2,"tasks":[]}',
    '{"version":1,"tasks":[{}]}',
    'null',
    '{"version":1,"tasks":"bad"}',
  ])('손상·버전·스키마 오류 원본 보존: %s', (raw) => {
    const store = memory(raw)
    expect(loadData(() => store)).toMatchObject({ state: 'blocked', raw })
    expect(store.raw).toBe(raw)
    expect(store.writes).toBe(0)
  })
  it('잘못된 날짜·중복 id를 거부', () => {
    const task = createTask('제목', 'all', '2026-10-02')
    for (const tasks of [
      [{ ...task, dueDate: '2026-02-30' }],
      [{ ...task, createdAt: '2026-02-30T12:00:00.000Z' }],
      [{ ...task, updatedAt: '2026-10-02T24:00:00.000Z' }],
      [task, task],
    ]) {
      expect(loadData(() => memory(JSON.stringify({ version: 1, tasks }))).state).toBe('blocked')
    }
  })
  it('접근·읽기 실패 보호', () => {
    expect(
      loadData(() => {
        throw new Error('SecurityError')
      }).state,
    ).toBe('unavailable')
    expect(
      loadData(() => ({
        getItem() {
          throw new Error('ReadError')
        },
        setItem() {},
      })).state,
    ).toBe('unavailable')
  })
  it('쓰기 실패를 저장 성공으로 표시하지 않고 다음 성공을 반환', () => {
    const data = { version: 1 as const, tasks: [] }
    expect(
      saveData(data, () => ({
        getItem() {
          return null
        },
        setItem() {
          throw new Error('QuotaExceededError')
        },
      })).ok,
    ).toBe(false)
    expect(saveData(data, () => memory(null)).ok).toBe(true)
  })
})
