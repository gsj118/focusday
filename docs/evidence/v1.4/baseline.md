# v1.4 작업 시작과 설계

2026-10-08 KST. 시작 main `80748d6`, 앱 1.3.0. 작업 폴더 clean, 정상 인증 환경에서 origin fetch 후 HEAD…origin/main `0 0`. 이전 태그 v1.0.0–v1.3.0 보존. 적용 AGENTS.md 없음.

- 사용자 요청과 첨부 명세를 [원문](../../ai-prompts/10-v1.4-final-implementation.md)에 보존했다. 이번 실제 요청은 구현·실행·수정·문서화·push·Pages·공개 확인까지다.
- [이번 check](baseline-check.txt): 타입/lint/단위46/서울·뉴욕 각22/production build PASS, exit0.
- [이번 기존 E2E](baseline-e2e.json): 80 PASS, fail/skip/flaky0, exit0. 과거 결과를 복사하지 않았다.
- [이번 v1.3 화면](before-visual.json): 격리 Chrome134, 8 viewport, overflow/실행 오류0. v1.3 문서 사본은 `docs/versions/v1.3.0/`에 보존.
- Node24.19.0, 도구 pnpm11.25.0(프로젝트 고정11.19.0). 기존 문서의 환경 설정 `pnpm_config_verify_deps_before_run=false`를 프로세스에 적용했다. 첫 제한 네트워크 자동 dependency 검사는 [중단 기록](environment-attempt.txt). 앱 실패와 구분한다. 고정 lockfile/의존성은 변경하지 않는다.

설계: 오늘 제목의 설명 한 줄만 로컬 창작 콘텐츠로 대체한다. 날짜 ordinal과 모드별 안정적 id 순서로 결정한다. 설정은 `focusday:ui:v1` / UI version1이며 task key/schema/backup version1은 보존한다. 초안은 저장 성공 후 적용하고 손상/미지원 설정은 자동 덮어쓰지 않는다. 격려는 직접 완료 0→1/2→3에서 날짜별 두 표지만 저장하며 설정이 꺼져도 처리한다. 오늘 성취는 예시 제외 + completedAt의 로컬 날짜, 검색과 무관, 최근 완료/id 순이다. 기존 UndoToast·TaskRow·PanelDialog를 재사용한다. 백업에서 UI 설정·내 문장은 제외한다.

다음 실제 단계: 구현 → 격리 12관점 첫 실행 → 관찰한 결함 수정/재실행 → 전체 check/root+Pages E2E → 문서/원격/공개 확인. 진행 전 결과를 미리 PASS로 기록하지 않는다.
