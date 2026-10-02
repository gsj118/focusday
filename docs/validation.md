# 실제 검증 기록

검증일: **2026-10-02 (KST)**. PASS는 실제 수행한 검증만 뜻한다. FAIL 후 수정한 내용과 미실행 환경을 함께 기록한다. 경쟁 제품 조사 결과나 주 사용자 가설을 앱 사용자 테스트로 간주하지 않는다.

## 환경

- Windows NT 10.0.26200, PowerShell 7.6.5.
- Node.js 24.19.0, pnpm 11.19.0.
- React / React DOM 19.3.0, TypeScript 5.9.3, Vite 8.3.2, Vitest 5.0.3, Playwright 1.63.0, ESLint 10.11.0.
- 실제 설치된 **Google Chrome 134.0.6998.36**, Playwright가 headless로 실행. 화면을 실제 렌더링하고 PNG를 직접 시각 검토했다. 최신 Chrome이라고 주장하지 않는다.
- 브라우저 timezone Asia/Seoul. 날짜·타이머 검증에는 Playwright Clock을 사용하고 단위 테스트는 Asia/Seoul / America/New_York 프로세스를 각각 실행했다.
- desktop 1440×900, 1366×768; responsive 390×844, 320×740. 추가 touch/isMobile context에서 390×844와 가시 영역 390×480 검증.
- Windows OS 배율 영향 없이 CSS viewport를 고정하려고 `--force-device-scale-factor=1` 사용.

## 실행한 명령과 결과

| 명령                                                        | 실제 결과                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `pnpm install --store-dir .pnpm-store`                      | PASS: 공개 패키지 실제 설치, 호환 peer 범위와 Node 요구 확인, lockfile 생성 |
| `node node_modules/typescript/bin/tsc --noEmit`             | PASS: 타입 오류 없음                                                        |
| `node node_modules/eslint/bin/eslint.js .`                  | PASS: 린트 오류 없음                                                        |
| `node node_modules/vitest/vitest.mjs run`                   | PASS: 2 파일, 25 테스트                                                     |
| `node scripts/test-date-zones.mjs` / `pnpm test:dates`      | PASS: 서울·뉴욕에서 도메인 테스트 각각 15개, DST 23/25시간 자정 포함        |
| `pnpm check`                                                | PASS: 타입·lint·단위·서울/뉴욕 시간대·production build 실행                 |
| `node node_modules/vite/bin/vite.js build`                  | PASS: 실제 production HTML·JS·CSS 생성                                      |
| `node node_modules/@playwright/test/cli.js test`            | PASS: production 앱에서 E2E 25개                                            |
| `VITE_BASE_PATH=/focusday-test/` build + 해당 baseURL의 E2E | PASS: 하위 경로 production 앱에서 같은 E2E 25개                             |

bundled pnpm 실행 경로를 통해 npm registry 조회·설치와 pnpm scripts를 수행했다. 네트워크 제한 환경에서는 registry 요청이 실패해 네트워크 접근 가능한 권한 환경에서 설치했다. GitHub 인증도 같은 방식으로 재확인했으며 정상이다.

최종 E2E 결과의 간결한 원본 기반 요약: [로컬 루트 경로](evidence/root-e2e.json), [Pages 하위 경로](evidence/pages-e2e.json). 전체 trace와 임시 보고서는 `test-results/`에 생성하고 Git에서 제외한다. 시간은 테스트 환경 실행값으로 실제 성능 보장을 뜻하지 않는다.

## 기능별 기대 결과와 실제 결과

