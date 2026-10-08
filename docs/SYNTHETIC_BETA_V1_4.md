# Synthetic Beta v1.4 · AI 관점과 실제 앱 실행

2026-10-08 KST. 같은 Codex 세션에서 AI가12개의 서로 다른 관점을 구성하고 실제 Chrome production 앱에서 연결 과업을 수행했다. 별도 사람/모델/subagent 모집·인터뷰·감정·만족도·사람 과업 시간은 만들지 않았다. 관점은 설계 가설이며 PASS는 Playwright의 실제 UI/저장/초점/시계 assertion으로 판정한다.

## 세션과 환경

Windows/PowerShell, Node24.19.0, 실행 pnpm11.25.0(프로젝트11.19.0 고정), React19.3.0/TS5.9.3/Vite8.3.2/Playwright1.63.0/Chrome134.0.6998.36 headless. locale ko-KR. 모두 새 격리 context이며 개인 프로필/실제 목록을 사용하지 않았다. fixture는 테스트 전용이며 앱 초기값에는 넣지 않았다.

주 가상 날짜2026-10-08, P09/P10은 테스트 시계로10-09/10-10을 재현한다. P09는 같은 context의 새 page 재방문도 수행하며 refresh·모드 왕복과 구분한다. 서울/뉴욕 UTC 날짜가 다른 completedAt은 별도 context로 실행한다. 하루 이상 실제 사람이 사용한 시험으로 표현하지 않는다. 기본102/103 같은 수는 테스트 실행 수이며 아래12관점·26단계 Case 수와 다르다.

| ID  | 관점/조건             | 서로 다른 연결 과업과 실제 판단                                                                                                                |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 | 처음 사용, 빈 목록    | 최초 무쓰기/설명·접힌0개 → Enter 입력/계획 → 첫 완료/undo/재완료 → 유머 설정/전체 백업 제외 경계 → reload                                      |
| P02 | 키보드                | 실제 keyboard Enter/Tab/Space → 설정 trap·textarea 줄바꿈/Escape 초안 취소 → 유일한 성취 행 복원 summary 초점 → 백업 닫기/재방문               |
| P03 | 한글 합성 composition | 조합 Enter 무제출 → 연속 입력/분류 편집 → 내 문장 공백/121/120/HTML·조합 무저장 → 저장/reload. OS IME 제외                                     |
| P04 | 390 모바일            | 입력/계획 → 설정44px footer → tap 완료/undo, toast/nav 분리 → sheet 백업 → 유머 재방문. 최종 isMobile/hasTouch                                 |
| P05 | 320·작은 높이         | 200자 제목/24자 영문 분류·기한 →120자 혼합 문장/320×400 footer → 긴 성취 시각/속성 → v1 merge → 재방문                                         |
| P06 | 80개 쌓인 목록        | 검색한 높은 우선순위 후보 집중 → 검색 중 완료/검색 없는 성취 → 전체 무기한 항목 완료 →80개 중복 미리보기/재방문                                |
| P07 | 자주 바꾸는 계획      | 어제 미래 기한 이어가기 id/기한 → 집중 해제/오늘 기한 잔류 → 완료/undo → 전체 미래 일 완료 → 설정 취소/backup/reload                           |
| P08 | 실수 복구             | 0→1→2→3→4 빠른 완료/최신 undo → 미완료 복원/재완료 → 오늘 완료 삭제/undo → reload 뒤 모두 복원/첫 재완료 중복 억제                             |
| P09 | 격려 선호             | 문구 모드 왕복·유머 완료/3개 → refresh/새 page → 열린 앱 offline → 테스트 자정/둘째 날짜 첫 완료 → suspend 상당 focus·visibilitychange         |
| P10 | 조용한 화면           | 문구/격려 둘 다 끄기 → 꺼진 동안1/3 처리 → 켜고 재완료 무소급 → 설정 Escape/reload → 다음 날짜 문구off+차분한 격려                             |
| P11 | 확대·낮은 시력 고려   | 720×450 reflow/reduced motion →121 오류 focus/scroll →120 저장 → 내 문장 기본 격려/성취 복원 summary·접기 → reload                             |
| P12 | 날짜/데이터 보존      | UI 쓰기 실패 초안/적용 분리 →task+표지 쓰기 실패의 메모리 완료/undo → 각각 재시도 →실패 복원 원본/성취 →merge2 뒤 직접3 →replace UI유지/reload |

26단계의 기대·실제·사진은 [Case 표](SYNTHETIC_BETA_CASES_V1_4.md). 추가 B01–B09는 손상/버전/읽기·초기화 실패, 표지 저장 실패의 세션/재방문 경계, 시트·재시도 문구, 날짜·접힌 행 초점 및 초기/import/예시 제외를 검사한다. 기존80개는 빠른 입력·정렬·계획·속성·백업10MiB·undo pause·저장 원본·대비 회귀로 그대로 실행한다.

## 첫 결과와 실제 수정

첫 신규17개 실행은15 PASS/2 FAIL이었다. P03-02와 P12-03은 오류 후 달라진 버튼 이름을 테스트가 기다리면서 timeout했다. 최초 raw/trace를 보존하고120/121·HTML·실패 원본/초점 assertion을 유지해 locator를 고쳤다. 두 번째 신규22개는 모두 PASS다.

별도 첫 화면 검수는8 viewport에서 overflow/실행 오류0이었지만 태블릿 설정 sheet의 폭 두 조건과 재시도 성공 설명 한 조건이 FAIL이었다. 이는 제품 문제2건이며 전체폭 mobile 규칙과 적용 설정/미저장 초안 안내를 수정했다. 동일 조건 재검수는 모두 PASS.

첫 전체 회귀102개는100 PASS/2 FAIL(새 summary Tab 정지·미완료 DOM 범위)이었다. 검사의 의미를 유지해 새 구조로 갱신했다. 이어서 접힌 성취의 숨은 행에 초점이 떨어지는 SB14-03을 별도 B09에서 실제 FAIL로 재현해 수정했다. [재현→수정→근거](evidence/v1.4/findings.md). 최종 check/root103/Pages103 및 공개 결과는 [검증](validation.md)·[배포](deployment.md)에 실제 실행 후 기록한다.

## 해석의 범위

실제 도구가 확인한 것은 작업 결과·집계·저장·오류·focus·geometry·로컬 시계·이미지다. 문구가 사용자 부담을 낮추거나 성취가 재방문을 돕는다는 해석은 **설계 가설**이며 인간 만족도/시간 단축/통계적 UX 개선으로 주장하지 않는다. Chrome CSS reflow·touch emulation·composition 이벤트는 물리폰·OS 키보드/IME/native200% zoom/스크린 리더가 아니다. 이 조건들과 Safari/Firefox·다중 탭·quota/대량 목록 성능·사람 사용자 연구는 NOT_RUN이다.

오프라인 검사는 로컬 문구를 사용하는 이미 열린 앱의 네트워크 차단이다. 오프라인 최초 접속이나 service worker 검증은 아니다.6천개 검사는 read port에서 실제 파일 다운로드/미리보기와10MiB 단위 경계이며 storage quota나6천개 목록 렌더링을 의미하지 않는다. 격려 표지 저장 실패 뒤 refresh 중복 가능성은 숨기지 않고 설정 도움말/검증에 기록한다.
