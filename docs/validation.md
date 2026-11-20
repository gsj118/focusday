# Focusday v1.5 검증 기록

## 최신: 승인본의 원격 검사·공개 배포 · 2026-11-20

사용자 승인본을 기존 main에 반영했다. CI와 Pages workflow가 각각 타입·lint·단위 112개·서울/뉴욕 각 88개·브라우저 144개를 통과했고 실제 배포 job도 성공했다. 공개 JS·CSS·favicon을 검증된 로컬 Pages 빌드와 SHA-256으로 대조했다. 공개 주소의 PC·모바일 크기에서 메모 정리→오늘 기한 반영→완료→되돌리기→체험 초기화를 직접 조작했다. 실제 스마트폰·OS 키보드나 사람 대상 사용성 연구를 수행한 것은 아니다.

[배포 소스·실행 링크](deployment.md) · [원격 검사](evidence/v1.5/final-public/github-actions.json) · [자산 대조](evidence/v1.5/final-public/assets.json) · [공개 UI 검수](evidence/v1.5/final-public/ui.json).

## 배포 전: 배치·색감·한국어 전체 검수 · 2026-11-20

사용자 요청에 따라 PC와 모바일의 배치·색감·문구를 다시 다듬었다. 아래는 사용자 승인 전에 수행한 로컬 검수 기록이다. 승인 후 공개 배포 결과는 위 절에 별도로 기록했다.

- PC: 메모 입력 폭을 약 311→438px로 넓히고 실행 카드 높이를 약 283→257px로 줄였다. 배너·입력·실행 영역의 시각적 우선순위를 정리했다.
- 색: 주요 실행은 파랑, 완료는 초록, 남은 기한은 주황으로 구별한다. 제목·아이콘·다음 행동도 달라 색만으로 상태를 전달하지 않는다.
- 모바일: 하단 메모 진입과 오늘/전체 목록 맨 위 복귀를 추가했다. 긴 미리보기는 안쪽에서 스크롤하고, 편집 안내는 전체 너비로 읽도록 바꿨다. 320px에서 탐색 이름·저장 상태·상단 버튼 줄바꿈을 직접 발견해 보완했다.
- 한국어: **22개 파일의 추출 항목 548개**를 전부 읽고 기능 문맥과 대조했다. 인식 어휘·템플릿 조각도 포함한 수이며 완성된 문장 548개라는 뜻은 아니다. 오류·백업·설정·날짜 변경·되돌리기·24개 일일 문장·4개 격려를 포함한다. 정확한 기존 안내는 유지하고 어색한 표현과 중복 설명을 수정했다. [파일별 검수 및 전후 문구](evidence/v1.5/polish-copy-review.json)

| 검증                                  | 실제 결과                                                                                           | 근거                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 타입·ESLint·단위·날짜·빌드            | 통과. 단위 112개, 서울/뉴욕 각 88개                                                                 | [기본 검사](evidence/v1.5/polish-check.txt)                                                            |
| 전체 브라우저 회귀                    | 144개 통과, 실패·건너뛰기·flaky 0                                                                   | [전체 로그](evidence/v1.5/polish-e2e-full.txt) · [원본 결과](evidence/v1.5/polish-e2e-full.json)       |
| 탐색·상태 표시·간격 보완 후 관련 검사 | 36개 재통과                                                                                         | [로그](evidence/v1.5/polish-responsive.txt)                                                            |
| 최종 320px 버튼 간격 수정 후          | 새 빌드, 320/390px 관련 4개 재통과                                                                  | [최종 빌드](evidence/v1.5/polish-build-final.txt) · [작은 화면](evidence/v1.5/polish-narrow-final.txt) |
| 색 대비                               | 의미별 토큰 9쌍 통과. 텍스트 4.5:1, 입력 경계 3:1 이상. 브라우저 실제 색·hover·포커스 검사도 통과   | [토큰 계산](evidence/v1.5/polish-contrast.json)                                                        |
| 직접 조작                             | IAB에서 1366×768, 768×1024, 390×844, 320×568 확인. 메모·수정·설정·백업·기한 경고·완료·되돌리기 확인 | [관찰 기록](evidence/v1.5/polish-ui.json)                                                              |

추가 5개 회귀 검사는 긴 메모의 마지막 항목 편집, 모바일 입력 초점·탐색 복귀, 접근 가능한 이름·44px 조작 영역, 완료/기한 경고의 구분을 다룬다. [검사 코드](../tests/e2e/polish.spec.ts). 144·36·4는 같은 검사의 재실행을 포함하므로 서로 합산한 고유 시나리오 수가 아니다. 마지막 4개 실행은 PowerShell의 정규식 파이프 전달 문제를 피하도록 명령을 고친 뒤 통과했다. 앱 실패로 집계하지 않는다.

