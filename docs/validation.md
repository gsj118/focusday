# Focusday v1.3 실제 검증 기록

2026-10-08 KST. 노션 작업 UI 전체를 구현하고 검증했다. 실제 사용자 연구는 수행하지 않았다. [v1.2 문서 사본](versions/v1.2.0/validation.snapshot.md)과 이전 증거/태그를 유지하고 baseline을 새로 실행했다.

## 실제 환경과 명령

Windows NT10.0.26200 / PowerShell / Node24.19.0 / Playwright1.63.0 / 설치 Chrome **134.0.6998.36** headless, locale ko-KR, timezone Asia/Seoul. React19.3.0 / TypeScript5.9.3 / Vite8.3.2 / Vitest5.0.3. 최신 Chrome이라고 주장하지 않는다.

프로젝트 고정값은 `pnpm@11.19.0`이며 도구 환경의 실행 바이너리는 pnpm11.25.0이다. 앱 버전 변경 후 pnpm 자동 의존성 검사가 제한 네트워크에서 재설치를 시도해 중단했다. 설치된 의존성과 lockfile을 유지하고 이번 프로세스에서만 `pnpm_config_verify_deps_before_run=false`로 명세의 명령을 실행했다. 의존성이나 프로젝트 설정을 추가하지 않았다. 원격은 workflow의 고정 pnpm/Node24/frozen lockfile 환경이다.

```powershell
$env:pnpm_config_verify_deps_before_run = 'false'
pnpm check
# 별도 preview를 기존 Playwright 설정이 재사용
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort
# 다른 터미널
pnpm test:e2e
```

Pages는 `VITE_BASE_PATH=/focusday/`로 build 후 port4180 preview를 시작하고 `E2E_BASE_URL=http://127.0.0.1:4180/focusday/`로 전체 E2E를 실행한다. root 결과를 복사한 뒤 Pages를 실행해 원본을 구분했다.

## 실행 결과

| 실행                                | 실제 결과/근거                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 변경 전 v1.2 `pnpm check`           | 타입·lint·단위46·서울/뉴욕 각22·build PASS. [로그](evidence/v1.3/baseline-check.txt)                                                                                                     |
| 변경 전 기존 Chrome E2E             | 71 PASS, fail/skip/flaky0, exit0. [원본](evidence/v1.3/baseline-e2e.json)                                                                                                                |
| 교체 후 첫 E2E                      | 72 PASS/8 FAIL. 속성12px 회귀와 이름/locator/3자리 hex 검사 문제. [원본](evidence/v1.3/root-first.json)                                                                                  |
| 수정 후 E2E                         | 80 PASS. [원본](evidence/v1.3/root-second.json)                                                                                                                                          |
| 복원 오류 초점 보완 후 `pnpm check` | 타입·lint·단위46·서울/뉴욕 각22·build PASS. [최종 로그](evidence/v1.3/check-final.txt)                                                                                                   |
| 최종 루트 production E2E            | **80 PASS**, fail/skip/flaky0, exit0. [원본](evidence/v1.3/root-final.json), [로그](evidence/v1.3/root-final.txt)                                                                        |
| Pages `/focusday/`                  | **80 PASS**, fail/skip/flaky0, exit0. [원본](evidence/v1.3/pages-final.json), [로그](evidence/v1.3/pages-final.txt). [HTML/JS/CSS/favicon 경로·형식200](evidence/v1.3/pages-assets.json) |
| 백업 순수 경계 회귀                 | 전체 필드7000개 round trip·6000개 padded/compact·10MiB±1·초과 다운로드0. [원본](evidence/v1.3/backup-boundary-after.json)                                                                |
| 전후 화면                           | 각8 viewport, overflow/실행 오류0. [Before](evidence/v1.3/before-visual.json), [After](evidence/v1.3/after-visual.json)                                                                  |
| 보조 상태                           | 1440/320에서 후보 없음·검색 없음·undo·메뉴·교체·실패·성공·저장 보호 등18개. [원본](evidence/v1.3/ui-states.json)                                                                         |

80개는 기존71개 + 작업 UI9개다. 기존 검사를 삭제/skip하거나 13px/대비 기준을 낮추지 않았다. 생성·기한/집중 분리·검색·완료·undo·초안/IME·날짜·저장 보호·복원 실패의 데이터 assertion을 유지했다. 새 검사는 검색/백업 진입과 초점 복귀, aria-pressed, 7개 viewport의 긴 정보/독립44px 타깃/내부 스크롤, 필수 경계 대비다.

## 화면·접근성 검수

1440×900, 1366×768, 1024×768, 768×1024, 390×844, 320×568과 작은 높이390×480, 720×450 CSS viewport/scale2 reflow를 촬영했다. keyboard-only, focus trap/복귀, Escape, reduced-motion, touch/isMobile, viewport 축소와 내부 스크롤은 자동화한다. fixture/storage 오류 주입은 격리 context에서만 사용하며 앱 초기값/사용자 프로필은 변경하지 않았다.

실제 이미지를 열어 오늘·전체·계획·편집·복원·긴 정보·오류/저장 보호의 위계/흐름을 검토했다. 모바일 계획 설명 줄 폭과 오류 초점/스크롤을 보완했다. 데스크톱 기본 예시 행은 약93–94px에서56.8px로 줄고 정보가 많으면 자연스럽게 높아진다. [전후와 발견/수정](V1_3_UI_REDESIGN.md).

실제 CSS 토큰 조합의 일반 글자4.5:1, 필수 입력 경계·체크박스·집중/포커스3:1을 확인했다. 3자리 minified hex를 확장해 계산하며 장식 구분선에는 입력 경계 기준을 강제하지 않는다. 이름·상태·role/aria·대비/keyboard 확인을 전체 WCAG 판정으로 확대하지 않는다.

## 데이터 보존과 미실행

저장 key `focusday:v1`, data `version:1`, domain/storage/backup/date hook과 lockfile은 그대로다. 정상 초기 raw/write0, 모든 Task 필드, id·기한 유지, compact 전체 백업, merge/replace 성공1write·실패 시 raw/메모리 유지·초점 이동을 재실행했다. 일반 저장 실패 중 메모리 변경과 손상 원본 보호도 유지한다. [제품 명세](product-spec.md).

| 조건                                   | 상태·범위                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------- |
| 실제 휴대폰·OS 가상 키보드·safe-area   | NOT_RUN. Chrome touch/isMobile, visualViewport 대응과 작은 높이 축소만 확인 |
| 실제 OS 한글 IME·사람의 OS 파일 선택창 | NOT_RUN. composition/File/empty-selection 이벤트와 자동화 키 검사           |
| native200% 브라우저 확대               | NOT_RUN. 720×450/scale2 동등 reflow와 구분                                  |
| Safari/Firefox/최신 Chrome·스크린 리더 | NOT_RUN. Chrome134/원격 Chromium, 이름·초점·대비 범위                       |
| 실제 사용자 연구·만족도·과업 시간      | NOT_RUN. AI 시각 검토/자동화이며 사람을 모집하지 않음                       |
| 대량 목록 성능·storage quota·다중 탭   | NOT_RUN. 순수 데이터/read port의 파일 경계와 구분                           |
| 10MiB 초과 전체 메모리 파일 보존/복원  | UNSUPPORTED. 전체 내보내기를 중단하고 부분 누락하지 않음                    |

원격 CI/Pages 및 공개 검증은 source SHA와 완료 상태를 [배포 기록](deployment.md)에 연결하고 새 원본으로 보존한다.
