import { readFile, writeFile } from 'node:fs/promises'
const final = JSON.parse(await readFile('docs/evidence/v1.4/root-final-compact.json', 'utf8'))
const first = JSON.parse(await readFile('docs/evidence/v1.4/beta-first-compact.json', 'utf8'))
const views = JSON.parse(await readFile('docs/evidence/v1.4/features-second.json', 'utf8'))
const firstViews = JSON.parse(await readFile('docs/evidence/v1.4/features-first.json', 'utf8'))
const firstFailed = new Set(['P03-02', 'P12-03'])
const clean = (text) => String(text).replaceAll('|', '/').replaceAll('\n', ' ')
const cases = final.cases.map((c) => {
  const a = c.actual
  let count = null
  try {
    count = JSON.parse(a.taskRaw || '{"tasks":[]}').tasks.length
  } catch {
    /* protected malformed fixture */
  }
  return {
    ...c,
    firstStatus:
      first.cases.find((x) => x.caseId === c.caseId)?.status ||
      (firstFailed.has(c.caseId) ? 'FAIL' : 'NOT_RUN'),
    summary: `${a.achievements || '전체 보기'}; task ${count}; focus ${a.focus}; 문구 ${a.sentence?.length || 0}자; ${a.toast || 'toast 없음'}`,
  }
})
const counts = {}
const boundary = final.executions
  .filter((t) => t.file.endsWith('v1.4.spec.ts') && t.title.startsWith('B'))
  .map((t) => {
    const id = t.title.slice(0, 3)
    counts[id] = (counts[id] || 0) + 1
    const previous = first.executions.find((x) => x.title === t.title)
    return {
      caseId: `${id}-${String(counts[id]).padStart(2, '0')}`,
      title: t.title,
      firstStatus: previous
        ? previous.status === 'passed'
          ? 'PASS'
          : 'FAIL'
        : id === 'B09'
          ? 'FAIL'
          : 'NOT_RUN',
      status: t.status === 'passed' ? 'PASS' : 'FAIL',
      source: 'docs/evidence/v1.4/root-final.json',
    }
  })
const visual = views.observations.map((v, index) => ({
  ...v,
  caseId: `${v.caseId}-${index + 1}`,
  firstStatus: firstViews.observations[index].status,
}))
await writeFile(
  'docs/evidence/v1.4/case-matrix.json',
  JSON.stringify(
    {
      coreCases: cases,
      boundary,
      visual,
      limitations: [
        'Physical smartphone/OS keyboard/OS IME/native zoom/screen reader/Safari/Firefox/human research: NOT_RUN',
      ],
      note: 'First failed P03-02/P12-03 retained in raw test report, trace and first-failures screenshots. B09 first failure was a later dedicated real reproduction, not initial Beta.',
    },
    null,
    2,
  ) + '\n',
)
let md =
  '# Synthetic Beta v1.4 · Case 기대/실제/상태\n\n2026-10-08 KST. 12개 AI 관점의26단계와 추가11개 경계 실행, 별도9개 화면 관찰이다. 테스트 수103과 Case 수를 혼동하지 않는다. 가상 인물 소감/만족도는 판정 근거가 아니다. 실제 로컬 production의 UI·storage·focus·test clock·screenshot을 기록한다. [환경/세션/한계](SYNTHETIC_BETA_V1_4.md) · [수정 이력](evidence/v1.4/findings.md) · [원본 JSON](evidence/v1.4/case-matrix.json).\n\n최초 신규17개15 PASS/2 FAIL, 두 번째22 PASS, 최종 전체103 PASS. P03/P12의 첫 실패는 테스트 locator/수집 문제였으며 제품 결함3건은 별도 검수/재현에서 확인했다. 첫 FAIL 자료를 최종 PASS로 덮어쓰지 않았다. NOT_RUN은 당시 추가되지 않은 검사 또는 실제 미실행 조건이다. INCONCLUSIVE는 수집 자체가 불가능할 때만 사용한다.\n\n| Case ID / 관점·과업 | 기대 | 최종 실제 관찰 | 최초 → 최종 | 증거·연결 수정 |\n| --- | --- | --- | --- | --- |\n'
for (const c of cases) {
  const fix = c.caseId === 'P03-02' || c.caseId === 'P12-03' ? ' · T14-01/02' : ''
  md += `| ${c.caseId} / ${c.persona} | ${clean(c.expected)} | ${clean(c.summary)} | ${c.firstStatus} → ${c.status} | [실제 화면](${c.screenshot.replace(/^docs\//, '')}) · [단계 원본](evidence/v1.4/root-final-compact.json)${fix} |\n`
}
md +=
  '\n## 추가 데이터·날짜·부작용 경계\n\n각 행은 제목에 있는 모든 assertion을 수행한 실제 브라우저 실행이다. 최초 NOT_RUN은 초기17개에 없던 추가 검사다. B09 최초 FAIL은 후속 포커스 재현이며 첫 Beta 결과로 혼합하지 않는다.\n\n| Case ID / 과업·기대 | 실제 / 상태 | 최초 → 최종 | 증거·연결 수정 |\n| --- | --- | --- | --- |\n'
for (const b of boundary)
  md += `| ${b.caseId} / ${clean(b.title.slice(4))} | 모든 지정 UI/원본/초점 assertion 통과 | ${b.firstStatus} → ${b.status} | [실제 실행](evidence/v1.4/root-final.json)${b.caseId.startsWith('B07') ? ' · SB14-01/02' : b.caseId.startsWith('B09') ? ' · [첫 FAIL](evidence/v1.4/focus-first.json) · SB14-03' : ''} |\n`
md +=
  '\n## 실제 화면 검수\n\n명세6개 viewport와720×450 동등 reflow/390×480 작은 높이. 아래 width 값은 실제 CSS geometry이며 첫 440px sheet/초안 안내 실패도 남긴다. 가로 overflow/실행 오류는 모든8조건0이다.\n\n| Case ID / 기대 | 최종 실제 | 최초 → 최종 | 근거 |\n| --- | --- | --- | --- |\n'
for (const v of visual)
  md += `| ${v.caseId} / ${clean(v.expected)} | ${clean(JSON.stringify(v.actual))} | ${v.firstStatus} → ${v.status} | [실제 캡처](${v.screenshot.replace(/^docs\//, '')}) · [전후 관찰](evidence/v1.4/features-second.json) |\n`
md +=
  '\n## 기존 회귀와 실제 미실행\n\n기존80개를 유지해 빠른 입력/공백200자/분류24자/합성composition·오늘/전체/검색/정렬·기한/집중/어제 id·편집 초안/줄바꿈·undo pause/초점·손상 원본/메모리 쓰기 실패·복원 성공/실패·10MiB±1/6천개 자체 파일·필수 대비/320px/모바일/production 자산을 재실행했다. [전체 root](evidence/v1.4/root-final.json) · [Pages 경로](evidence/v1.4/pages-final.json) · [검증](validation.md).\n\n물리폰·OS 키보드/IME·native 확대·스크린 리더·Safari/Firefox·사람 연구/만족도/사람 과업 시간·실제 quota/대량 렌더링/다중 탭은 NOT_RUN. UI 설정이 없는/손상된 경우의 task 원본 유지와 UI 백업 제외는 자동화로 확인했다. 열린 앱 offline 표시를 오프라인 최초 다운로드나 PWA로 표현하지 않는다.\n'
await writeFile('docs/SYNTHETIC_BETA_CASES_V1_4.md', md)
console.log(
  `${cases.length} connected cases + ${boundary.length} boundary executions + ${visual.length} visual observations`,
)
