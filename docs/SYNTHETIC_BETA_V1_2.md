# Focusday v1.2 Synthetic Beta

이 평가는 AI가 구성한 가상 사용자 관점과 실제 앱 조작/자동화 검증을 결합한 Synthetic Beta다. 실제 사용자 모집·인터뷰·만족도·사용자 과업 시간 측정은 수행하지 않았다.

동일 Codex 세션이 12개 관점을 분리해 평가했다. 독립 모델·subagent·사람 평가를 수행하지 않았다. 기준 main `7ff35e7`, 출시 태그 `v1.1.0`; 두 revision의 앱 소스는 동일하다. [기준 보존](versions/v1.1.0/index.md).

## 실행 설계

대표 공통 검사는 기존 55개 E2E를 재사용하고, 유형별 1개 핵심 과업과 관련 오류/취소/복구를 연결한다. 기본 생성은 UI를 사용한다. 날짜·손상·대량·저장 예외는 격리 context의 합성 fixture/Clock/Storage port로만 재현한다. 53개 Case ID는 실행 근거와 연결하고 새 테스트 개수와 혼동하지 않는다.

| 관점               | 실제 연결 세션                                                 | 환경                                 |
| ------------------ | -------------------------------------------------------------- | ------------------------------------ |
| P01 처음 사용      | 빈 안내→제목 Enter→여러 초안 취소→완료/취소/reload             | 1366×768                             |
| P02 빠른 기록      | 전체 5개 Enter→버튼 비교→빈/길이/반복 제출 복구                | 1440×900                             |
| P03 키보드         | N/Tab/Enter 입력·편집→textarea 줄바꿈/Escape→계획·데이터 trap  | 1440×900                             |
| P04 휴대폰 확인    | touch+automation Enter→편집→완료 검색/복원→파일 취소/재선택    | 390×844 touch/isMobile               |
| P05 작은 화면      | 200자 제목·24자 분류→계획/긴 파일명 미리보기→분류 해제         | 320×740                              |
| P06 가시 영역 감소 | 입력/상세 저장→손상 파일 오류→정상 파일 재선택/취소            | 390×480                              |
| P07 기한/집중      | 어제 조건→집중/해제/기한 잔류→미래 기한 이어가기/해제          | 1440×900                             |
| P08 쌓인 업무      | 50개 검색 중 계획 선택→검색 없음 복구; 기존 200개 조작 검사    | 1440×900                             |
| P09 실수 복구      | 삭제/undo→완료 뒤 속성 편집/undo→예시 중복/제거                | 1440×900                             |
| P10 데이터 보존    | 실제 다운로드→빈 별도 context UI 복원→재백업→교체 전 백업/취소 | 데스크톱, 별도 크기 검사             |
| P11 시각 제약      | 확대 동등 reflow→빈 오류 복구→편집 focus/오류/취소             | 720×450 CSS, scale 2, reduced motion |
| P12 경계 입력      | 공백/한글·영문·emoji→조합 이벤트/Enter→검색→편집 조합 Enter    | 1440×900, 이벤트 수준 IME            |

Chrome 134.0.6998.36 / Windows / Asia/Seoul / ko-KR. fixture Clock은 2026-10-02 10:00 KST, 실제 실행 시각은 evidence의 UTC timestamp다. 720×450/scale2는 1440×900에서 200%에 대응하는 CSS reflow 조건이며 native 브라우저 확대를 직접 조작한 결과는 아니다.

## 개선 전 실제 관찰

