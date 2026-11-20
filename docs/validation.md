# Focusday v1.5 검증 기록

2026-11-20 KST. 앱 소스 기준은 `77334d5c9f863c450aa9b750b81dc0440f1631a9`이다. 아래 v1.5 결과는 이번에 실제 실행했으며, 그 아래 v1.4 기록은 과거 자료로 보존한다.

| 검사                              | 실제 결과                                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| 타입·ESLint·production build      | 통과                                                                      |
| 단위 테스트                       | 79개 통과                                                                 |
| 날짜·자동화 테스트                | Asia/Seoul 55개, America/New_York 55개 통과                               |
| 로컬 루트 경로 브라우저           | 117개 통과                                                                |
| 실제 Pages 하위 경로 `/focusday/` | 117개 통과                                                                |
| 원격 GitHub CI                    | 단위 79·시간대 각 55·브라우저 117개 통과                                  |
| 원격 Pages build/deploy           | 단위 79·시간대 각 55·브라우저 117개 및 배포 성공                          |
| 공개 자산                         | HTML·JS·CSS·favicon HTTP 200. JS·CSS·favicon SHA-256이 검증한 dist와 일치 |
| 공개 화면                         | 인앱 브라우저 데스크톱 1366×768·모바일 390×844에서 실제 조작 확인         |

[기본 검사 로그](evidence/v1.5/check.txt) · [루트 브라우저 로그](evidence/v1.5/e2e-root.txt) · [Pages 경로 로그](evidence/v1.5/e2e-pages.txt) · [결과 요약](evidence/v1.5/validation.json) · [GitHub job/실제 PASS 로그](evidence/v1.5/github-actions.json) · [공개 자산](evidence/v1.5/public/assets.json) · [공개 UI 확인](evidence/v1.5/public/ui.json).

## 환경과 검사 범위

로컬 Windows/PowerShell, Node 24.19.0·실행 pnpm 11.25.0·프로젝트 지정 pnpm 11.19.0. 원격 Ubuntu, CI Node 24.22.3 / Pages Node 24.22.2, 고정 pnpm 11.19.0. 의존성과 lockfile은 유지했다. 로컬 E2E는 설치된 Chrome, 원격은 Playwright Chromium이다.

기존 103개 회귀는 지원하는 수동 모드를 명시적으로 설정한다. 새 14개 E2E는 **실제 새 방문 기본값인 자동 모드**에서 실행한다. 테스트용 product 분기는 없다. 입력 오류 전체 보류·원문 모드·중복·날짜 인식, 기한/직접 선택 보존, 시작 상태 유지, 건너뛰기/자정 복구, 손상/실패 설정, 체험의 세 저장 영역 분리·다운로드/복원, 빠른 날짜 초안과 반응형을 검증한다.

체험 첫 화면의 시작 버튼 위치를 1366×768와 390×844에서 실제 geometry로 확인했다. 320×568, 768×1024, 720×450도 새 자동 모드의 가로 넘침과 실행 동선을 검사했다. 기존 작은 패널·키보드 포커스·대비·긴 입력·백업·저장 오류 테스트를 유지했다.

공개 UI에서는 추천 시작→완료→다음 후보, 미리보기→등록→전체 보기→속성 확인, 일주일 뒤 날짜 저장, 모바일 시작/완료, 체험 초기화, 앱 1.5.0 표시를 확인했다. 공개 탭에서 캡처된 error/warn 로그는 없었다. 개인 데이터 보존의 세 저장 키 비교와 백업/복원 경계는 로컬·원격 E2E의 격리 저장소에서 검증했다.

## 발견과 수정

- 최초 기존 E2E: 96통과/7실패. 입력 옵션 추가에 따른 Tab 순서, 201자 처리 방식, 변경된 안내/오류 선택자를 갱신하고 수동 요약의 누락 CSS 클래스를 복구했다.
- 신규 13개 첫 검사: 12통과/1실패. 실제 `일주일 뒤` 버튼과 다른 테스트 이름을 수정했다. 이후 자동 설정 쓰기 실패 검사를 추가해 총 14개로 확정했다.
- 전체 중간 검사: 114통과/2실패. 저장 오류의 중복 이름을 정확한 버튼 이름으로 구분하고, 완료 뒤 입력 옵션을 거치는 Tab 경로까지 확인했다. 최종 117개 통과.
- 제출 폴더 첫 검사는 파일 복사 완료 전에 시작되어 구·신 파일이 섞인 타입 오류가 났다. 복사 완료 뒤 표준 검사와 신규 핵심 E2E 2개를 다시 실행해 통과했다. 앱 결함으로 집계하지 않는다.

실제 사용자 연구, 물리적 휴대폰, OS 한글 IME 직접 조작, native 브라우저 확대, 스크린 리더 사용성을 검증한 결과는 아니다. IME는 합성 이벤트, 작은 화면/확대는 지정 viewport 조건이다. 추천의 효과나 시간 절감 수치를 주장하지 않는다.