[PC](screenshots/v1.5/polish-desktop.jpg) · [모바일](screenshots/v1.5/polish-mobile.jpg) · [모바일 메모](screenshots/v1.5/polish-mobile-capture.jpg) · [모바일 편집](screenshots/v1.5/polish-mobile-editor.jpg) · [완료](screenshots/v1.5/polish-complete.jpg) · [기한 경고](screenshots/v1.5/polish-warning.jpg)

같은 에이전트의 코드·문구 검토와 브라우저 조작이다. 다른 채팅의 디자인 작업 순서는 참고했지만 새로운 외부 토큰 추출, 독립 검토자·하위 에이전트, 실제 스마트폰·OS 키보드, Safari/Firefox, 사람 대상 사용성 연구를 수행한 것은 아니다. 기존 참조 측정값과 이번 조정값은 [디자인 기준](../DESIGN.md)에서 구분했다.

## 메모·날짜 변경·되돌리기 연결 검수 · 2026-11-20

사용자 요청에 따라 기능을 각각 누르는 데서 끝내지 않고 메모 미리보기→저장→날짜 변경→완료/삭제→되돌리기를 연결했다. 새 회귀 시나리오 **16개**와 실제 IAB 직접 조작으로 확인했다. 같은 에이전트가 만든 가상 데이터와 브라우저 시계를 사용했으며, 실제 사용자 연구나 운영체제 날짜 변경은 아니다.

| 발견한 문제                                                             | 수정과 확인                                                                                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 자정 전에 정리한 ‘오늘·내일’ 미리보기를 다음 날에도 아무 안내 없이 저장 | 정리 당시 날짜와 수정 내용을 보존한다. 날짜가 달라지면 기한 확인 전까지 버튼·Enter 저장을 막고, 원문으로 돌아가 새 날짜로 다시 정리할 수 있다. 확인 후 또 날짜가 바뀌면 다시 확인한다. |
| 미리보기 제목·분류의 한글 조합 Enter가 묶음을 저장                      | 폼 전체에서 조합 중/종료 직후 Enter 제출을 차단한다. 조합 후 직접 저장하면 수정한 제목·분류가 남는다.                                                                                  |
| 열린 편집창의 어제 체크 상태가 새 오늘 계획을 제거                      | 날짜가 바뀌면 실제 새 계획의 포함 여부를 표시한다. 제목·기한 초안은 보존하고, 수동 모드의 지난 focusDate를 오늘로 옮기지 않는다.                                                       |
| 어제의 계획 변경 취소가 아무 일도 하지 않고 성공 안내                   | 날짜가 달라지면 계획 변경의 취소만 마감하고 이유를 안내한다. 완료·삭제·추가·편집 취소는 유지하면서 오늘 계획을 덮어쓰지 않는다.                                                        |
| 기존 미래 기한을 오늘로 바꿔도 오늘 계획 밖에 남음                      | 다른 기한을 오늘/지난 기한으로 바꾸면 오늘에 포함한다. 사용자가 이어서 직접 해제한 선택은 유지하며 되돌리면 이전 기한·계획을 복구한다.                                                 |

수정 전 L01~L05는 모두 실패했다. [재현 실패 5건](evidence/v1.5/lifecycle-before.txt). 초기에 별도로 발견한 검사 코드 문제(완료 후 사라지는 체크박스의 `check()` 후속 확인, ‘오늘 오늘’이라는 충돌 날짜 입력)와 수동 모드 저장 정책을 잘못 가정한 단언은 테스트 쪽에서 수정했다. 이를 추가 앱 결함으로 세지 않는다.

새 시나리오는 실제 자정 타이머, focus·visibilitychange 복귀, 금요일→다음 주 월요일, 연말, 윤일, 뉴욕 DST의 23시간 하루, 잘못된 날짜의 전체 저장 보류, 미리보기 수정·제외·재정리, 입력 원문 복구, 새로고침, 모두 미루기, 분량 취소, 수동 모드와 날짜를 넘긴 완료·삭제·추가 취소를 다룬다. [시나리오 코드](../tests/e2e/lifecycle.spec.ts).

IAB에서도 오늘·내일·다음 주 메모, 미리보기 중 날짜 변경과 제목 보존, 모바일 확인·저장, 묶음 취소, 기한 변경·취소, 다음 날 완료 취소, 종료 방지, 삭제 취소, 열린 편집창의 새 계획 갱신을 직접 확인했다. [직접 조작 관찰](evidence/v1.5/lifecycle-ui.json) · [자정의 메모](screenshots/v1.5/lifecycle-midnight-mobile.jpg) · [다음 날 완료 취소 후 종료 방지](screenshots/v1.5/lifecycle-undo-guard.jpg) · [열린 편집창](screenshots/v1.5/lifecycle-editor-rollover.jpg).

