import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Verify the public build and asset paths. UI behavior is covered by the E2E
// suite and a separate public-browser check; HTTP success is not a UI test.
const url = new URL(process.argv[2] || 'https://gsj118.github.io/focusday/')
assert(url.protocol === 'https:' || ['127.0.0.1', 'localhost'].includes(url.hostname))
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const output = process.env.SMOKE_OUTPUT_DIR || 'test-results/deployment'
const report = {
  appVersion: pkg.version,
  url: url.href,
  checkedAt: new Date().toISOString(),
  sourceCommit: process.env.LIVE_HEAD_SHA || null,
  scope:
    'HTTP, content types, version marker, optional exact dist asset hashes; no browser UI claims',
  assets: [],
  status: 'RUNNING',
}
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
try {
  const response = await fetch(url, { cache: 'no-store' })
  assert.equal(response.status, 200, 'HTML status')
  assert.match(response.headers.get('content-type') || '', /text\/html/)
  const html = await response.text()
  assert.match(html, /Focusday/)
  report.assets.push({ url: url.href, status: response.status, sha256: sha(html) })
  const paths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg))"/g)].map(
    (match) => match[1],
  )
  assert(
    paths.some((path) => path.endsWith('.js')),
    'JavaScript bundle required',
  )
  assert(
    paths.some((path) => path.endsWith('.css')),
    'Stylesheet required',
  )
  let versionFound = false
  for (const path of paths) {
    const assetURL = new URL(path, url)
    assert.equal(assetURL.origin, url.origin, 'Same-origin built assets')
    const asset = await fetch(assetURL, { cache: 'no-store' })
    assert.equal(asset.status, 200, assetURL.href)
    const type = asset.headers.get('content-type') || ''
    assert(!type.includes('text/html'), 'Asset must not be the HTML fallback')
    const bytes = Buffer.from(await asset.arrayBuffer())
    if (path.endsWith('.js')) {
      assert.match(type, /javascript/)
      versionFound ||= bytes.toString('utf8').includes(pkg.version)
    }
    if (path.endsWith('.css')) assert.match(type, /text\/css/)
    if (path.endsWith('.svg')) assert.match(type, /image\/svg/)
    const entry = {
      url: assetURL.href,
      status: asset.status,
      contentType: type,
      bytes: bytes.length,
      sha256: sha(bytes),
    }
    if (process.env.EXPECTED_DIST) {
      const relative = decodeURIComponent(assetURL.pathname).slice(url.pathname.length)
      assert(
        relative && !relative.includes('..') && !relative.startsWith('/'),
        'Asset stays under site path',
      )
      const local = await readFile(join(process.env.EXPECTED_DIST, relative))
      assert.equal(sha(bytes), sha(local), 'Public asset matches verified dist: ' + relative)
      entry.matchesLocalBuild = true
    }
    report.assets.push(entry)
  }
  assert(versionFound, 'Expected version marker in built JavaScript')
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAIL'
  report.error = String(error)
  process.exitCode = 1
} finally {
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'assets.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