| 확인한 행동                                         | 기대 결과                                                        | 실제 결과·증거                                                                    | 상태               |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------ |
| 첫 빈 화면·오늘/전체 빠른 입력·연속 입력            | 자동 예시 없음, 오늘 focus만 지정, 전체 focus null, 생성 후 비움 | E2E 생성 기본값·storage 값 확인. 첫 load localStorage 길이 0                      | PASS               |
| 오늘 추가/제거·미래 기한·오늘/지난 기한             | dueDate 독립, 자동 포함은 중복 없음, 잔류 이유/기한 편집         | domain 합집합/정렬과 E2E 잔류 안내·해제·속성 확인                                 | PASS               |
| 빈 제목·200자 한글·201자·공백 없는 문자열           | 빈 제목 거부, 200자 허용, 201자 입력 제한, 전체 제목 편집 가능   | 입력/편집 오류, 저장 데이터, 네 폭에서 긴 제목과 overflow 확인                    | PASS               |
| 한글 composition 이벤트 중 Enter·종료 직후 Enter    | 조합 확정이 자동 제출하지 않음, 다음 Enter만 제출                | 실제 브라우저에서 compositionstart/end와 Enter 주입, 저장값 확인                  | PASS (이벤트 수준) |
| 제목·기한·우선순위·분류 수정 후 새로고침            | 저장된 속성 보존                                                 | E2E 실제 reload 후 localStorage와 목록 확인                                       | PASS               |
| 완료·실행 취소·완료 목록 이동·미완료 복원           | completedAt 기록/해제, 알림 만료 후에도 복원 가능                | 저장값·목록 이동·완료 영역 확인                                                   | PASS               |
| 완료/삭제 취소·다른 항목 편집                       | 삭제 모든 속성, 완료만 복구, 다른 항목 수정 유지                 | domain/E2E id·완료·예시 포함 원본 비교·B 수정 유지                                | PASS               |
| 연속 완료와 오래된 타이머·hover/keyboard            | 최근 행동만 취소, 이전 타이머 격리, 남은 시간 일시 정지          | Clock 6초→다음 행동→2.1초, hover/포커스 각 10초, 종료 후 8.1초 만료               | PASS               |
| 자정·focus·visibilitychange·월말/연말·DST           | 지난 focus 전체 보존, 기한 초과, 로컬 자정 재예약                | 실제 브라우저 제어 시계/이벤트와 서울·뉴욕 단위 테스트                            | PASS               |
| localStorage 접근/읽기 실패                         | 원본이 불명확하므로 쓰기 중지, 재시도 시 안전 병합               | SecurityError 주입, 기존/임시 항목 유지와 재시도 병합                             | PASS               |
| localStorage 쓰기 실패·재시도                       | 메모리 유지, 저장됨 금지, 지속 경고, 성공 후 해제                | QuotaExceededError 주입 후 실제 성공·저장 데이터 확인                             | PASS               |
| 손상 JSON·버전·스키마·잘못된 날짜/timestamp·중복 id | 자동 덮어쓰기 차단, 명시적 초기화                                | 단위·E2E 원본 비교·다운로드 확인, 초기화 실패 시 원본/오류 유지, 재시도 성공      | PASS               |
| 검색·분류·결과 없음·완료 검색                       | 현재 보기 검색, 탐색 수와 결과 수 구분, 완료도 검색              | 오늘 0/전체 1 결과, 완료 검색·펼침, 검색 지우기                                   | PASS               |
| 예시 선택·재실행·사용자 항목 추가·예시 제거         | 선택적, 중복 없음, 사용자 항목 보존                              | 1 사용자+5 예시, 재실행 6 유지, 제거 후 사용자 1 유지                             | PASS               |
| 200개 스크롤·검색·편집·완료                         | 목록과 기본 조작 유지                                            | 200 행→마지막 행 scroll→검색 1행→분류 편집→완료 값                                | PASS (기본 조작)   |
| 네 해상도 목록/편집기/긴 제목                       | 가로 넘침 없음, 모든 핵심 컨트롤 조작 가능                       | 아래 PNG와 DOM/geometry 검사                                                      | PASS               |
| 모바일 touch·작아진 viewport·toast/nav              | 큰 터치 영역, 시트 스크롤/저장, 하단 탐색과 toast 분리           | isMobile/hasTouch context, 44px label target, 390×480 editor, bounding box 검사   | PASS (에뮬레이션)  |
| 키보드 추가→편집→저장→완료→실행 취소                | 마우스 없이 수행, Escape 초안 취소, 모달 포커스 유지/복귀        | Tab/Shift+Tab/Enter/Space/N, 시작·종료 포커스 assertion                           | PASS               |
| 실제 텍스트·hover·포커스·이름·reduced-motion        | 텍스트 대비 ≥4.5, 포커스 대비 ≥3, 이름과 reduced motion          | 실제 getComputedStyle 색/배경·hover·3px outline, labels/aria-label, transition 0s | PASS (검사 범위)   |
| production HTML·JS·CSS·favicon·하위 경로            | 정상 로딩, 실행 오류·4xx 없음                                    | Chrome response/pageerror 수집과 root/Pages 경로 전체 E2E                         | PASS               |

## 실제 화면 증거