최종 타입·ESLint·production build, 단위 **112개**, 서울/뉴욕 각각 **88개**, 전체 브라우저 **139개** 통과. 브라우저 실패·건너뛰기·flaky는 0이다. [기본 검사](evidence/v1.5/lifecycle-check.txt) · [전체 브라우저](evidence/v1.5/lifecycle-e2e.txt) · [결과 요약](evidence/v1.5/lifecycle-validation.json). 한국어 추출 목록과 동작 문서를 갱신하고 ai-practice의 개인용 앱 사본을 대조한다. 손글씨·원격 저장소·배포는 변경하지 않는다.

한계: Chrome/IAB와 모사한 날짜·조합 이벤트·화면 크기 기준이다. 실제 기기의 한국어 키보드, Safari/Firefox, 장기간 사용, 사람 대상 만족도는 검증하지 않았다. 이전 공개 배포·Pages 경로 검사는 이번 변경의 결과로 합산하지 않는다.

## 새 오늘 기한 누락·잘못된 종료 안내 수정 · 2026-11-20

사용자가 오늘·내일·다음 주 메모를 담은 뒤 기존 계획만 끝냈는데 마무리 안내가 뜬다고 제보했다. 이전 구현은 새 오늘 기한도 계획 밖에 남겼고, 종료 여부도 고정 계획만 확인했다. 앞선 페르소나 검수와 회귀 테스트가 이 동작을 정상으로 판단한 것은 잘못이었다.

- 수정 전 새 회귀 2개는 모두 실패했다. 새 오늘 일 추가 후 계획이 3→4가 되지 않았고, 계획 밖에 오늘 일이 있는데 완료 제목이 표시됐다. [실패 재현](evidence/v1.5/due-today-before.txt)
- 새 입력 중 오늘/지난 기한만 기존 계획에 자동으로 넣는다. 내일·다음 주·무기한은 기존 계획을 늘리지 않는다. 처음 계획을 만들 때도 입력한 오늘 기한은 상한과 관계없이 모두 포함한다.
- 현재 계획 안에서는 기한이 급한 순서로 표시한다. 완료·삭제 자체로 다른 항목을 채우지는 않는다. 일괄 추가를 되돌리면 목록과 이전 계획을 함께 복구한다.
- 이전 저장본·수동 제외로 오늘 기한이 계획 밖에 남아 있으면 종료 대신 남은 기한을 안내하고, 해당 항목만 오늘에 넣어 이어서 할 수 있다.
- 실제 IAB에서 예시 입력→계획 4개→새 오늘 일 표시, 일부러 오늘 일을 제외한 상태의 잘못된 종료 방지, 복구 후 4/4 종료를 확인했다. 데스크톱 1366×768와 모바일 390×844로 확인했다. [실제 조작](evidence/v1.5/due-today-ui.json) · [새 오늘 일](screenshots/v1.5/due-today-included.jpg) · [종료 방지](screenshots/v1.5/due-today-guard.jpg)

최종 타입·ESLint·production build, 단위 **112개**, 서울/뉴욕 각각 **88개**, 전체 브라우저 **123개**가 통과했다. 브라우저 실패·건너뛰기·flaky는 0이다. [기본 검사](evidence/v1.5/due-today-check.txt) · [전체 브라우저](evidence/v1.5/due-today-e2e.txt) · [재현과 최종 결과](evidence/v1.5/due-today-validation.json). README의 체험 순서와 실제 정책도 함께 갱신했다. ai-practice 사본은 바이트 대조로 반영하며 배포·push는 보류한다.

## 페르소나 체험 후 보완 · 오늘 기한 수정 전 · 2026-11-20

교수·학생·잦은 계획 변경·작은 화면의 네 가상 관점으로 같은 에이전트가 실제 로컬 앱을 조작했다. 행동 연결 분리, 반복 문장의 날짜 보존, 첫 계획 안내, 예시의 원문 덮어쓰기 등 네 문제를 수정했다. [페르소나별 관찰·수정·한계](SYNTHETIC_BETA_V1_5.md).

최종 타입·lint·production build와 단위 **108개**, 서울/뉴욕 각각 **84개**, 전체 브라우저 **121개**를 통과했다. 브라우저 실패·건너뛰기·flaky는 0이다. [기본 검사](evidence/v1.5/persona-check.txt) · [브라우저](evidence/v1.5/persona-e2e-root.txt) · [결과 요약](evidence/v1.5/persona-validation.json) · [수정 후 UI](evidence/v1.5/persona-ui-retest.json).

배포·원격 CI는 실행하지 않았다. 아래의 Pages 하위 경로 18개와 제출 폴더 101개 검사는 이 보완 이전 개편안의 결과다. 최신 제출 사본은 원본과 바이트 대조로 동기화를 확인한다.

