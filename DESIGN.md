# Focusday design system · v1.4

2026-10-08 KST. 목표는 노션 안의 정돈된 개인 할 일 작업 페이지다. 모든 값은 Focusday의 적용 결정이며 노션 공식 토큰을 추출한 값이 아니다. React/TypeScript/Vite와 일반 CSS, 기존 Icon, 시스템 sans-serif/한글 fallback을 유지한다.

## 직접 확인한 참조

| 자료                                                                                                       | 확인과 적용                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getdesign.md](https://getdesign.md/)                                                                      | DESIGN.md를 색·서체·간격·컴포넌트의 일관된 근거로 사용하는 방식 참고.                                                                                             |
| [Notion 분석](https://getdesign.md/notion/design-md)                                                       | 제3자 독립 분석임을 확인. 따뜻한 중립 표면만 참고하고 serif 표제 제안은 작업 앱에 적용하지 않음.                                                                  |
| [Notion preview](https://getdesign.md/design-md/notion/preview)                                            | 흰 표면·hairline·작은 입력 모서리 참고. 64px 홍보 표제, pill CTA, 가격 카드, indigo hero, sticker 이미지는 제외.                                                  |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)                                        | 브랜드별 분석 모음과 Notion 항목을 확인. 다른 브랜드의 시각 체계를 혼합하지 않음.                                                                                 |
| [Notion Projects 공식](https://www.notion.com/product/projects)                                            | 실제 프로젝트·할 일 작업 화면과 속성 중심 구성을 대조. 마케팅 페이지 레이아웃은 가져오지 않음.                                                                    |
| [Projects & Tasks 공식 가이드](https://www.notion.com/help/guides/getting-started-with-projects-and-tasks) | 본문 및 확대된 Tasks 화면을 브라우저로 직접 확인. 페이지 제목, breadcrumb, 조용한 목록 도구, 얇은 행 구분, 속성 태그를 적용. 협업·보드·필터 기능은 확장하지 않음. |

브라우저에서 공식 가이드의 “Add different views to your tasks database…” 작업 화면을 확대해 검토했다. 노션 이름/로고/이미지/폰트를 앱 자산으로 복사하지 않는다. 추가 CLI 설치 없이 공개 분석과 공식 화면을 확인했다.

## 토큰과 대비

`src/styles.css`의 `:root`가 단일 기준이다.

| 토큰                                                                    | 값 / 역할                                   |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| `--bg`, `--surface`                                                     | #FFFFFF · 본문/패널                         |
| `--sidebar`, `--quiet`                                                  | #F7F7F5 · 탐색/안내                         |
| `--text`                                                                | #37352F · 본문                              |
| `--muted`                                                               | #6B6B65 · 보조 정보/placeholder             |
| `--border`                                                              | #E9E9E7 · 장식 구분선                       |
| `--control-border`                                                      | #8A8A83 · 필수 입력·체크 경계               |
| `--hover`                                                               | #EFEFED · hover/선택                        |
| `--accent`, `--focus`                                                   | #1769B5, #125A9E · 흰 글자 버튼/링크/포커스 |
| `--soft`                                                                | #EAF3FC · 집중 상태                         |
| `--danger`, `--danger-soft`                                             | #9B403A, #FBEEED · 오류/기한 초과           |
| `--radius-sm`, `--radius`, `--radius-panel`                             | 4px / 6px / 8px                             |
| `--space-1..8`                                                          | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px       |
| `--font-xs`, `--font-sm`, `--font-body`, `--font-input`, `--font-title` | 12 / 13 / 15 / 16 / 36px                    |
| `--sidebar-width`, `--page-width`, `--editor-width`, `--panel-width`    | 232 / 1040 / 480 / 520px                    |

일반 목록에 그림자가 없다. 떠 있는 메뉴/패널/toast만 최소 shadow. 작은 사각형 체크와 직사각 태그. 한글에는 음수 자간을 적용하지 않는다. 제목 36px(모바일 30px), 본문 15px/1.5, 보조 12–13px. 입력은 16px. 실제 렌더링 조합별 텍스트 4.5:1, 필수 경계와 focus 3:1 검사. 장식 구분선은 상태/입력을 판별하는 유일한 경계로 사용하지 않는다.

## 화면 구조

- 데스크톱: 232px 회색 sidebar, 작은 Focusday 표식, 검색 진입, 오늘/전체 실제 개수, 하단 백업·앱 정보. 선택은 회색 면과 글자 무게.
- 흰 작업 본문: breadcrumb/실제 저장 상태 → 페이지 제목/날짜/짧은 설명 → 집중/기한 수와 계획 진입 → 목록 도구와 검색 → 입력 행 → 기존 그룹.
- 본문 작업 폭 최대 1040px(내부 콘텐츠 약 944px), 여유 있는 노트북 여백. 본문/그룹을 반복된 둥근 카드로 감싸지 않음.
- 빠른 입력은 목록 위의 명확한 사각 입력 행. sticky를 제거해 작은 높이/확대에서 포커스 가림을 방지. `N`은 해당 입력으로 이동하며 자동 스크롤. Enter/추가의 기존 의미와 포커스 유지.
- 목록은 56px 기본 행, 제목이 길거나 속성이 많으면 자동 확장. 데스크톱에서 제목 옆 속성, 가용 공간 부족 시 아래로 이동. 빈 속성 열을 만들지 않음. 제목 2줄, 모바일 3줄, 전체 접근 가능한 편집 이름과 상세 textarea 유지.

## 컴포넌트와 상태

- 제목 버튼, 44px 체크 조작, 집중 전환은 각각 독립. 기한/우선순위/분류/예시를 숨기지 않음. 읽기 전용 “오늘 집중”과 버튼 “집중하기/집중 해제” 구별. 버튼은 task별 이름·`aria-pressed`.
- 오늘은 기한 초과/오늘, 전체는 미완료/접는 완료. 기존 정렬·검색 의미 그대로.
- 집중 요약은 실제 집중 수/기한만으로 포함된 수/어제 미완료. 계획은 필요한 때만 오른쪽 패널. 이유 태그와 즉시 적용 설명, 빈 후보/해제/저장 오류 동일 표면 체계.
- 상세 편집은 제목이 우선이며 집중·기한·우선순위·분류는 라벨/값 속성 행. native controls와 초안 저장/취소/삭제, Enter 줄바꿈·IME 보호 그대로. 하단 조작은 내부 스크롤 밖에 고정.
- 백업 다운로드·파일 선택·미리보기·합치기·교체 확인·실패/성공은 동일한 panel·hairline·조용한 안내. 교체는 적갈색 경고와 명시적 텍스트.
- 빈 상태는 작은 아이콘/제목/설명/실제 행동. 저장 보호/저장 실패는 alert. undo는 소형 떠 있는 안내와 조작, 기존 pause/expire 규칙 유지.

## 반응형·접근성

900px 미만은 sidebar를 숨기고 오늘/전체 하단 탐색과 상단 앱 메뉴로 모든 기능 제공. 768px 세로 tablet도 이 구조. 좁은 목록은 제목 아래 속성과 항상 보이는 집중 버튼 텍스트. 320px에서는 겹치지 않는 체크/제목/집중 행, 패널 속성 세로 배치. safe-area와 visualViewport는 기존 hook으로 지원.

패널은 desktop 오른쪽, mobile sheet. header/footer는 고정, 내용은 내부 스크롤하며 줄바꿈/최소 폭/`min-height:0` 적용. menu 높이는 viewport에 제한하고 스크롤. 하단 nav/toast는 visualViewport 하단과 safe-area에 맞춤. 실제 OS 키보드 검증과 축소 viewport 검증을 구별한다.

1440×900, 1366×768, 1024×768, 768×1024, 390×844, 320×568 및 작은 높이/200% 동등 reflow를 실제 Chrome 캡처로 검토. keyboard-only/초점 복귀/Tab trap/Escape/status/alert/reduced-motion 유지. 실제 스마트폰·OS IME·native zoom·스크린 리더는 실행하지 않은 한 PASS로 기록하지 않는다.

## v1.4의 작은 격려와 성취

v1.3의 위 토큰·목록·패널·모바일 구조를 유지한다. 오늘 제목 아래 기존 설명 한 줄만 문구로 바꾸며 overflow-wrap/white-space로120자 사용자 문장도 처리한다. 큰 카드/팝업/통계 UI는 추가하지 않는다. 전체 보기 설명·저장 상태는 유지한다.

앱 메뉴의 단일 “문구와 격려 설정” 진입은 desktop440px panel,900px 미만 전체폭 sheet다. 기존 PanelDialog에 textarea Tab 경계와 고정 footer를 재사용한다. 모드 native radio와 격려 checkbox는44px label, 내 문장 입력은16px이다. 초안/오류/status·내부 scroll·Escape/취소 복귀를 공통 규칙으로 처리한다.

오늘 목록 아래의 접힌 성취는 기존 completed-section과 TaskRow를 재사용하고 별도 이름/범위 도움말·로컬 완료 시각을 제공한다. 예시 제외/검색 무관인 현재 목록의 성취와 전체 완료 범위를 구별한다. 행 복원·닫기·날짜 변경의 summary 초점과 완료 후 숨은 행 배제를 검사한다. UndoToast 한 개에만 짧은 격려를 추가해 기존 행동/최신 undo/pause를 유지한다.

[실제 전후·3건 수정](docs/V1_4_FINAL_UPDATE.md) · [8조건 새 상태 검수](docs/evidence/v1.4/features-second.json). 모든 상태는 실제 앱의 격리 fixture 캡처이며 생성 이미지가 아니다.
