# Focusday v1.1 실제 검증 기록

검증일 **2026-10-02 KST**. 실제 실행한 결과만 PASS로 기록한다. 이전 버전 결과는 [v1.0 baseline](versions/v1.0.0/index.md)에 보존하고 v1.1 결과로 재사용하지 않는다.

## 환경과 실행

Windows NT 10.0.26200 / PowerShell 7.6.5 / Node 24.19.0 / pnpm 11.19.0. React 19.3.0, TypeScript 5.9.3, Vite 8.3.2, Vitest 5.0.3, Playwright 1.63.0, ESLint 10.11.0. 실제 설치된 **Chrome 134.0.6998.36**을 headless로 렌더링하고 PNG를 직접 검토했다. 최신 Chrome이라고 주장하지 않는다.

브라우저 timezone Asia/Seoul, locale ko-KR. E2E fixture는 Playwright Clock으로 2026-10-02 및 월말/연말 날짜를 제어한다. 별도 프로세스의 Asia/Seoul과 America/New_York에서 달력 규칙과 DST 23/25시간 자정을 검사한다. Windows 배율에 따른 fractional viewport를 피하려고 scale factor 1을 유지했다. 실제 사용자 브라우저 프로필과 데이터를 조작하지 않는다.

| 실행                                                 | 실제 결과                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| 변경 전 `pnpm check` + production Chrome E2E         | PASS: 단위 25개, 각 시간대 domain 15개, build, E2E 25개                     |
| v1.1 `pnpm check`                                    | PASS: TypeScript·ESLint·단위 42개·서울/뉴욕 각각 날짜 22개·production build |
| v1.1 첫 새 기능 Chrome E2E                           | 29개 PASS. 이후 preview UX와 touch 검사를 반영해 전체 재실행                |
| `node node_modules/@playwright/test/cli.js test`     | 루트 production 전체 55개 PASS, exit 0                                      |
| `VITE_BASE_PATH=/focusday/` build + 해당 baseURL E2E | 실제 Pages 경로 production 전체 55개 PASS, exit 0                           |
| `node node_modules/vite/bin/vite.js build`           | Pages 검증 뒤 기본 로컬 production 다시 생성, PASS                          |

최종 결과의 fail/skip/flaky는 각각 0이다. [baseline 재실행](evidence/v1.1/baseline-v1.0.json) · [루트 55개](evidence/v1.1/root-e2e.json) · [Pages 55개](evidence/v1.1/pages-e2e.json). 각 보고서는 실제 Playwright JSON의 stats·각 테스트 status/duration을 추출했다. duration은 자동화 실행값이며 사용자 과업 시간/성능 지표가 아니다. 원본 JSON과 trace는 `test-results/`에 생성하고 Git에서 제외한다.

