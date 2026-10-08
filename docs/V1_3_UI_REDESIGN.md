# Focusday v1.3 UI 교체

2026-10-08 KST. 사용자가 확정한 노션 작업 화면 방향을 실제 React 앱 전체에 적용했다. 시작은 깨끗한 main `7849237`/앱1.2.0이며 원격도 동일했다. 앱1.3.0, 저장 key `focusday:v1`/data `version:1`을 유지한다.

## 기존 문제와 참조

기존 화면은 푸른 회색 배경, 보라 강조, 88px 최소 행과 둥근 목록 카드로 영역을 나눴다. 작업 페이지보다 여러 카드가 쌓인 화면에 가까웠고, 모바일 집중 조작은 아이콘만 보였다. 노션 공식 Tasks 작업 화면의 breadcrumb·페이지 제목·hairline·작은 속성 태그·조용한 탐색을 기준으로 바꿨다.

getdesign.md의 분석/preview와 awesome-design-md를 직접 열어 확인했으나 제3자 해석과 마케팅 표현을 구분했다. 노션 공식 Projects와 Projects & Tasks 가이드의 실제 작업 화면을 대조했고, 가이드의 Tasks 이미지를 브라우저에서 확대해 보았다. serif/64px 표제, 가격 카드, pill CTA와 일러스트는 적용하지 않았다. 이름·로고·독점 이미지·외부 폰트도 가져오지 않았다. [직접 확인한 6개 참조와 적용 결정](../DESIGN.md).

## 실제 변경

- 232px 회색 sidebar에 작은 Focusday, 실제 검색 진입, 오늘/전체 개수, 직접 백업과 앱 메뉴. 선택은 중립 회색 표면.
- 흰 작업 페이지와 최대1040px 본문. 제목36px/모바일30px, 시스템 sans-serif, 한글 음수 자간 없음. 제목/날짜 → 실제 집중 요약 → 검색/목록 도구 → 빠른 입력 → 기존 그룹.
- 기본56px 목록 행, 그림자/카드 외곽 제거. 큰 화면은 제목 옆 속성, 좁은 화면은 아래 재배치. 제목2/3줄과 전체 편집 이름/textarea. 기한·우선순위·24자 분류·예시·집중 상태를 모두 보존.
- “오늘 집중” 상태와 “집중하기/집중 해제” 조작을 구별. 모바일도 조작 텍스트가 항상 보이며 task별 이름과 `aria-pressed`, 44px 독립 조작 영역.
- 빠른 입력의 sticky를 제거했다. 성공한 Enter/버튼 입력은 동일 창의 빈 값/포커스를 유지한다. N·/ 실제 단축키, 입력/모달 차단과 IME 보호 유지.
- 계획/편집/백업은 동일한 우측 panel과 mobile sheet. 편집은 큰 제목과 라벨/값 속성 행, 저장·취소·삭제 footer와 내부 스크롤. 초안/취소/Escape/줄바꿈 의미 유지.
- 미리보기/합치기/교체 확인/완료/실패, 앱 메뉴, empty/search/undo/저장 보호를 동일 토큰으로 재디자인. 복원 오류가 스크롤 밖에 남는 실제 관찰을 수정해 오류에 초점/스크롤을 옮긴다.

## 실제 화면 비교

같은 체크아웃에서 격리 Chrome context의 합성 데이터로 촬영했다. 고정 fixture와 OS IME 이벤트를 제품 초기값에 넣지 않았다. Before는 이번 시작1.2.0의 실제 렌더링이며 과거 자료를 재사용하지 않았다.

| 상태          | Before                                              | After                                              |
| ------------- | --------------------------------------------------- | -------------------------------------------------- |
| 1440×900 오늘 | [이전](screenshots/v1.3/before/today-1440x900.png)  | [교체](screenshots/v1.3/after/today-1440x900.png)  |
| 390×844 오늘  | [이전](screenshots/v1.3/before/today-390x844.png)   | [교체](screenshots/v1.3/after/today-390x844.png)   |
| Desktop 편집  | [이전](screenshots/v1.3/before/editor-1440x900.png) | [교체](screenshots/v1.3/after/editor-1440x900.png) |
| 320×568 계획  | [이전](screenshots/v1.3/before/plan-320x568.png)    | [교체](screenshots/v1.3/after/plan-320x568.png)    |
| 320×568 복원  | [이전](screenshots/v1.3/before/restore-320x568.png) | [교체](screenshots/v1.3/after/restore-320x568.png) |

![실제 v1.3 desktop](screenshots/v1.3/after/today-1440x900.png)

