import { readFile, writeFile } from 'node:fs/promises'
const [input, output] = process.argv.slice(2)
if (!input || !output) throw new Error('Usage: collect-v1.4-evidence.mjs playwright.json compact.json')
const report = JSON.parse(await readFile(input, 'utf8'))
const executions = [], cases = []
function visit(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests) {
      const result = test.results.at(-1)
      const execution = { file: spec.file, title: spec.title, status: result?.status, startTime: result?.startTime, duration: result?.duration, errors: result?.errors || [], attachments: result?.attachments?.filter(a => a.name !== 'v1.4-case').map(a => ({ name: a.name, path: a.path })) }
      executions.push(execution)
      for (const a of result?.attachments || []) if (a.name === 'v1.4-case') cases.push(JSON.parse(Buffer.from(a.body, 'base64').toString('utf8')))
    }
  }
  for (const nested of suite.suites || []) visit(nested)
}
for (const suite of report.suites) visit(suite)
await writeFile(output, JSON.stringify({ source: input, stats: report.stats, executions, cases, note: 'AI-generated viewpoints; actual isolated Chromium execution. Duration is automation time, not human task time. Failed first-run stages without custom attachments are retained in raw report and first-failures/.' }, null, 2) + '\n')
console.log(`${executions.length} executions, ${cases.length} case observations -> ${output}`)
