# Focusday v1.2 실제 검증 기록

이 평가는 AI가 구성한 가상 사용자 관점과 실제 앱 조작/자동화 검증을 결합한 Synthetic Beta다. 실제 사용자 모집·인터뷰·만족도·사용자 과업 시간 측정은 수행하지 않았다.

검증일 2026-10-02 KST. 이전 [v1.0](versions/v1.0.0/index.md)·[v1.1](versions/v1.1.0/index.md)의 문서·화면·증거를 보존했다. 과거 PASS를 새 실행 결과처럼 재사용하지 않는다.

## 실제 환경

Windows NT 10.0.26200 / PowerShell / Node 24.19.0 / pnpm 11.19.0 / Playwright 1.63.0 / Chrome **134.0.6998.36** headless. React 19.3.0 / TypeScript 5.9.3 / Vite 8.3.2 / Vitest 5.0.3 / ESLint 10.11.0. 최신 Chrome이라고 주장하지 않는다.

Chrome locale ko-KR, timezone Asia/Seoul. 1440×900, 1366×768, 390×844, 320×740; 별도 touch/isMobile context와 390×480 조건. 200%는 720×450 CSS viewport·scale2의 reflow 동등 조건이다. native 브라우저 zoom/실제 가상 키보드가 아니다. Clock으로 로컬 날짜·자정·월말·연말을 제어하고 날짜 규칙은 서울/뉴욕 별도 프로세스에서 윤년·DST도 검사한다.

모든 목록은 UI 생성 또는 격리 context의 합성 Task fixture다. Storage 예외/읽기 port·File 지연을 주입한 경우도 사용자 프로필과 분리했다. 6000/20000 데이터는 순수 경계 또는 read port 기반 다운로드/preview이며 실제 storage quota·해당 크기의 정상 목록 성능을 검증하지 않았다.

## 실행 결과

| 실행                                  | 실제 결과/근거                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 변경 전 기존 pnpm check               | 타입·lint·단위 42개·서울/뉴욕 각각 22개·production build PASS                                                        |
| 변경 전 기존 Chrome E2E               | 기존 55개 PASS. 추가 평가/재현은 [58개 실행](evidence/v1.2/baseline-and-reproduction.json)에 분리                    |
| 12개 관점 개선 전 연결 세션           | 12개 스크립트 종료, helper의 실제 실패는 별도. [원본 관찰](evidence/v1.2/synthetic-before.json)                      |
| 수정 전 자체 백업                     | 순수 padded 5,531,044 bytes와 실제 UI 다운로드/재선택 FAIL; compact 4,847,007 bytes는 기존 5MiB 안에 듦              |
| 수정 후 pnpm check                    | 타입·lint·단위 **46개**·서울/뉴욕 각 **22개**·production build PASS                                                  |
| 루트 production 전체 E2E              | **71개 PASS**, fail/skip/flaky 0, exit0. [원본 요약](evidence/v1.2/root-final.json)                                  |
| Tab만 사용하는 P03 보완 재확인        | 1개 PASS. [실제 키보드 재확인](evidence/v1.2/keyboard-only-recheck.json)                                             |
| 실제 /focusday/ base build + 전체 E2E | **71개 PASS**, fail/skip/flaky 0, exit0. [Pages 경로 요약](evidence/v1.2/pages-final.json)                           |
| 53개 명세 Case 매핑                   | 개선 전 지원 범위 51 PASS/2 FAIL → 개선 후 53 PASS. [전체 항목](SYNTHETIC_BETA_CASES_V1_2.md)                        |
| 데이터 경계 재검증                    | 6000개 padded/compact 허용, 7000개 전체 필드 round trip, 정확히10MiB/1byte초과, 초과 내보내기0·원본 보존             |
| GitHub CI / Pages build/deploy        | 모두 success. 각각 타입·lint·단위46·시간대각22·build·Chromium71 PASS. [원격 로그](evidence/v1.2/github-actions.json) |
| 공개 Chrome desktop/mobile            | 앱1.2.0·자산200·핵심/계획/복원·조합 Enter·실행 오류0 PASS. [원본](evidence/v1.2/live-deployment.json)                |
| 공개 6000개 자체 백업 재선택          | 실제 전체 다운로드·task 비교·같은 파일 preview PASS, 4,877,007bytes. read port이며 quota/목록/적용 검사는 제외       |

71개는 기존 55개 회귀 + 관점별 연결 세션 12개 + 백업 크기 UI 3개 + 상세 경계 1개다. 53개는 명세의 Case ID이며 테스트 개수와 다르다. 자동화 duration을 사용자 과업 시간/앱 성능/만족도 지표로 사용하지 않는다. 원격 CI/공개 완료 결과는 [deployment.md](deployment.md)에 따로 기록한다.