- 기존 단위 42개·시간대 각각 22개·build·E2E 55개 PASS.
- [12개 연결 세션](evidence/v1.2/synthetic-before.json)의 12개 스크립트가 끝났다는 결과는 기능 12개 모두 PASS라는 뜻이 아니다. helper는 개선 전 failed assertion을 기록하고 평가를 계속한다. B05의 실제 실패가 남았다.
- 첫 스크립트의 검색/예시 레이블과 dialog 선택 범위, 완료 undo의 updatedAt 기대 오류는 평가 도구 문제다. P01/P07은 앱을 바꾸지 않고 스크립트를 수정해 [재실행](evidence/v1.2/baseline-and-reproduction.json)했다. 원본 기록을 제품 결함으로 취급하지 않는다.
- [6000개 순수 데이터 경계](evidence/v1.2/backup-boundary-before.json): 들여쓰기 5,531,044 bytes, compact 4,847,007 bytes. v1.1은 앱 다운로드 방식의 padded 파일을 5MiB 제한으로 거부했다. 실제 UI 다운로드→같은 파일 선택에서도 오류를 확인했다.
- B05: 상세 분류에서 compositionstart 이벤트 후 실제 Enter를 누르면 편집기가 닫히고 raw 저장 hash가 바뀜. 빠른 입력의 IME 보호를 편집기에서 재사용하지 않은 P1 결함이다. OS IME 검증은 아니다.

## 기능 결과와 UX 가설의 구분

| 구분                 | 관찰/가설                                                                   | 판단                                                                                      |
| -------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 기능 실패 SB-01 / P1 | 자체 padded 백업이 재가져오기 한도를 넘음                                   | 전체 속성을 유지하며 크기 일관성 개선 필요                                                |
| 기능 실패 SB-02 / P1 | 편집 분류의 조합 Enter가 저장됨                                             | 조합 중 제출 차단과 맥락별 Enter 유지 필요                                                |
| AI walkthrough 가설  | 제목 클릭으로 편집한다는 사실을 처음 사용하는 사람이 놓칠 수 있음           | accessible name은 편집을 명시함. 자동화가 찾은 것을 발견 용이성으로 해석하지 않음; 미변경 |
| AI walkthrough 가설  | 검색 중 계획 선택 뒤 필터 때문에 항목이 안 보이면 사라졌다고 생각할 수 있음 | 실제 검색 지우기 경로와 범위 표시는 존재함. 사람의 이해도는 미측정; 미변경                |

수정·최종 판정은 [v1.2 업데이트 기록](V1_2_UPDATE.md)에 이어 기록한다. 실제 휴대폰·OS 키보드/IME·native 확대·스크린 리더·전체 WCAG·사용자 연구는 별도 미실행으로 구분한다.

## 최종 지원 조건의 결과

수정 전 [53 Case](evidence/v1.2/cases-before.json)는 51 PASS/2 FAIL(SB-01/E11, SB-02/B05), 수정 후 [53 Case](evidence/v1.2/cases-after.json)는 실행한 지원 조건에서 53 PASS다. 물리 기기·OS IME·native 확대·스크린 리더/전체WCAG는 NOT_RUN이며 이 숫자에 포함하지 않는다. [53개 행동 표](SYNTHETIC_BETA_CASES_V1_2.md)에서 원문 과업과 자세한 근거를 찾을 수 있다.

단위46·서울/뉴욕각22·루트 production71·실제 Pages 경로71가 통과했다. F01은 직접 focus API 없이 Tab으로 핵심 입력/편집/계획/백업에 진입하는 P03 보완도 실행했다. [Pages 전체 결과](evidence/v1.2/pages-final.json)는 구현 commit a52bb7a의 실제 source/시각·개별 결과를 기록한다. [한계·오류·검증](validation.md) · [전후 화면/변경](V1_2_UPDATE.md).

GitHub CI와 Pages도 실제 build/deploy success, 각각 원격 Chromium71개·단위46·시간대각22 PASS를 확인했다. 공개 사이트의 Chrome desktop/mobile 핵심 동작과 6000개 전체 다운로드/재선택도 PASS다. [원격 로그](evidence/v1.2/github-actions.json) · [공개 조작](evidence/v1.2/live-deployment.json) · [source/tag/main 관계](deployment.md). 공개 검증 역시 합성 데이터·격리 context이며 사람 평가/OS IME/대량 quota 결과가 아니다.
