import ts from 'typescript'
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : /\.(ts|tsx)$/.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  )
}
const rows = []
for (const file of files('src')) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  function walk(node) {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isJsxText(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      const text = node.text.replace(/\s+/gu, ' ').trim()
      if (/[가-힣]/u.test(text))
        rows.push({
          file: file.replaceAll('\\', '/'),
          line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          text,
        })
    }
    ts.forEachChild(node, walk)
  }
  walk(source)
}
const html = readFileSync('index.html', 'utf8')
for (const match of html.matchAll(/<title>([^<]+)<\/title>|content="([^"]*[가-힣][^"]*)"/gu)) {
  rows.push({
    file: 'index.html',
    line: html.slice(0, match.index).split('\n').length,
    text: match[1] || match[2],
  })
}
mkdirSync('docs/evidence/v1.5', { recursive: true })
writeFileSync(
  'docs/evidence/v1.5/korean-copy.json',
  JSON.stringify(
    {
      generatedBy: 'scripts/audit-korean-copy.mjs',
      scope:
        'Korean string literals, templates and JSX text in src, plus index.html title/metadata; user-entered text is excluded',
      strings: rows,
    },
    null,
    2,
  ) + '\n',
)
process.stdout.write(rows.map((r) => `${r.file}:${r.line} ${r.text}`).join('\n') + '\n')
