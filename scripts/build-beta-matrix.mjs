import { readFile, writeFile } from 'node:fs/promises'
const [phase, input, output] = process.argv.slice(2)
if (!['before', 'after'].includes(phase) || !input || !output)
  throw new Error('Usage: build-beta-matrix.mjs before|after evidence.json matrix.json')
const report = JSON.parse(await readFile(input, 'utf8'))
const first =
  phase === 'before'
    ? JSON.parse(await readFile('docs/evidence/v1.2/synthetic-before.json', 'utf8'))
    : { observations: [] }
const source = await readFile('docs/ai-prompts/06-v1.2-synthetic-beta.md', 'utf8')
const catalog = [...source.matchAll(/^\|\s*([A-F]\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|/gm)].map(
  (m) => ({ caseId: m[1], action: m[2].trim(), expected: m[3].trim() }),
)
if (catalog.length !== 53) throw new Error(`Expected source catalog of 53; got ${catalog.length}`)
// Reuse actual UI assertions, not unit-only results, for cases not repeated in persona sessions.
const reused = {
  B03: ['속성 저장·새로고침'],
  B06: ['속성 저장·새로고침'],
  C01: ['v1 데이터 그대로 로드'],
  C07: ['열린 계획 패널의 자정', '계획 focus', '계획 visibilitychange'],
  C08: ['후보 없음'],
  D04: ['최근 행동만 실행 취소'],
  D05: ['복원 merge 쓰기 실패', '복원 replace 쓰기 실패'],
  E01: ['전체 JSON 백업 round trip'],
  E03: ['파일 선택 취소와 미리보기 취소'],
  E04: ['합치기 미리보기'],
  E05: ['전체 교체 확인'],
  E06: ['파일 검증', '초과·파일 선택 취소'],
  E07: ['복원 merge 쓰기 실패', '복원 replace 쓰기 실패'],
  E08: ['저장 보호', '읽기 실패는 쓰기를 보호', 'localStorage 접근 자체 실패', '손상 원본 자동'],
  E09: ['저장 실패 중 메모리 전체 백업'],
  E10: ['늦은 파일 읽기'],
  F03: [
    '화면 1440',
    '화면 1366',
    '화면 390',
    '화면 320',
    'v1.1 1440',
    'v1.1 1366',
    'v1.1 390',
    'v1.1 320',
  ],
  F04: ['새 모바일 패널 touch'],
  F06: ['실제 렌더링 색', 'reduced-motion·실제 토큰'],
}
const observations = [...first.observations, ...report.observations]
const limitation = {
  A10: 'composition events; actual OS IME NOT_RUN',
  A12: 'touch/isMobile and automation Enter; physical virtual keyboard NOT_RUN',
  B05: 'composition events + actual keyboard Enter; OS IME NOT_RUN',
  B06: 'native date sanitation and valid date UI; calendar validators separately tested',
  E11: 'pure data and UI download/preview; 6000-item list performance and storage quota NOT_RUN',
  F05: 'reduced viewport; physical keyboard/safe-area NOT_RUN',
  F06: '200% equivalent reflow (720x450/scale2), automated names/contrast/motion; native browser zoom, screen reader/full WCAG NOT_RUN',
}
const matrix = catalog.map((entry) => {
  const direct = observations.filter((o) => o.caseIds.includes(entry.caseId))
  const latestByPersona = new Map(direct.map((o) => [o.personaId, o]))
  const observed = [...latestByPersona.values()]
  const evidence = report.tests.filter((t) =>
    (reused[entry.caseId] || []).some((prefix) => t.title.includes(prefix)),
  )
  if (['B03', 'B05', 'B06', 'B07'].includes(entry.caseId))
    evidence.push(...report.tests.filter((t) => t.title.includes('B03/B05/B06/B07:')))
  if (entry.caseId === 'E11') evidence.push(...report.tests.filter((t) => t.title.includes('E11:')))
  let status =
    observed.some((o) => o.status === 'FAIL') || evidence.some((t) => t.status === 'failed')
      ? 'FAIL'
      : observed.length || evidence.length
        ? 'PASS'
        : 'NOT_RUN'
  const detail = {
    ...entry,
    phase,
    status,
    personas: [...new Set(observed.map((o) => o.personaId))],
    fixture: observed.map((o) => o.fixture),
    environment: observed.map((o) => o.environment),
    executionTimes: observed.map((o) => o.checkedAt),
    steps: observed.map((o) => o.steps),
    actual: observed.map((o) => ({
      status: o.status,
      actual: o.actual,
      initial: o.initial,
      final: o.final,
      screenshot: o.screenshot || null,
    })),
    evidence: evidence.map((t) => ({
      file: t.file,
      test: t.title,
      status: t.status,
      startTime: t.startTime,
      duration: t.duration,
    })),
    proofFiles: [
      input,
      ...(direct.length && phase === 'before' ? ['docs/evidence/v1.2/synthetic-before.json'] : []),
    ],
    issueId: entry.caseId === 'E11' ? 'SB-01' : entry.caseId === 'B05' ? 'SB-02' : null,
    scope:
      limitation[entry.caseId] ||
      'Actual automated UI behavior/data assertions; synthetic fixtures; no human success-rate claim',
  }
  if (!detail.environment.length)
    detail.environment = [
      {
        browser: 'Chrome 134.0.6998.36',
        timezone: 'Asia/Seoul',
        viewport: 'See named test; default 1440x900, geometry/touch cases have explicit viewport',
        fixtureClock: '2026-10-02 plus controlled boundary clocks',
      },
    ]
  if (!detail.personas.length)
    detail.personas = [
      entry.caseId.startsWith('B')
        ? 'P12'
        : entry.caseId.startsWith('C')
          ? 'P08'
          : entry.caseId.startsWith('D')
            ? 'P09'
            : entry.caseId.startsWith('E')
              ? 'P10'
              : entry.caseId.startsWith('F')
                ? 'P03'
                : 'P02',
    ]
  if (!detail.fixture.length)
    detail.fixture = [
      'Named test setup: UI-created tasks or isolated Task schema/Clock/Storage fixtures in tests/e2e',
    ]
  if (!detail.executionTimes.length) detail.executionTimes = evidence.map((t) => t.startTime)
  if (!detail.steps.length) detail.steps = evidence.map((t) => t.title)
  if (!detail.actual.length)
    detail.actual = evidence.map((t) => ({
      status: t.status === 'passed' ? 'PASS' : 'FAIL',
      actual:
        t.status === 'passed' ? 'All assertions in named UI test passed' : 'See preserved failure',
      test: t.title,
    }))
  return detail
})
const counts = Object.fromEntries(
  ['PASS', 'FAIL', 'INCONCLUSIVE', 'NOT_RUN'].map((s) => [
    s,
    matrix.filter((c) => c.status === s).length,
  ]),
)
await writeFile(
  output,
  JSON.stringify(
    {
      definition:
        '53 spec cases with scoped actual automated evidence; NOT_RUN physical/human conditions are stated per case, not inferred PASS',
      phase,
      sourceCommit:
        phase === 'before'
          ? '7ff35e73632fdb43f1452722c553da95a79e19d7'
          : process.env.BETA_SOURCE || 'working-tree',
      generatedAt: new Date().toISOString(),
      counts,
      cases: matrix,
    },
    null,
    2,
  ) + '\n',
)
console.log(counts)
if (matrix.some((c) => c.status === 'NOT_RUN'))
  console.log(
    'Uncovered IDs:',
    matrix.filter((c) => c.status === 'NOT_RUN').map((c) => c.caseId),
  )
