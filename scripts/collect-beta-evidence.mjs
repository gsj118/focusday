import { readFile, writeFile } from 'node:fs/promises'
const [input, output] = process.argv.slice(2)
if (!input || !output)
  throw new Error('Usage: node scripts/collect-beta-evidence.mjs input.json output.json')
const report = JSON.parse(await readFile(input, 'utf8'))
const tests = [],
  observations = [],
  dataEvidence = []
function visit(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests) {
      const result = test.results.at(-1)
      tests.push({
        file: spec.file,
        title: spec.title,
        ok: spec.ok,
        status: result?.status,
        startTime: result?.startTime,
        duration: result?.duration,
        error: result?.error?.message || null,
      })
      for (const attachment of result?.attachments || []) {
        if (attachment.name === 'backup-size')
          dataEvidence.push({
            ...JSON.parse(Buffer.from(attachment.body, 'base64').toString('utf8')),
            status: result.status === 'passed' ? 'PASS' : 'FAIL',
          })
        if (attachment.name !== 'synthetic-cases') continue
        const text = attachment.body
          ? Buffer.from(attachment.body, 'base64').toString('utf8')
          : awaitReadUnsupported(attachment)
        observations.push(...JSON.parse(text))
      }
    }
  }
  for (const nested of suite.suites || []) visit(nested)
}
function awaitReadUnsupported(attachment) {
  throw new Error(`Missing inline case attachment: ${attachment.path}`)
}
for (const suite of report.suites) visit(suite)
await writeFile(
  output,
  JSON.stringify(
    {
      stats: report.stats,
      tests,
      observations,
      dataEvidence,
      note: 'Synthetic before sessions may finish while recording failed assertions. Feature results use observations, not session completion count. Duration is automation time.',
    },
    null,
    2,
  ) + '\n',
)
console.log(
  `${tests.length} executions; ${observations.length} observation groups; ${observations.filter((o) => o.status === 'FAIL').length} FAIL -> ${output}`,
)