## 재실행

```powershell
pnpm check
pnpm test:e2e
$env:VITE_BASE_PATH='/focusday/'
pnpm build
$env:E2E_BASE_URL='http://127.0.0.1:4180/focusday/'
pnpm test:e2e
```

Playwright가 preview 서버를 실행한다. 하위 경로는 build와 서버 양쪽에 같은 `VITE_BASE_PATH`를 유지한다. 새 결과는 `test-results/`에 쓰며 과거 evidence/screenshots를 덮어쓰지 않는다. 공개 검사 방법은 [배포 기록](deployment.md)을 따른다.

---

## v1.4 실제 검증 기록 (과거)

2026-10-08 KST. 모든 검사는 실제 실행 후 기록했다. [전체 Case 표](SYNTHETIC_BETA_CASES_V1_4.md) · [첫 실패/수정](evidence/v1.4/findings.md). 이전 자료는 [v1.3 snapshot](versions/v1.3.0/validation.snapshot.md) 및 기존 evidence 디렉터리에 보존한다.

## 환경과 실행

Windows NT10.0.26200 / PowerShell / Node24.19.0 / Playwright1.63.0 / Chrome134.0.6998.36 headless, ko-KR, 기본 Asia/Seoul. 최신 브라우저라고 주장하지 않는다. 프로젝트 pnpm11.19.0 고정/도구 실행11.25.0. 기존 lockfile/의존성은 변경하지 않았다. 이 환경의 pnpm 자동 dependency 검사가 제한 네트워크에서 재설치를 시도해 중단했고 기존 문서의 프로세스 설정을 적용했다. [환경 시도](evidence/v1.4/environment-attempt.txt).

```powershell
$env:pnpm_config_verify_deps_before_run = 'false'
pnpm check
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort
# 별도 터미널, 실제 preview 재사용
pnpm test:e2e
# Pages build와 서버 양쪽에 같은 base를 적용
$env:VITE_BASE_PATH = '/focusday/'
pnpm build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4180 --strictPort
# 별도 터미널
$env:E2E_BASE_URL = 'http://127.0.0.1:4180/focusday/'
pnpm test:e2e
node scripts/check-pages-assets.mjs
```

시험은 새 격리 context이며 사용자 실목록/프로필을 변경하지 않는다. UI/storage/clock 오류 주입은 테스트에만 존재한다. pnpm check는 타입·lint·단위·서울/뉴욕 날짜·production build를 실제 실행한다.

## 실제 결과

