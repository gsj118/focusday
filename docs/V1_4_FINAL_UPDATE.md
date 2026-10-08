# Focusday v1.4.0 최종 업데이트

2026-10-08 KST. v1.3.0 main `80748d6`에서 시작해 기존 노션 작업 UI와 로컬 데이터/백업을 유지하며 세 기능을 실제 구현했다. [명세 원문](ai-prompts/10-v1.4-final-implementation.md) · [실제 요청](ai-prompts/11-v1.4-user-request.md).

## 세 기능의 실제 동작

**오늘의 한 문장.** 오늘 제목 아래 기존 설명 한 줄에서 차분한 문구/유머/내 문장/끄기를 선택한다. 기본은 차분한 문구이고 끄기는 기존 제품 안내를 표시한다. 전체 보기 설명·저장/오류 안내는 유지했다. 창작 콘텐츠는 각12개, 안정적인 id와 종류를 가지며 기기 로컬 달력의 ordinal과 콘텐츠 version1의 고정 순서로 선택한다. 같은 날짜/모드는 새로고침·같은 context 재방문·모드 왕복 후 동일하고 연속 날짜는 다른 문구다. 묶음은12일 뒤 반복될 수 있다. 자정과 focus/visibilitychange는 기존 날짜 hook으로 갱신한다. 로컬 콘텐츠이므로 열린 앱에서 네트워크 없이 표시되며 오프라인 최초 페이지 다운로드/PWA는 지원하지 않는다. [콘텐츠 기록](content-v1.4.md).

설정은 데스크톱·모바일 앱 정보의 “문구와 격려 설정” 한 진입과 작은 접근 가능한 panel/sheet다. 초안은 저장 성공 후 적용하고 취소/닫기/Escape는 미저장 초안을 버린다. 저장 후 패널이 열린 상태에서 더 수정할 수도 있다. 내 문장은 trim 후1–120개 Unicode code point를 허용하며 구체적인 공백/길이 오류와 현재 글자 수를 표시한다. textarea Enter는 줄바꿈이며 composition Enter는 보호한다. React text로 렌더링해 HTML 문자열도 글자로 보인다. 긴 한글/영문은 줄바꿈하고320px에서도 가로 넘침이 없다.

**오늘의 성취 기록.** “오늘 마친 일 N개”를 오늘 목록 아래 기본 접힘으로 제공한다. 현재 데이터에 남아 있는 `!isDemo && completedAt !== null && localDate(new Date(completedAt)) === today`만 포함한다. 전체에서 완료한 일과 집중/기한 없는 일도 포함하고 어제 완료·예시는 제외한다. 기한/focusDate/검색은 총개수에 영향을 주지 않는다. 정렬은 최근 완료 timestamp → id이며 펼치면 제목·로컬 완료 시각·기존 속성이 보인다. 미완료 복원은 기존 toggle 함수를 사용하고 마지막 행은 summary로, 다음 행이 있으면 그 체크박스로 초점이 돌아간다. 날짜 변경으로 행이 사라져도 summary로 복귀한다. 0개는 “오늘 마친 일이 여기에 모입니다.”이다.

완료 취소/삭제는 즉시 제외하고 삭제 undo는 복원한다. 성공한 merge/replace 뒤에는 적용된 task에서 재계산하며 실패한 복원은 원본·메모리·성취를 유지한다. 이 수치는 영구 누적 기록이 아니라 현재 목록 기준이다. 기존 전체 완료 목록에는 이전 날짜·예시도 계속 보인다.

**완료 순간의 격려.** 기본 켜짐, 문구 모드와 별도로 끌 수 있다. 실제 사용자가 비예시 항목을 미완료→완료로 바꾸는 handler에서 전후 오늘 수를 비교한다. 0→1과2→3만 후보이고 날짜별 각 한 번 처리한다. 꺼진 동안 통과한 시점도 처리한다. 예시 완료/초기 load/refresh/날짜 변경/import/replace/삭제 undo는 발생시키지 않는다. 가져오기 뒤2개에서 직접3개를 마칠 경우 아직 처리되지 않은3개 시점이면 발생한다.

기존 UndoToast의 status에 한 문장을 통합했다. 첫/3개 외에는 일반 완료 안내다. 유머 모드만 유머 격려이며 내 문장/끄기는 차분한 기본 격려다. undo 대상은 최근 행동 한 건이고8초·hover/키보드 pause·완료 목록 행동을 유지한다. 빠른 연속 완료는 이전 toast를 교체하고 undo/미완료 복원/현재 수 또는 날짜가 달라지면 과거 숫자 격려가 남지 않는다. 추가 toast/modal/소리/진동/축하 애니메이션은 없다.

## 저장과 보존 경계

