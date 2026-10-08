import { describe, expect, it } from 'vitest'
import { createTask, localDate, addDays } from '../../src/domain'
import {
  completionMilestone,
  dailySentence,
  ORIGINAL_GUIDANCE,
  selectAchievements,
  sentences,
  validateSentence,
} from '../../src/encouragement'
import {
  defaultPreferences,
  isPreferences,
  loadPreferences,
  mergeProcessed,
  savePreferences,
  UI_STORAGE_KEY,
} from '../../src/preferences'

describe('daily original content', () => {
  it('stable ids, distinct reviewed content and at least twelve in each mode', () => {
    expect(new Set(sentences.map((s) => s.id)).size).toBe(sentences.length)
    expect(new Set(sentences.map((s) => s.text)).size).toBe(sentences.length)
    for (const kind of ['calm', 'humor'] as const)
      expect(sentences.filter((s) => s.kind === kind).length).toBeGreaterThanOrEqual(12)
  })
  it('same day/mode is stable; adjacent local calendar days differ across DST and year', () => {
    for (const day of ['2026-10-08', '2026-12-31', '2026-03-08', '2026-11-01', '1999-12-31']) {
      for (const mode of ['calm', 'humor'] as const) {
        expect(dailySentence(day, mode)).toBe(dailySentence(day, mode))
        expect(dailySentence(day, mode)).not.toBe(dailySentence(addDays(day, 1), mode))
      }
    }
    expect(dailySentence('2026-10-08', 'off')).toBe(ORIGINAL_GUIDANCE)
    expect(dailySentence('2026-10-08', 'custom', '<b>직접 입력</b>')).toBe('<b>직접 입력</b>')
  })
  it('trimmed plain text boundaries count Unicode characters', () => {
    expect(validateSentence('  ')).toContain('1–120')
    expect(validateSentence(' 가'.trim().repeat(120))).toBe('')
    expect(validateSentence('가'.repeat(121))).toContain('121자')
    expect(validateSentence('🙂'.repeat(120))).toBe('')
  })
})
describe('achievements and milestones', () => {
  it('current non-demo data, completed local date, no due/focus dependency and latest/id sort', () => {
    const stamp = '2026-10-08T02:00:00.000Z'
    const day = localDate(new Date(stamp))
    const make = (id: string, completedAt: string | null, isDemo = false) => ({
      ...createTask(id, 'all', day, stamp, id),
      completedAt,
      isDemo,
    })
    const tasks = [
      make('b', stamp),
      make('a', stamp),
      make('demo', stamp, true),
      make('open', null),
      make('old', '2026-10-06T00:00:00.000Z'),
    ]
    expect(selectAchievements(tasks, day).map((t) => t.id)).toEqual(['a', 'b'])
    expect(
      selectAchievements(
        tasks.filter((t) => t.id !== 'a'),
        day,
      ).length,
    ).toBe(1)
    tasks[0].completedAt = null
    expect(selectAchievements(tasks, day).map((t) => t.id)).toEqual(['a'])
  })
  it('UTC date slice is not used at Seoul/New York local midnight', () => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const stamp = zone === 'Asia/Seoul' ? '2026-10-07T15:10:00.000Z' : zone === 'America/New_York' ? '2026-10-09T03:10:00.000Z' : '2026-10-08T12:00:00.000Z'
    const task = {
      ...createTask('boundary', 'all', '2026-10-08', stamp, 'boundary'),
      completedAt: stamp,
    }
    expect(localDate(new Date(stamp))).toBe('2026-10-08')
    expect(selectAchievements([task], '2026-10-08')).toHaveLength(1)
    if (zone === 'Asia/Seoul' || zone === 'America/New_York') expect(stamp.slice(0, 10)).not.toBe('2026-10-08')
  })
  it('only direct 0→1 and 2→3 transitions are candidates', () => {
    expect([0, 1, 2, 3].map((before) => completionMilestone(before, before + 1))).toEqual([
      1,
      null,
      3,
      null,
    ])
    expect(completionMilestone(0, 3)).toBeNull()
    expect(completionMilestone(3, 2)).toBeNull()
  })
})
describe('isolated settings storage', () => {
  it('missing preferences read without writing either key', () => {
    const writes: string[] = []
    const data = loadPreferences(() => ({
      getItem: () => null,
      setItem: (key) => {
        writes.push(key)
      },
    }))
    expect(data).toMatchObject({ state: 'ready', data: defaultPreferences() })
    expect(writes).toEqual([])
  })
  it.each([
    '{broken',
    '{"version":2}',
    '{"version":1}',
    JSON.stringify({ ...defaultPreferences(), processed: { '2026-02-30': [1] } }),
    JSON.stringify({ ...defaultPreferences(), processed: { '2026-10-08': [1, 1] } }),
  ])('damaged or unsupported preference remains untouched: %s', (raw) => {
    let writes = 0
    expect(
      loadPreferences(() => ({
        getItem: () => raw,
        setItem: () => {
          writes++
        },
      })).state,
    ).toBe('blocked')
    expect(writes).toBe(0)
  })
  it('read/write errors stay within the settings boundary', () => {
    expect(
      loadPreferences(() => {
        throw new Error('denied')
      }).state,
    ).toBe('unavailable')
    expect(
      savePreferences(defaultPreferences(), () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('quota')
        },
      })).ok,
    ).toBe(false)
    let key = ''
    expect(
      savePreferences(defaultPreferences(), () => ({
        getItem: () => null,
        setItem: (k) => {
          key = k
        },
      })).ok,
    ).toBe(true)
    expect(key).toBe(UI_STORAGE_KEY)
  })
  it('settings validation and processed union preserve independent dates/marks', () => {
    expect(isPreferences({ ...defaultPreferences(), sentenceMode: 'custom' })).toBe(false)
    expect(isPreferences({ ...defaultPreferences(), customSentence: ' bad ' })).toBe(false)
    expect(
      mergeProcessed({ '2026-10-08': [1] }, { '2026-10-08': [1, 3], '2026-10-09': [1] }),
    ).toEqual({ '2026-10-08': [1, 3], '2026-10-09': [1] })
  })
})