## 개편안 최초 로컬 검토 · 페르소나 보완 전 · 2026-11-20

이번 개편은 `codex/v1.5-automation-review`의 로컬 변경이다. 사용자 승인 전이라 원격 CI·GitHub push·Pages 배포를 하지 않았다. 아래 최초 공개 결과를 새 개편안의 검증 결과로 간주하지 않는다.

- 타입·ESLint·단위 101개, 서울·뉴욕 시간대 각각 77개와 production 빌드 통과.
- 한국어 메모의 항목 분리·날짜 경계·부정 표현·원문 보존·100개 제한, 고정 계획의 완료/삭제/추가 후 불변, 계획/할 일 되돌리기를 검사했다.
- 첫 전체 브라우저 실행은 97 통과 / 22 실패였다. 새 자동화 16개는 통과했고, 실패는 이전 문구·버튼/Tab 위치·완료만 되돌리던 이전 기대를 사용하는 회귀 테스트에서 나왔다. 새 의미에 맞게 테스트를 수정했으며 건너뛰거나 제거하지 않았다. [첫 실행 기록](evidence/v1.5/review-first-test-summary.json)
- 실제 IAB 화면에서 한국어 메모 3개 정리·속성 수정·일괄 저장·원문 되돌리기, 3/3 완료 후 종료, 데스크톱/모바일 배치를 확인했다. 긴 미리보기는 상세 속성을 접고 좁은 화면에서 결과로 이동하도록 개선했다.
- 구현 검토에서 복원 직후 이전 Task 목록으로 계획을 고르던 문제와 편집 창의 오늘 선택/자동 계획 불일치를 수정했다. 별도 브라우저 회귀를 추가했다.
- 한국어 문구는 [전체 추출 목록](evidence/v1.5/korean-copy.json)과 실제 화면을 대조했다. 목록에는 동적 문장의 조각과 인식 어휘도 포함한다.

| 최종 검사                    | 결과                                                                      |
| ---------------------------- | ------------------------------------------------------------------------- |
| 타입·ESLint·production build | 통과                                                                      |
| 단위 테스트                  | 101개 통과                                                                |
| 날짜·자동화 경계             | 서울·뉴욕 각각 77개 통과                                                  |
| 전체 루트 경로 브라우저 회귀 | 119개 통과, 실패·건너뛰기 없음                                            |
| 로컬 `/focusday/` 하위 경로  | 새 자동화 16개 + 모바일·접근성 2개, 총 18개 통과                          |
| 하위 경로 정적 자산          | HTML·JS·CSS·favicon HTTP 200, JS·CSS·favicon이 검사한 빌드와 SHA-256 일치 |
| 실제 IAB 화면                | 1366×768와 390×844에서 확인, 3/3 종료 후 되돌리면 2/3으로 복구            |

전체 119개 통과 뒤 모바일 결과 위치·짧은 체험 문구·같은 값의 CSS 토큰 참조를 다듬었다. 최종 파일에서 표준 검사와 하위 경로 18개를 다시 통과했고, 실제 화면도 다시 확인했다. 하위 경로 검사는 로컬 preview이며 공개 배포 결과가 아니다.

[최종 기본 검사](evidence/v1.5/review-check.txt) · [전체 브라우저](evidence/v1.5/review-e2e-root.txt) · [하위 경로 브라우저](evidence/v1.5/review-e2e-pages.txt) · [하위 경로 자산](evidence/v1.5/review-pages-assets.json) · [결과 요약](evidence/v1.5/review-validation.json).

`ai-practice/개인용 할 일 관리 애플리케이션`에 동일 파일을 반영한 뒤 한글·공백 경로에서 `pnpm check`도 통과했다. 타입·lint·단위 101개·서울/뉴욕 각각 77개·production build를 확인했다. [제출 사본 검사](evidence/v1.5/review-submission-check.txt). 손글씨 프로젝트 26개 파일은 변경 전후 SHA-256이 같고 Git 변경도 없다.

검수 화면: [데스크톱](screenshots/v1.5/review-desktop.jpg) · [모바일](screenshots/v1.5/review-mobile.jpg) · [모바일 메모 확인](screenshots/v1.5/review-memo-mobile.jpg) · [오늘 분량 종료](screenshots/v1.5/review-finished.jpg).

물리 스마트폰·실제 OS IME·스크린 리더·사람 대상 평가·공개 서버 검증은 이번 개편에서 수행했다고 주장하지 않는다.

## 최초 공개 v1.5.0 검증 기록 · 개편 전

2026-11-20 KST. 아래 과거 공개 앱 소스 기준은 `77334d5c9f863c450aa9b750b81dc0440f1631a9`이다. v1.4 이하 기록도 당시 자료로 보존한다.

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