[320px 긴 제목/분류](screenshots/v1.3/after/long-320x568.png) · [768px tablet](screenshots/v1.3/after/today-768x1024.png) · [작은 높이 편집](screenshots/v1.3/after/editor-390x480.png) · [검색 없음](screenshots/v1.3/after/no-results-320.png) · [후보 없음](screenshots/v1.3/after/plan-empty-320.png) · [교체 확인](screenshots/v1.3/after/replace-confirm-320.png) · [복원 실패](screenshots/v1.3/after/restore-failure-320.png) · [저장 보호](screenshots/v1.3/after/storage-protection-320.png).

## 검수와 수정 근거

8개 viewport(명세6개 +720×450 동등 reflow +390×480 작은 높이)의 본문/계획/편집/긴 제목/전체/파일/미리보기를 촬영하고 geometry와 직접 시각 검토를 병행했다. [before](evidence/v1.3/before-visual.json)/[after](evidence/v1.3/after-visual.json)의 동일 데스크톱 예시 행은 약93–94px →56.8px. 가로 overflow·실행 오류가 없다. 1024px에서는 정보 보존을 위해 메타가 제목 아래로 내려가 행이 자연스럽게 커진다.

발견/수정:

1. 모바일 계획 설명이 버튼 옆의 좁은 열에 남음 → 설명을 한 줄 폭으로 두고 버튼을 다음 줄로 이동.
2. 첫 회귀가 속성12px를 기존13px 가독성 기준 위반으로 검출 → 13px로 복구. 테스트 기준을 내리지 않음.
3. 새 요약 표제와 행 상태의 “오늘 집중” locator가 중복 → 행 상태를 의미 범위 안에서 검증. 데이터/동작 assertion 유지.
4. minify된 `#fff`를 6자리 전용 대비 함수가 잘못 계산 → 3자리 확장 후 실제 토큰 조합 검증. 4.5/3 기준 유지.
5. 검색 버튼에 / 힌트가 accessible name에 포함됨 → 명확한 “검색” 이름. 새 직접 백업과 메뉴 백업은 호출 범위를 명시.
6. 작은 패널의 복원 실패 메시지가 화면 밖에 남음 → 오류로 초점/스크롤, 기존 merge/replace 실패 회귀에 실제 focus/viewport 검사 추가.

[첫 실행72 PASS/8 FAIL](evidence/v1.3/root-first.json), [수정 후80 PASS](evidence/v1.3/root-second.json), 이후 오류 초점 보완의 최종 실행은 [최신 검증](validation.md)과 원본에 구분한다. skip/삭제/기준 약화는 없다.

## 기능과 데이터 보존

`src/domain.ts`, `storage.ts`, `backup.ts`, 날짜/visualViewport hook과 lockfile은 변경하지 않았다. 기존71개 회귀에 추가9개로 sidebar 검색/직접 백업/초점 복귀·aria-pressed·7개 폭의 긴 정보/독립 타깃/내부 스크롤·필수 경계 대비를 확인한다.

미래 기한+오늘 집중, 오늘 기한+집중 해제 잔류, 어제 수동 이어가기의 id/기한, 그룹/검색/완료/undo pause, 초기 읽기/손상 보호/메모리 쓰기 실패, 10MiB UTF-8 전체 compact 백업/재가져오기/id 합치기/확인 교체/실패 보호, restore 후 오래된 검색·undo 정리, 자정·키보드·composition 동작의 기존 assertion을 유지했다.

물리 스마트폰·실제 가상 키보드·OS 한글 IME·native200% zoom·스크린 리더·Safari/Firefox·사람 사용자 연구는 미실행이다. Chrome 에뮬레이션/축소 viewport/합성 이벤트/이름·대비·keyboard 검사를 이들과 구분한다. [검증 범위](validation.md) · [배포 결과](deployment.md) · [AI 개발 기록](ai-workflow.md).

## GitHub와 실제 공개 완료

기존 main에 정상 push하고 수동 Pages를 실행했다. ec67a2c 소스의 CI/Pages는 둘 다 success, 원격 Chromium도 각각80 passed다. 공개 버전1.3.0·자산200·desktop/mobile 핵심 조작·계획/복원·6000개 전체 다운로드/재선택 미리보기를 PASS로 확인했다. [원격 증거](evidence/v1.3/github-actions.json) · [공개 실행](evidence/v1.3/live-deployment.json) · [실제 공개 화면](screenshots/v1.3/live-desktop.png). 최종 출시 문서의 앱 소스는 이 검증된 소스와 같다. 기존 태그/원격/보호 규칙을 유지한다.