| 실행                      | 실제 결과                                                                 | 원본                                                                                      |
| ------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 이번 시작 v1.3 check      | PASS: 단위46/서울·뉴욕각22/타입/lint/build                                | [log](evidence/v1.4/baseline-check.txt)                                                   |
| 이번 시작 기존 E2E        | 80 PASS / fail·skip·flaky0, exit0                                         | [JSON](evidence/v1.4/baseline-e2e.json)                                                   |
| 신규 Beta 첫 실행         | 15 PASS /2 FAIL, 테스트 locator/수집                                      | [raw](evidence/v1.4/beta-first.json) · [trace](evidence/v1.4/first-failures/)             |
| 수정 후 신규 Beta         | 22 PASS / fail·skip·flaky0                                                | [raw](evidence/v1.4/beta-second.json)                                                     |
| 새 상태 첫/두 번째 검수   | 8 viewport, 처음 sheet2조건/안내1조건FAIL → 모두PASS, overflow·실행 오류0 | [first](evidence/v1.4/features-first.json) · [second](evidence/v1.4/features-second.json) |
| 첫 전체 root              | 100 PASS /2 FAIL, 미완료 범위/새 Tab 정지                                 | [raw](evidence/v1.4/root-first.json)                                                      |
| 접힌 성취 포커스 재현     | B09 FAIL, body 초점                                                       | [raw](evidence/v1.4/focus-first.json)                                                     |
| 첫 geometry 수정 뒤 전체  | 102 PASS /1 FAIL, native closed details도 rect 반환                       | [raw](evidence/v1.4/root-second.json) · [실제 진단](evidence/v1.4/focus-diagnosis.txt)    |
| 명시적 closed 제외 뒤 B09 | PASS, 입력 초점 복귀                                                      | [raw](evidence/v1.4/focus-fixed.json)                                                     |
| **최종 check**            | **PASS: 단위60/서울·뉴욕각36/타입/lint/build**, exit0                     | [log](evidence/v1.4/check-final.txt)                                                      |
| **최종 root production**  | **103 PASS / fail·skip·flaky0**, exit0                                    | [raw](evidence/v1.4/root-final.json) · [log](evidence/v1.4/root-final.txt)                |
| **최종 Pages /focusday/** | **103 PASS / fail·skip·flaky0**, exit0                                    | [raw](evidence/v1.4/pages-final.json) · [log](evidence/v1.4/pages-final.txt)              |
| Pages HTML/JS/CSS/favicon | HTTP200, 실제 /focusday/ 자산 경로/형식                                   | [raw](evidence/v1.4/pages-assets.json)                                                    |
| 전체 task 백업 경계       | 6000개 padded/compact round trip, 모든 속성 보존,10MiB ±1/초과 다운로드0  | [순수 데이터](evidence/v1.4/backup-boundary-after.json), 기존 E2E 유지                    |
| **GitHub CI / Pages**     | **각103 PASS**, 단위60·서울/뉴욕각36·타입/lint/build·deploy success       | [실제 원격 상태/로그](evidence/v1.4/github-actions.json)                                  |
| **공개 desktop / mobile** | **모두 PASS**, 앱1.4.0·자산200·기존 기능·설정/성취/격려/undo·backup       | [공개 원본](evidence/v1.4/live-deployment.json)                                           |
| 공개6000개 파일           | 다운로드 전체 필드 비교/같은 파일 미리보기 PASS,4,877,007 bytes           | [공개 원본](evidence/v1.4/live-deployment.json), quota/목록 성능 제외                     |

103개 = 기존80개(삭제/skip 없음) + v1.4 신규23개(12관점 세션+경계11개). v1.4 Case는26단계+11경계이며 테스트 실행 수와 다르다. 최초/중간 FAIL을 그대로 보존하고 실제 데이터/포커스/길이/대비 기준을 낮추지 않았다. 기존 테스트의 DOM 범위/새 summary Tab 정지는 같은 동작 의미로 갱신했다.

## 기능·시각·보존 근거

같은날 refresh/새 page/모드 왕복·자정/visibility/focus·열린 앱 offline·내 문장0/120/121/HTML/composition·초안 저장/취소/오류·손상/미지원/읽기/초기화 실패를 실제 실행했다. 성취0→1→2→3→4/전체 무기한/예시·어제 제외/검색 독립/undo·삭제·복원/최근 정렬·시각/중복 격려/꺼진 동안 처리·서울/뉴욕 로컬 자정·import 후 직접3을 확인했다.

명세6 viewport1440×900/1366×768/1024×768/768×1024/390×844/320×568 +720×450/scale2 동등 reflow +390×480 작은 높이,320×400 footer를 확인했다. [이번 v1.3 Before](evidence/v1.4/before-visual.json) · [같은 fixture After](evidence/v1.4/after-visual.json) · [새 상태](evidence/v1.4/features-second.json). 전후 기본 desktop row56.8px 유지, overflow0. 실제 사진을 열어 설정/안내·성취/모바일·전후 배치를 검토했다. touch/isMobile/tap·keyboard/trap/초점 복귀·status/alert·reduced-motion·기존4.5:1 텍스트/3:1 필수 경계 대비 회귀를 실행했다.

`src/domain.ts`, `storage.ts`, `backup.ts`, `pnpm-lock.yaml`은 시작 소스와 diff0이다. task key/data version/backup version1, id/기한/모든 속성·예시·완료와10MiB 동일 한도 유지. UI는 별도 key/version1·백업 제외이며 merge/replace 성공/실패 후 각각 UI 유지·성취 재계산/보존을 확인했다. 격려 표지 쓰기 실패의 현재 세션 억제와 refresh 이후 저장 의존 한계는 B06에서 직접 확인했다.

## 실제 미실행과 한계

| 조건                              | 상태 / 실제 대체 범위                                           |
| --------------------------------- | --------------------------------------------------------------- |
| 물리폰·OS 가상 키보드·safe-area   | NOT_RUN / Chrome hasTouch/isMobile·tap·visualViewport·축소 높이 |
| OS 한글 IME·사람 OS 파일 선택창   | NOT_RUN / composition/229/키보드와 file upload 이벤트           |
| native200% 확대·스크린 리더       | NOT_RUN /720×450 동등 reflow·이름/초점/대비/status              |
| Safari/Firefox·최신 Chrome        | NOT_RUN / 로컬Chrome134, 원격은 workflow Chromium               |
| 사람 사용자 연구/만족도/과업 시간 | NOT_RUN / AI 관점과 automation 실행 시간만 존재                 |
| 다중 탭·실제 quota·대량 목록 성능 | NOT_RUN /80·200개 기능과6천개 read port 파일 경계               |
| 오프라인 최초 페이지 다운로드/PWA | NOT_RUN·지원 안 함 / 열린 앱의 로컬 문구 offline 표시           |

전체 WCAG/보안 감사를 완료했다고 주장하지 않는다. 원격CI·수동Pages·공개 재검증은 실제 완료했으며 소스SHA/run 링크·공개 시각과 화면은 [배포 기록](deployment.md)에 기록했다. 알려진 중대한 미해결 문제는 없다. 표지 저장 실패 뒤 새로고침 한계와 위 NOT_RUN은 그대로 남는다.