## 수정과 실제 데이터 판정

- SB-01/E11: 실제 다운로드 JSON의 모든 task 필드를 비교했다. compact UTF-8 크기 사전 검사와 가져오기 한도를 공유한다. 10MiB 초과 시 다운로드 성공을 표시하지 않고 다운로드0·현재 데이터 불변을 검사했다. 파일 선택/취소/invalid는 쓰기를 하지 않는다.
- SB-02/B05: compositionstart + 실제 Enter에서 모달 유지/raw 불변, compositionend 직후 Enter 차단, 100ms 뒤 정상 Enter 적용을 검사했다. 마지막 정상 저장을 포함한 최종 hash 변화는 의도된 결과다. OS IME PASS가 아니다.
- 기존 정상 version1 raw 첫 로드 동일·write0, id/완료/isDemo/기한/집중 유지, merge/replace의 실패 전 메모리·원본 유지와 성공1write를 기존 assertion 그대로 재실행했다.
- 첫 평가에서 잘못 잡은 레이블/selector와 undo updatedAt 기대는 스크립트에서 바로잡았다. 원본 관찰과 보완 재실행을 보존한다. 첫 최종 실행의 disabled 날짜 해제 클릭도 검사 오류이며 [70 PASS/1 도구 실패](evidence/v1.2/root-first.json) 뒤 전체 재실행71 PASS다.
- 미사용 import로 멈춘 타입 검사는 수정했고, build가 갱신되기 전에 시작한 UI 실행은 취소해 평가 근거에서 제외했다. 선택 필터의 No tests found도 실행 도구 문제로 구분했다.

## 화면 확인

PNG는 실제 production 앱의 합성 테스트 데이터다. 백업 전후, 조합 Enter 후 모달 유지, 모바일 preview, 320px과 reflow를 직접 시각 검토하고 geometry/44px target/scroll/focus도 검사했다.

[백업 실패 전](screenshots/v1.2/before/backup-6000.png) · [성공 후](screenshots/v1.2/after/backup-6000.png) · [편집 유지](screenshots/v1.2/after/P12-composition-kept.png) · [모바일](screenshots/v1.2/after/restore-mobile.png) · [320px](screenshots/v1.2/after/restore-320.png) · [200% 동등 reflow](screenshots/v1.2/after/P11-reflow.png).

배포 뒤 촬영한 [실제 공개 desktop](screenshots/v1.2/live-desktop.png) · [공개 모바일 복원](screenshots/v1.2/live-mobile-restore.png) · [공개 6000개](screenshots/v1.2/live-backup-6000.png)도 직접 시각 검토했다. 원격 Playwright Chromium은 로컬 Chrome134와 다른 환경이며 둘의 결과를 구분한다.

## 미실행·범위 제한

| 조건                                        | 상태        | 이유/대신 실행한 범위                                        |
| ------------------------------------------- | ----------- | ------------------------------------------------------------ |
| 실제 휴대폰·가상 키보드·safe-area           | NOT_RUN     | 물리 기기 없음. Chrome touch/isMobile·축소 viewport만 실행   |
| 실제 OS 한글 IME·사람의 OS 파일 선택창 취소 | NOT_RUN     | composition/File·empty selection 이벤트와 automation 키 검사 |
| native 브라우저 200% 확대                   | NOT_RUN     | CSS viewport/scale2의 reflow 동등 조건으로 구분              |
| Safari/Firefox/최신 Google Chrome           | NOT_RUN     | 설치 Chrome134와 원격 Playwright Chromium 범위               |
| 스크린 리더·전체 WCAG·전체 보안 감사        | NOT_RUN     | 자동 이름/대비·keyboard/motion 검사는 전체 판정이 아님       |
| 실제 사용자 연구·발화·만족도·과업 시간      | NOT_RUN     | AI 관점 + 실제 자동화이며 사람을 모집하지 않음               |
| 6000개 목록 성능·대량 storage quota         | NOT_RUN     | 순수 데이터/read port 다운로드/미리보기로 구분               |
| 10MiB 초과 전체 메모리의 파일 보존/복원     | UNSUPPORTED | bounded 한도 초과 내보내기를 중단. 데이터 일부 제외하지 않음 |

지원 범위 밖의 조건을 53 PASS에 포함하지 않는다. [평가·가설·근거](SYNTHETIC_BETA_V1_2.md) · [관찰→원인→수정→재검증](V1_2_UPDATE.md).
