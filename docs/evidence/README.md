# 도구 결과 요약

`root-e2e.json`과 `pages-e2e.json`은 실제 Playwright JSON 보고서의 stats와 각 테스트의 제목·ok·실행 status/duration을 추출한 기록이다. 환경의 브라우저 버전은 실행한 Chrome에서 직접 확인했다. 각 기록은 25 PASS, fail/skip/flaky 0이다.

원본 JSON·trace·실패 PNG 같은 로컬 실행 부산물은 `test-results/`에 있고 Git에서 제외한다. 이 폴더에는 제출에 필요한 간결한 실제 결과만 보존한다. 날짜 테스트·TypeScript·lint·build 명령 결과는 [validation.md](../validation.md)에 있고, 실제 화면은 [screenshots](../screenshots/)에 있다.

duration은 자동화된 과업의 실행 시간이며 앱 성능 벤치마크가 아니다. 제어된 시계·오류 주입과 모바일 에뮬레이션을 실기기·사용자 연구로 해석하지 않는다.
