import { writeFile } from 'node:fs/promises'

const url = process.argv[2] || 'http://127.0.0.1:4180/focusday/'
const response = await fetch(url)
const html = await response.text()
const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => /\.(?:js|css|svg)$/.test(path))
const assets = []
for (const path of paths) {
  const assetUrl = new URL(path, url)
  const asset = await fetch(assetUrl)
  const type = asset.headers.get('content-type')
  if (!asset.ok || type?.includes('text/html') || !assetUrl.pathname.startsWith('/focusday/')) {
    throw new Error(`잘못된 Pages 자산: ${assetUrl} / ${asset.status} / ${type}`)
  }
  assets.push({ url: assetUrl.href, status: asset.status, contentType: type })
}
if (!response.ok || assets.length !== 3) throw new Error('HTML/JS/CSS/favicon 검증 실패')
const result = { checkedAt: new Date().toISOString(), url, htmlStatus: response.status, assets }
await writeFile('docs/evidence/v1.3/pages-assets.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
