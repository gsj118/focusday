# 도구 결과 요약

이 디렉터리 루트의 `root-e2e.json`과 `pages-e2e.json`은 v1.0 실제 Playwright 보고서의 stats와 각 테스트 제목·ok·실행 status/duration이다. 각 기록은 당시 25 PASS, fail/skip/flaky 0이며 그대로 보존한다.

원본 JSON·trace·실패 PNG 같은 로컬 실행 부산물은 `test-results/`에 있고 Git에서 제외한다. 이 폴더에는 제출에 필요한 간결한 실제 결과만 보존한다. 날짜 테스트·TypeScript·lint·build 명령 결과는 [validation.md](../validation.md)에 있고, 실제 화면은 [screenshots](../screenshots/)에 있다.

duration은 자동화된 과업의 실행 시간이며 앱 성능 벤치마크가 아니다. 제어된 시계·오류 주입과 모바일 에뮬레이션을 실기기·사용자 연구로 해석하지 않는다.

`live-deployment.json`은 `scripts/check-deployment.mjs`가 실제 공개 Pages URL에서 생성한 결과다. HTML·JS·CSS·favicon과 데스크톱/모바일 조작을 검사했으며 Chrome 버전, 배포 소스 commit, URL, 시간, PASS 결과를 기록한다. 화면은 `screenshots/live-*.png`에 연결된다. `github-actions.json`은 GitHub API로 확인한 첫 CI/Pages 실행 상태와 실제 로그의 E2E 통과 수를 보존한다.

위 루트의 live/GitHub 기록은 **v1.0**이다. 최신 v1.1은 별도 [루트 E2E 55개](v1.1/root-e2e.json), [Pages E2E 55개](v1.1/pages-e2e.json), [업데이트 전 baseline 재실행](v1.1/baseline-v1.0.json)으로 구분한다. 공개 배포 도구도 이제 `v1.1/`에 저장해 과거 결과를 덮어쓰지 않는다. 앱/source/tag와 실제 배포 확인 상태는 [배포 문서](../deployment.md)에 연결된다.

[v1.1 GitHub Actions](v1.1/github-actions.json)는 실제 성공 상태와 각각 55 passed 원격 로그를 추출했다. [v1.1 공개 사이트](v1.1/live-deployment.json)는 실제 버전·자산·CRUD·계획·어제 이어가기·백업/합치기의 desktop/mobile PASS다. 해당 source commit과 시각을 명시하며 공개 화면은 `screenshots/v1.1/live-*.png`에 보존한다.
