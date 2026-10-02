# 도구 결과 요약

이 디렉터리 루트의 `root-e2e.json`과 `pages-e2e.json`은 v1.0 실제 Playwright 보고서의 stats와 각 테스트 제목·ok·실행 status/duration이다. 각 기록은 당시 25 PASS, fail/skip/flaky 0이며 그대로 보존한다.

원본 JSON·trace·실패 PNG 같은 로컬 실행 부산물은 `test-results/`에 있고 Git에서 제외한다. 이 폴더에는 제출에 필요한 간결한 실제 결과만 보존한다. 날짜 테스트·TypeScript·lint·build 명령 결과는 [validation.md](../validation.md)에 있고, 실제 화면은 [screenshots](../screenshots/)에 있다.

duration은 자동화된 과업의 실행 시간이며 앱 성능 벤치마크가 아니다. 제어된 시계·오류 주입과 모바일 에뮬레이션을 실기기·사용자 연구로 해석하지 않는다.

`live-deployment.json`은 `scripts/check-deployment.mjs`가 실제 공개 Pages URL에서 생성한 결과다. HTML·JS·CSS·favicon과 데스크톱/모바일 조작을 검사했으며 Chrome 버전, 배포 소스 commit, URL, 시간, PASS 결과를 기록한다. 화면은 `screenshots/live-*.png`에 연결된다. `github-actions.json`은 GitHub API로 확인한 첫 CI/Pages 실행 상태와 실제 로그의 E2E 통과 수를 보존한다.

위 루트의 live/GitHub 기록은 **v1.0**이다. 최신 v1.1은 별도 [루트 E2E 55개](v1.1/root-e2e.json), [Pages E2E 55개](v1.1/pages-e2e.json), [업데이트 전 baseline 재실행](v1.1/baseline-v1.0.json)으로 구분한다. 공개 배포 도구도 이제 `v1.1/`에 저장해 과거 결과를 덮어쓰지 않는다. 앱/source/tag와 실제 배포 확인 상태는 [배포 문서](../deployment.md)에 연결된다.

[v1.1 GitHub Actions](v1.1/github-actions.json)는 실제 성공 상태와 각각 55 passed 원격 로그를 추출했다. [v1.1 공개 사이트](v1.1/live-deployment.json)는 실제 버전·자산·CRUD·계획·어제 이어가기·백업/합치기의 desktop/mobile PASS다. 해당 source commit과 시각을 명시하며 공개 화면은 `screenshots/v1.1/live-*.png`에 보존한다.

[v1.1 출시 배포](v1.1/release-deployment.json)는 출시 커밋의 CI 성공, 태그 ref의 환경 정책 거부, 동일 커밋 main 재실행의 검사·배포 성공을 실제 API/로그로 구분한다. 태그와 환경 정책은 변경하지 않았다.

[출시 커밋 공개 재검증](v1.1/release-public.json)은 위 main 배포 뒤 실제 Chrome 데스크톱·모바일에서 같은 스크립트를 다시 실행한 PASS 결과다. 반복 촬영은 Git에서 제외한 `test-results/release-smoke/`에 두고 공개 대표 화면 파일을 유지했다.

## v1.2 증거

[v1.1 baseline 보존](../versions/v1.1.0/index.md), [개선 전 관점 기록](v1.2/synthetic-before.json), [기존55+재현/보완 실행](v1.2/baseline-and-reproduction.json), [6000개 순수 실패](v1.2/backup-boundary-before.json)를 따로 보존한다. 평가 도구 오류는 제품 결함과 구분한다.

최종 [루트71개](v1.2/root-final.json)·[Pages71개](v1.2/pages-final.json)·[데이터 경계](v1.2/backup-boundary-after.json)와 [수정 전53 Case](v1.2/cases-before.json)·[수정 후53 Case](v1.2/cases-after.json)를 연결한다. source/시각/fixture/실제 assertion 또는 raw hash를 포함하며, 태그 이후 문서와 실제 공개 확인은 [deployment](../deployment.md)에 기록한다.

[v1.2 GitHub Actions](v1.2/github-actions.json)는 source39af791의 CI와 Pages 성공 상태·job 및 단위46/시간대각22/Chromium71의 실제 로그다. [v1.2 공개 검증](v1.2/live-deployment.json)은 같은 배포 소스의 앱1.2.0·desktop/mobile·자산200·핵심/계획/복원·조합 Enter·6000개 전체 다운로드/preview PASS를 기록한다. 과거 v1.0/v1.1 공개 자료는 보존한다. 출시 문서 커밋의 반복 실행은 `test-results/release-smoke/`에 분리한다.
