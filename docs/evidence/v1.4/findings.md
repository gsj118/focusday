# 실제 첫 실행 → 수정 → 재검증

2026-10-08 KST. 첫 Beta는 구현 소스 `4b091f7`의 production 앱에서 실행했다. [17개 실행 원본](beta-first.json)은 **15 PASS / 2 FAIL**, [24개 완료 단계 관찰](beta-first-compact.json)은 PASS이고 실패한 P03-02/P12-03은 원본 실패·trace·자동 screenshot에 남았다. 이를 전체 PASS로 바꾸지 않았다. 별도 첫 화면 검수 [features-first.json](features-first.json)은 8 viewport에서 overflow/실행 오류0, 시트 폭 두 조건과 재시도 안내 한 조건 FAIL이다.

| ID | 재현 / 기대 → 실제 | 원인·수정 | 재검증 |
| --- | --- | --- | --- |
| SB14-01 | 768×1024 또는720×450에서 설정 열기. 기존 모바일 sheet는 전체 폭 → 설정만440px, 왼쪽의 좁은 sheet | 마지막 preferences CSS의 고정 폭이 모바일 규칙을 덮음. 899px 이하100% 적용 | [첫768](../../screenshots/v1.4/features-first/settings-768x1024.png) → [수정768](../../screenshots/v1.4/features-second/settings-768x1024.png), [동일8조건](features-second.json), B07 PASS |
| SB14-02 | 초안 유머 → 설정 쓰기 실패 → 저장 권한 회복 → 오류 영역 재시도. 적용 설정은 calm, 초안은 humor → “설정을 저장했습니다.”로 초안까지 적용된 듯한 안내 | 오류 재시도는 적용 설정/격려 표지만 저장하는데 일반 저장 성공 문구를 재사용. 적용 설정과 미저장 초안을 명확히 구분하고 성공 안내도 스크롤 안에서 보이게 함 | [첫 상태](../../screenshots/v1.4/features-first/settings-retry-draft-320.png) → [수정](../../screenshots/v1.4/features-second/settings-retry-draft-320.png), [값·문구](features-second.json), B07 PASS |
| T14-01 | P03 공백 오류 뒤121자 입력, P12 복원 쓰기 실패 뒤 재시도. 실제 버튼 이름을 따라가야 함 → 테스트가 이전 “설정 저장 재시도”/“합치기 적용” 이름을 기다려 timeout | 제품 데이터 오류가 아닌 새 테스트 locator 문제. 설정 footer의 저장 행동 범위와 복원 “합치기 다시 시도”를 정확히 선택. 120/121/HTML/composition·실패 원본/성취/초점 assertion 유지 | [첫 원본](beta-first.json) / [실패 화면·trace](first-failures/), [두 번째22 PASS](beta-second.json) |
| T14-02 | timeout 뒤 관찰 수집. 최초 오류가 유지되어야 함 → finally의 page.evaluate가 이미 닫힌 page 오류로 덮음 | 수집 실패를 INCONCLUSIVE로 남기고 원래 test 오류를 유지. action timeout5초로 진단·캡처 시간을 확보. 판정 기준/테스트 timeout을 완화하지 않음 | 두 번째/최종 단계 첨부에 실제 UI/저장/초점/시계와 screenshot 기록 |

추가 검토 보완: 일반 UTC CI에서 날짜 unit fixture를 서울/뉴욕 고정 fixture와 구분했다. 실제 두 시간대 실행은 각각36개이며 자정 경계 assertion을 유지한다. 첫 P04는390 viewport 조건, 최종 P04는 isMobile/hasTouch context의 tap 완료/undo로 확장했다. OS 키보드·물리폰·OS IME 결과로 표현하지 않는다.

[수정 후 Beta](beta-second.json): 22 PASS/FAIL0/skip0. [수정 후 실제 화면 검수](features-second.json): 실패 관찰0, overflow0, 실행 오류0. 이후 최종 전체 root/Pages 결과는 [검증 기록](../../validation.md)에 연결한다. 이 문서는 실제 발견 뒤에 작성했고 가짜 결함·조사 소감·과거 실행 날짜를 만들지 않았다.
