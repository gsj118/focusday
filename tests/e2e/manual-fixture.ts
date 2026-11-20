import { test as base, type BrowserContext, type Page } from '@playwright/test'
import { demoTasks } from '../../src/domain'
import { AUTO_STORAGE_KEY, defaultAutomation } from '../../src/automation'
import { STORAGE_KEY } from '../../src/storage'

export { expect, type Page, type TestInfo, type Locator } from '@playwright/test'

// Older regression cases exercise the supported manual mode. v1.5.spec.ts tests
// the actual fresh-install default (automation on), with no fixture override.
export async function useManualMode(target: BrowserContext | Page) {
  await target.addInitScript(
    ({ key, state }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(state))
    },
    { key: AUTO_STORAGE_KEY, state: { ...defaultAutomation('2026-01-01'), enabled: false } },
  )
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await useManualMode(context)
    await use(context)
  },
})

// Old releases stored examples alongside personal items. Retain coverage for
// reading/removing those records without using the now-isolated demo entry point.
export async function legacyExamples(page: Page) {
  const day = await page.evaluate(() => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })
  await page.evaluate(
    ({ key, tasks }) => {
      const data = JSON.parse(localStorage.getItem(key) || '{"version":1,"tasks":[]}')
      if (!data.tasks.some((t: { isDemo: boolean }) => t.isDemo)) data.tasks.push(...tasks)
      localStorage.setItem(key, JSON.stringify(data))
    },
    { key: STORAGE_KEY, tasks: demoTasks(day) },
  )
  await page.reload()
}
