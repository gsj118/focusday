# Synthetic Beta v1.2 — 53개 행동 결과

이 평가는 AI가 구성한 가상 사용자 관점과 실제 앱 조작/자동화 검증을 결합한 Synthetic Beta다. 실제 사용자 모집·인터뷰·만족도·사용자 과업 시간 측정은 수행하지 않았다.

PASS는 명시된 브라우저/데이터 조건의 실제 assertion 통과다. 물리 휴대폰·OS IME·native 확대·스크린 리더·전체 WCAG는 NOT_RUN이며 해당 하위 조건을 PASS로 간주하지 않는다. 상세 scope는 각 JSON case에 있다. 단위 검사만으로 UI PASS를 부여하지 않았다.

[12개 연결 세션·환경·가설](SYNTHETIC_BETA_V1_2.md) · [수정 전 상세 근거](evidence/v1.2/cases-before.json) · [수정 후 상세 근거](evidence/v1.2/cases-after.json)

구조화 기록은 Case/Persona ID, 시각·source commit, fixture, 초기/최종 raw hash 또는 테스트의 명시적 저장 assertion, 행동·기대·실제 결과·문제 ID를 연결한다. 공통 검사는 기존 테스트의 정확한 이름과 실제 실행 결과를 재사용한다.

| Case | 실제 행동                                                   | v1.1 | v1.2 | 관점     |
| ---- | ----------------------------------------------------------- | ---- | ---- | -------- |
| A01  | 빈 앱에 진입하고 입력 시작                                  | PASS | PASS | P01      |
| A02  | 오늘에서 “자료구조 과제 제출”을 입력하고 Enter 1회          | PASS | PASS | P01      |
| A03  | 전체에서 “주말 장보기”를 입력하고 Enter                     | PASS | PASS | P02      |
| A04  | 5개 제목을 연속으로 입력하고 각각 Enter                     | PASS | PASS | P02      |
| A05  | 같은 조건에서 추가 버튼과 Enter를 각각 사용                 | PASS | PASS | P02      |
| A06  | 빈 문자열/공백만 입력한 뒤 Enter와 추가                     | PASS | PASS | P02, P11 |
| A07  | 앞뒤 공백이 있는 제목 제출                                  | PASS | PASS | P12      |
| A08  | 199자·200자·201자 입력/붙여넣기                             | PASS | PASS | P02      |
| A09  | 제출 직후 Enter를 다시 누르거나 빠르게 추가/Enter           | PASS | PASS | P02      |
| A10  | 한글 조합 중 Enter, 조합 완료 후 제출                       | PASS | PASS | P12      |
| A11  | 제목 입력 중 N·/·Escape, 검색 중 Enter                      | PASS | PASS | P12      |
| A12  | 모바일 입력의 Enter/완료/이동 조건                          | PASS | PASS | P04      |
| B01  | 제목을 눌러 상세 편집 열기                                  | PASS | PASS | P01      |
| B02  | 초안 여러 필드 수정 → 취소/Escape/닫기                      | PASS | PASS | P01, P03 |
| B03  | 제목·기한·우선순위·분류 수정 후 저장                        | PASS | PASS | P12      |
| B04  | 상세 제목 textarea에서 Enter                                | PASS | PASS | P03      |
| B05  | 날짜/분류 필드·저장 버튼에서 Enter/Space                    | FAIL | PASS | P12      |
| B06  | 미래/오늘/과거 기한, 기한 해제, 잘못된 날짜 조건            | PASS | PASS | P12      |
| B07  | 분류 없음·24자·초과·공백만, 우선순위 네 종류                | PASS | PASS | P05      |
| B08  | 날짜 입력이나 상세 패널을 열고 좁은 화면에서 저장/취소      | PASS | PASS | P06      |
| C01  | 기한 초과/오늘 기한/어제/높음 후보 패널 열기                | PASS | PASS | P08      |
| C02  | 후보의 집중하기/집중 해제를 연속 사용                       | PASS | PASS | P07      |
| C03  | 오늘/과거 기한 항목 집중 해제                               | PASS | PASS | P07      |
| C04  | 미래 기한 항목을 오늘 집중으로 선택 후 해제                 | PASS | PASS | P07      |
| C05  | 어제 미완료/완료/이틀 전 항목을 함께 준비                   | PASS | PASS | P07      |
| C06  | 어제 항목을 선택해 오늘 이어가기                            | PASS | PASS | P07      |
| C07  | 계획 패널 열린 상태에서 자정·focus·visibility 변경          | PASS | PASS | P08      |
| C08  | 후보 없음 → 전체 이동, 이미 집중 중인 항목 확인             | PASS | PASS | P08      |
| C09  | 제목·분류 검색, 결과 없음, 검색 삭제, 보기 변경             | PASS | PASS | P08      |
| C10  | 검색 중 계획 열기/닫기·복원 성공 후 목록 확인               | PASS | PASS | P08      |
| D01  | 완료 → 실행 취소 → 새로고침                                 | PASS | PASS | P01      |
| D02  | 완료 영역에서 복원, 검색 중 완료/복원                       | PASS | PASS | P04      |
| D03  | 삭제 → 실행 취소                                            | PASS | PASS | P09      |
| D04  | 알림 hover/포커스 → 이탈, 연속 다른 완료/삭제               | PASS | PASS | P09      |
| D05  | 편집/계획/복원 이후 오래된 실행 취소 시도                   | PASS | PASS | P09      |
| D06  | 예시 추가 → 재추가 → 사용자 항목과 함께 예시 제거           | PASS | PASS | P09      |
| E01  | 미완료·완료·예시·모든 속성 포함 백업                        | PASS | PASS | P10      |
| E02  | 백업 → 빈 격리 환경 복원 → 재백업 비교                      | PASS | PASS | P10      |
| E03  | 파일 선택·미리보기·취소·같은 파일 다시 선택                 | PASS | PASS | P04      |
| E04  | 같은 id 같은/다른 내용, 다른 id 같은 제목 합치기            | PASS | PASS | P10      |
| E05  | 전체 교체 진입 → 교체 전 백업 → 취소/명시적 교체            | PASS | PASS | P10      |
| E06  | 손상 JSON·다른 형식/버전·중복 id·잘못된 필드/날짜·크기 초과 | PASS | PASS | P10      |
| E07  | 합치기/교체의 실제 쓰기 실패와 재시도                       | PASS | PASS | P10      |
| E08  | 읽기 실패/접근 불가/손상 저장 원본에서 복원 시도            | PASS | PASS | P10      |
| E09  | 저장 실패 중 편집 후 백업                                   | PASS | PASS | P10      |
| E10  | 느린 파일 읽기 중 다른 파일 선택/패널 닫기·재열기           | PASS | PASS | P10      |
| E11  | 파일 크기 제한 직전/직후, 대량 자체 백업 재가져오기         | FAIL | PASS | P10      |
| F01  | Tab/Shift+Tab만으로 입력·편집·계획·백업·닫기                | PASS | PASS | P03      |
| F02  | 패널에서 N·/·Enter·Space·Escape                             | PASS | PASS | P03      |
| F03  | 네 viewport에서 긴 제목·분류와 모든 패널                    | PASS | PASS | P05      |
| F04  | touch로 완료/집중/상세/닫기/복원 방식 조작                  | PASS | PASS | P04      |
| F05  | 축소 가시 영역에서 입력·상세·복원 미리보기                  | PASS | PASS | P06      |
| F06  | 확대·reduced motion·색상 외 단서·accessible name 검사       | PASS | PASS | P11      |

E11은 6000개 UI 다운로드/재선택과 순수 7000/20000 데이터·10MiB±1 경계다. 6000개 UI 목록이나 실제 localStorage quota PASS가 아니다. B05의 수정 후 세션은 조합 중/직후 raw 불변을 먼저 확인한 뒤 정상 Enter로 초안을 의도적으로 저장하므로 최종 hash는 달라진다. 초기 hash와 최종 hash가 다르다는 사실만으로 조합 보호 실패로 판단하지 않는다.

720×450 CSS/scale2는 1440×900의 200% reflow 동등 조건이며 실제 브라우저 Ctrl+ 확대는 실행하지 않았다. 모바일 Enter는 touch 환경의 automation 키 이벤트로 검사했다. 실패한 도구 selector/기대값은 제품 결함과 분리해 원본 기록과 재실행을 보존했다.