실제 공개 URL은 [Focusday v1.1](https://gsj118.github.io/focusday/)다. 원격 Linux [CI](https://github.com/gsj118/focusday/actions/runs/36961036184)와 [Pages 빌드·배포](https://github.com/gsj118/focusday/actions/runs/36961036551)에서 타입·lint·단위·시간대·build와 Chromium E2E 각각 **55개 통과**를 실제 로그로 확인했다. [원격 결과](evidence/v1.1/github-actions.json).

배포 성공 뒤 Chrome 134의 격리 desktop 1440×900 / touch/isMobile 390×844 context로 공개 주소를 조작했다. 실제 버전 1.1.0, HTML/JS/CSS/favicon 200, 첫 빈 화면, 생성·편집·새로고침 저장·집중·완료/삭제 취소, 완료/예시 전체 백업 JSON과 무변경, id 합치기 preview/적용, 어제 안내·계획·같은 id/기한 이어가기와 reload가 모두 PASS다. requestfailed·4xx·pageerror는 0. [공개 검증 JSON](evidence/v1.1/live-deployment.json) · [공개 계획](screenshots/v1.1/live-desktop-plan.png) · [공개 모바일 복원](screenshots/v1.1/live-mobile-restore.png). 태그·push·수동 배포 관계는 [deployment.md](deployment.md)에 있다.

출시 커밋 `e29397e`의 CI는 성공했다. 태그 ref의 Pages 실행은 검사/E2E 55개 통과 후 main만 허용하는 환경 정책 때문에 deploy에서 실패했다. 태그·정책을 그대로 두고 같은 커밋의 main으로 재실행해 검사/E2E 55개와 build/deploy 성공을 확인했다. 이 배포 실패는 기능 검사 실패와 구분한다. [실제 오류·정책·재실행 결과](evidence/v1.1/release-deployment.json).

허용된 경로로 출시 커밋을 게시한 뒤 공개 Chrome 데스크톱·모바일 검사를 다시 실행해 동일한 핵심 동작·백업/합치기·계획/이어가기와 자산 200, 오류 0을 확인했다. [출시 공개 재검증](evidence/v1.1/release-public.json).

## 새 기능별 기대와 실제

| 확인한 행동                               | 기대                                                                  | 실제 결과                                                       | 상태              |
| ----------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------- |
| v1.0 정상 raw 데이터 초기 로드            | 저장 키/version 유지, 자동 초기화·마이그레이션·쓰기 없음              | 문자열 동일, 모든 속성 유지, 초기 write 0                       | PASS              |
| 계획 후보 순서·중복·이유·완료 제외        | overdue→dueToday→yesterday→high, 상위 그룹 한 번, 해당 사실 모두 표시 | 도메인 그룹/정렬 assertion + 브라우저 순서/이유/행 수           | PASS              |
| 집중 중·후보 없음·전체 경로               | 현재 focus 상태, 빈 설명, 후보 밖 작업 선택 가능                      | aria-pressed/집중 중과 전체 이동, 기존 항목 유지                | PASS              |
| 어제 미완료·수동 이어가기                 | 완료/이틀 전 제외, 자동 이월 없음, 기존 id/기한 유지                  | raw 로드 불변, 어제 수 2→1, 같은 id/기한, 총 항목 수 불변       | PASS              |
| 자정 월말·focus/visibility 연말·서울/뉴욕 | 열린 패널·안내·후보·요약 날짜 갱신                                    | 10/31→11/1, 12/31→1/1, TZ 달력/어제/DST                         | PASS              |
| 직접 집중 수와 기한 표시 수               | 겹치지 않는 합계가 검색 전 오늘 수와 동일                             | 2+1→1+2→0+2, 실제 목록 2행과 일치                               | PASS              |
| 집중 해제 뒤 기한 잔류                    | 이유와 기한 편집 경로, dueDate 유지                                   | 정확한 안내·편집 버튼·속성 assertion                            | PASS              |
| 전체 백업 round trip                      | 완료/isDemo와 모든 속성, 로컬 날짜 파일명, 저장 무변경                | 실제 download JSON 비교·원본 raw 동일·write 0·URL revoke        | PASS              |
| 쓰기 실패 중 백업                         | 아직 저장 안 된 메모리 포함, 안내, 원본 불변                          | 경고와 다운로드의 사용자+새 항목, 기존 raw 동일                 | PASS              |
| 파일 실패·버전·중복 id·날짜·길이          | 한국어 오류·재선택, 데이터/저장 상태 불변                             | 7 invalid UI 사례, 같은 validator 단위 검사, write 0            | PASS              |
| 5MiB 초과·파일 취소                       | 크기 오류·선택 취소와 preview 취소 무변경                             | 실제 큰 File, files=[] 이벤트와 취소, raw/write/status 확인     | PASS              |
| 합치기                                    | 새 id만 추가, 현재 중복 보존, 다른 id 같은 제목 별도, 충돌 수         | 추가1/중복2/내용차이1, 최종3개 원본 비교, 1 write, reload 유지  | PASS              |
| 전체 교체                                 | 미리보기→확인→명시적 적용, 백업/취소, 중첩 모달 없음                  | 현재2→0, 확인 전 raw 동일, 백업 동일, 취소 write0, 성공 write1  | PASS              |
| merge/replace 쓰기 실패·재시도            | 적용 전 메모리·원본·전역 저장 상태 유지, 성공 후 undo 정리            | 실제 DOM/원본/status 비교, 실패0변경→재시도 성공, 성공1 write   | PASS              |
| blocked/unavailable 보호                  | 복원이 guard 우회하지 않음                                            | 적용 disabled·복구 안내·write0·원본 유지                        | PASS              |
| 늦은 파일 읽기·패널 종료                  | 새 선택이나 새 패널을 덮어쓰지 않음                                   | 지연 File.text→손상 선택/close→새 panel, preview 없음·원본 유지 | PASS              |
| 예시 재추가                               | 실제 추가/중복 피드백 구분, 사용자 보존                               | 첫 추가5, 재선택 같은6·추가write없음, 제거후 사용자1            | PASS              |
| 새 패널 키보드·Escape·포커스              | 양방향 trap, N/검색 단축키 차단, 호출점 복귀                          | 실제 Tab/Shift+Tab/Escape, 계획 버튼/메뉴 summary focus         | PASS              |
| 4폭·긴 제목/분류·13px metadata            | overflow 없음, 컨트롤 조작, 읽을 수 있는 메타                         | 1440/1366/390/320, 200자 제목·24자 분류, geometry/fontSize      | PASS              |
| 새 패널 touch·390×480 가시 영역           | 시트 내부 scroll/선택/복원, 44px 버튼                                 | isMobile/hasTouch context의 tap과 저장값, 경계/target height    | PASS (에뮬레이션) |

실패 write 시도는 한 번의 setItem 예외이며 재시도 성공도 한 번의 setItem으로 확인했다. 복원 성공 전의 앱 목록 변경이나 부분 적용은 없었다. OS 파일 선택창에서 사람이 취소한 테스트 대신 브라우저 File/empty selection 이벤트로 검사했다.

## v1.0 회귀 25개

빠른 입력/기본값·빈 제목/200자/IME 이벤트·제목/기한/우선순위/분류 저장/새로고침·완료/복원·삭제와 원본 속성 취소·최근 undo/이전 timer/hover/focus·자정/focus/visibility·쓰기/읽기/접근 실패·손상 JSON/스키마/버전과 원본 다운로드/명시적 초기화·검색/완료 검색·예시/사용자 보존·200개 기본 조작·키보드/포커스·4해상도/긴 제목·실제 CSS 대비/reduced motion·touch/편집기·자산 로딩을 그대로 유지해 통과했다.

집중 문구 변경에 필요한 선택자만 조정했다. 데이터·저장 보호·복구의 기대를 완화하거나 실패 검사를 제거하지 않았다. 전체 WCAG 판정이나 200개 이상 일반 성능 보장을 뜻하지 않는다.

## 화면과 개선 확인

| 크기     | 오늘                                          | 계획                                        | 복원                                            |
| -------- | --------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| 1440×900 | [desktop](screenshots/v1.1/today-desktop.png) | [drawer](screenshots/v1.1/plan-desktop.png) | [preview](screenshots/v1.1/restore-desktop.png) |
| 1366×768 | [laptop](screenshots/v1.1/today-1366.png)     | [plan](screenshots/v1.1/plan-1366.png)      | [preview](screenshots/v1.1/restore-1366.png)    |
| 390×844  | [mobile](screenshots/v1.1/today-mobile.png)   | [sheet](screenshots/v1.1/plan-mobile.png)   | [preview](screenshots/v1.1/restore-mobile.png)  |
| 320×740  | [small](screenshots/v1.1/today-320.png)       | [plan](screenshots/v1.1/plan-320.png)       | [preview](screenshots/v1.1/restore-320.png)     |

실제 production UI이며 AI 이미지/목업이 아니다. 모바일 미리보기가 파일 선택 아래 가려지는 화면을 확인해 focus/scroll을 보완하고, 오래된 계획 피드백은 날짜에 묶었다. fixed dialog의 viewport 밖 배경이 fullPage PNG에 섞이는 문제는 새 패널의 실제 viewport 촬영으로 바로잡았다. 이후 전체 루트/Pages 55개를 재실행했다. 상세 발견·원인·반영은 [업데이트 기록](V1_1_UPDATE.md)에 있다.

## 미실행과 이유

| 항목                                         | 상태    | 이유                                                                                    |
| -------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| 실제 스마트폰·가상 키보드·safe-area          | NOT_RUN | 물리 기기 없음. touch/축소 viewport는 Chrome 에뮬레이션                                 |
| 실제 OS 한글 IME·사람의 OS 파일 선택창 취소  | NOT_RUN | 조합/File 선택 이벤트 수준으로 검증, 네이티브 사용자 키/대화상자 조작은 별도 실행 안 함 |
| Safari / Firefox / 최신 Google Chrome        | NOT_RUN | Windows Chrome 134와 원격 Playwright Chromium 범위, 별도 제품 브라우저 미실행           |
| 스크린 리더·전체 WCAG·전체 보안 감사         | NOT_RUN | 자동 이름/대비·키보드 검증으로 전체 평가를 대체하지 않음                                |
| 사용자 연구·만족도·사용자 시간/성능 벤치마크 | NOT_RUN | 명세 기반 설계 가설과 실제 UI/데이터 검증, 사용자 실험 없음                             |

파일은 수동 사본이며 서버 백업·다른 기기 동기화·다중 탭 동시 편집은 보장하지 않는다. 사이트 데이터 삭제로 브라우저 데이터가 사라질 수 있다. 현재 실행한 범위에서 재현 가능한 기능 실패는 발견하지 못했다.
