import { spawnSync } from 'node:child_process'

for (const zone of ['Asia/Seoul', 'America/New_York']) {
  process.stdout.write(`\nCalendar tests in ${zone}\n`)
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/vitest/vitest.mjs',
      'run',
      'tests/unit/domain.test.ts',
      'tests/unit/planning.test.ts',
    ],
    {
      env: { ...process.env, TZ: zone },
      stdio: 'inherit',
    },
  )
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
