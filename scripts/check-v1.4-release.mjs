import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const git = (...args) =>
  execFileSync('git', ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, ...args])
const report = {
  checkedAt: new Date().toISOString(),
  sourceCommitAtAudit: git('rev-parse', 'HEAD').toString().trim(),
  status: 'PASS',
  preserved: [],
  commands: {},
  linksChecked: 0,
  promptSHA256: null,
}
for (const path of ['src/domain.ts', 'src/storage.ts', 'src/backup.ts', 'pnpm-lock.yaml']) {
  assert.equal(git('diff', '80748d6', '--', path).length, 0, `Preservation failed: ${path}`)
  report.preserved.push(path)
}
for (const name of ['root-final', 'pages-final']) {
  const data = JSON.parse(await readFile(`docs/evidence/v1.4/${name}.json`, 'utf8'))
  assert.equal(data.stats.expected, 103)
  for (const key of ['unexpected', 'skipped', 'flaky']) assert.equal(data.stats[key], 0)
  report.commands[name] = data.stats
}
const original = await readFile('docs/ai-prompts/10-v1.4-final-implementation.md')
report.promptSHA256 = createHash('sha256').update(original).digest('hex')
assert.equal(
  report.promptSHA256,
  '31bccbec238320b7a588a0724398a297de50570dacf288ace1689a72574b0425',
)
assert.equal(
  createHash('sha256')
    .update(git('show', 'HEAD:docs/ai-prompts/10-v1.4-final-implementation.md'))
    .digest('hex'),
  report.promptSHA256,
)
for (const path of [
  'README.md',
  'docs/V1_4_FINAL_UPDATE.md',
  'docs/SYNTHETIC_BETA_V1_4.md',
  'docs/SYNTHETIC_BETA_CASES_V1_4.md',
  'docs/validation.md',
  'docs/demo-script.md',
  'docs/content-v1.4.md',
]) {
  const text = await readFile(path, 'utf8')
  const links = [...text.matchAll(/\]\(([^)]+)\)|src="([^"]+)"/g)].map((m) => m[1] || m[2])
  for (const link of links) {
    if (/^(?:https?:|#)/.test(link)) continue
    await stat(resolve(dirname(path), link.split('#')[0]))
    report.linksChecked++
  }
}
await writeFile('docs/evidence/v1.4/release-audit.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