| 화면     | 목록                                        | 편집                                          |
| -------- | ------------------------------------------- | --------------------------------------------- |
| 1440×900 | [데스크톱](screenshots/desktop.png)         | [우측 drawer](screenshots/desktop-editor.png) |
| 1366×768 | [노트북](screenshots/layout-1366.png)       | [노트북 편집](screenshots/editor-1366.png)    |
| 390×844  | [모바일 에뮬레이션](screenshots/mobile.png) | [bottom sheet](screenshots/mobile-editor.png) |
| 320×740  | [작은 화면](screenshots/layout-320.png)     | [작은 화면 편집](screenshots/editor-320.png)  |

스크린샷은 fixture 날짜 2026-10-02의 선택형 예시를 앱 UI로 추가한 실제 production 화면이다. AI 생성 이미지나 목업을 사용하지 않았다. 폰트·간격·기한 텍스트·하단 UI·편집기 전체 구성을 직접 확인했다.

## 발견한 실패와 수정

| 초기 상태                                                      | 원인과 수정                                                                                          | 재검증                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| FAIL: TypeScript의 테스트 id 인수                              | crypto.randomUUID 기본값에서 좁은 UUID 타입이 추론됨. id를 string으로 명시                           | PASS: tsc                           |
| FAIL: check()가 완료 직후 대기                                 | 행이 즉시 사라져 사후 checked 확인 대상이 없어짐. 클릭 후 데이터/이동 검증으로 수정                  | PASS: 완료/복구 E2E                 |
| FAIL: Escape 후 포커스 복귀                                    | 비동기 animation frame과 dialog 종료 타이밍에 의존. layout effect와 pending focus로 DOM 갱신 후 복구 | PASS: 원래 편집 버튼으로 복귀       |
| FAIL: native dialog의 역방향 Tab 경계                          | native 동작만으로 원하는 첫/끝 컨트롤 경계가 유지되지 않음. 명시적 Tab 경계 처리                     | PASS: Shift+Tab/Tab 양방향          |
| FAIL: 1366/390 viewport geometry                               | Windows 배율로 fractional width 1366.4/390.4. browser scale을 1로 고정                               | PASS: 원래 정수 경계 assertion 유지 |
| FAIL: 테스트 중 preview 연결 종료                              | 다른 실행의 서버 정리와 공유 서버가 겹침. 독립적인 preview를 시작해 전체 재실행                      | PASS: 최종 25/25, exit 0            |
| 자체 검토 발견: timestamp 자동 보정·복원 포커스·지난 집중 안내 | 실제 달력/시간 validation, 복원 후 포커스, focusDate!==today 조건으로 보완                           | PASS: 타입·단위·전체 E2E            |

실패 테스트를 삭제하거나 제품 기대를 약화해 통과시키지 않았다. 최종 테스트의 fail/skip/flaky는 0이다.

## 미실행과 남은 제한

| 항목                                                     | 상태    | 이유·한계                                                                                                            |
| -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| 실제 스마트폰의 Chrome/Safari·실제 가상 키보드·safe-area | NOT_RUN | 물리 기기 검증을 수행하지 않았다. touch와 좁아진 viewport는 브라우저 에뮬레이션이며 실기기 동등성을 주장하지 않는다. |
| OS 한글 IME 실제 조합키 입력                             | NOT_RUN | 사용한 E2E는 composition 이벤트 수준이다. 네이티브 OS 조합 입력의 실사용 확인을 별도로 수행하지 않았다.              |
| Firefox / Safari / 최신 Chrome                           | NOT_RUN | 실제 검증은 설치된 Chrome 134에 한정. 해당 추가 환경의 브라우저를 설치·실행하지 않았다.                              |
| 스크린 리더·전체 WCAG 적합성 평가                        | NOT_RUN | 자동 이름/색과 키보드 검증은 전체 수동 보조기술 평가를 대체하지 않는다.                                              |
| 실제 사용자 인터뷰·과업 테스트·성능 벤치마크             | NOT_RUN | 이번 제작은 명세 기반 프로토타입 검증. 200개 기본 조작 결과를 일반 성능 보장으로 사용하지 않는다.                    |
| GitHub push·Pages 실배포·원격 Actions                    | NOT_RUN | 인증은 정상이나 대상 과제 remote가 미지정. 새 공개 저장소는 임의로 만들지 않았다.                                    |

서버 백업·기기 간 동기화·다중 탭 편집 보장은 없다. 사이트 데이터 삭제로 데이터가 사라질 수 있다. 삭제 취소는 최근 한 건의 알림 표시 중에만 제공하며 새 행동/새로고침이 복구를 교체·종료한다. 현재 검증 범위 안에 남은 재현 가능한 기능 실패는 발견하지 못했다.