| 저장 대상                                         | key / version                         | 백업                                         |
| ------------------------------------------------- | ------------------------------------- | -------------------------------------------- |
| 전체 할 일·완료·예시·모든 Task 속성               | 기존 `focusday:v1` / AppData version1 | 기존 formatVersion1, compact UTF-8 최대10MiB |
| 문구 모드·내 문장·격려 여부·날짜별1/3 처리 표지만 | `focusday:ui:v1` / UI version1        | 제외. 이 브라우저에만 저장                   |

task/schema/backup validator/lockfile/의존성은 변경하지 않았다. v1.3에 설정이 없으면 읽기만으로 기본값을 사용한다. 손상/미지원 UI 설정도 자동 쓰기 없이 보호하며 패널에서 다시 읽기·명시적 설정만 초기화를 제공한다. 설정 실패는 초안을 유지하고 task 저장 상태를 바꾸지 않는다. 격려 표지 쓰기 실패에도 실제 완료/undo와 세션 중복 방지는 작동한다. 새로고침 뒤 표지 중복 방지는 저장 성공에 의존하며 B06에서 이 한계를 실제 재현했다. 표지 재시도는 완료 행동을 재실행하지 않는다.

전체 할 일 backup은 내 문장/설정을 포함하지 않는다. 과거 v1 파일, id 합치기, 전체 교체 확인, 저장 성공 후 적용/실패 원본 보호,10MiB 동일 한도를 재검증했다. merge/replace는 현재 UI 설정/처리 표지를 유지한다. 다중 탭 동시 쓰기·기기 간 설정 이동은 지원하지 않는다.

## 실제 전후와 최종 수정

| 상태                  | 실제 v1.3 시작                                       | 실제 v1.4                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 같은 fixture 오늘1440 | [Before](screenshots/v1.4/before/today-1440x900.png) | [After](screenshots/v1.4/after/today-1440x900.png)                                                                                                                                                         |
| 같은 fixture390       | [Before](screenshots/v1.4/before/today-390x844.png)  | [After](screenshots/v1.4/after/today-390x844.png)                                                                                                                                                          |
| 설정                  | 신규                                                 | [Desktop](screenshots/v1.4/features-second/settings-1440x900.png) · [320](screenshots/v1.4/features-second/settings-320x568.png)                                                                           |
| 문구/성취/격려        | 신규                                                 | [유머](screenshots/v1.4/features-second/humor-1440x900.png) · [성취](screenshots/v1.4/features-second/achievements-1440x900.png) · [격려/undo](screenshots/v1.4/features-second/encouragement-320x568.png) |

노션 토큰·빠른 입력 위치·그룹·속성·기한/집중 분리·패널·모바일 탐색을 유지했다. 동일 기본 데스크톱 행은 전후 모두56.8px이며 한 줄 문구가 큰 카드를 추가하지 않는다. 실제 촬영은 명세6 viewport +720×450 동등 reflow +390×480 작은 높이이며320×400에서 설정 footer도 검사했다.

발견한 제품 결함3건: 태블릿 설정 시트 폭(SB14-01), 적용 설정 재시도와 미저장 초안을 혼동하는 안내(SB14-02), 접힌 성취 행에 완료 후 초점을 시도하는 회귀(SB14-03). 모두 재현/원인/수정/재검증을 [실제 발견 기록](evidence/v1.4/findings.md)에 연결했다. 테스트의 오류 후 버튼 이름·새 Tab 정지·미완료 DOM 범위도 의미를 유지해 갱신했다. [Synthetic Beta](SYNTHETIC_BETA_V1_4.md) · [Case 결과](SYNTHETIC_BETA_CASES_V1_4.md) · [최종 검증](validation.md) · [배포](deployment.md).

최종 check는 단위60·서울/뉴욕각36·타입/lint/build PASS, 로컬 root/Pages E2E각103 PASS다. 정상 push 후 GitHub CI/수동 Pages도각103 PASS·deploy success이며 공개 Chrome desktop/mobile의 기존 기능·세 기능·백업 재검증도 모두 PASS했다. [원격 실행 근거](evidence/v1.4/github-actions.json) · [공개 실행 근거](evidence/v1.4/live-deployment.json) · [공개 모바일 격려/undo](screenshots/v1.4/live-mobile-encouragement.png). 알려진 중대한 미해결 문제는 없다.

가상 관점은 AI 설계 가설이며 사람12명을 모집한 연구가 아니다. 완료/초점/저장/오류/시계·실제 screenshot은 도구 실행 근거다. 물리폰/실제 가상 키보드/OS IME/native zoom/스크린 리더/Safari·Firefox/사용자 만족도·사람 과업 시간은 NOT_RUN이다.
