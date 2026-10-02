# Focusday v1.1 보존 기준

시작 main: `7ff35e73632fdb43f1452722c553da95a79e19d7`, 앱 1.1.0. 출시 태그 [v1.1.0](https://github.com/gsj118/focusday/tree/v1.1.0)은 `e29397e`이며 앱 소스는 시작 main과 동일하다. 기존 태그·이력·Git identity를 유지한다.

README와 주요 문서는 이 디렉터리의 `.snapshot.md`에 byte 그대로 보존한다. snapshot의 상대 경로는 당시 저장소 루트를 기준으로 하므로 태그에서 열거나 원래 `docs/screenshots/v1.1/`, `docs/evidence/v1.1/`을 함께 참고한다. 화면과 증거도 각각 `screenshots/`, `evidence/`에 복사했고 원래 파일은 변경하지 않는다.

v1.2 작업 전 새로 실행한 기준 검사: 타입·lint·단위 42개, 서울/뉴욕 날짜 각각 22개, production build, 기존 Chrome E2E 55개 PASS. 새 평가·재현 검사는 별도로 구분한다. [이번 기준·재현 실행](../../evidence/v1.2/baseline-and-reproduction.json)에는 기존 55개 PASS, 스크립트 보완 후 P01/P07 세션 PASS, 자체 백업 UI 재가져오기 FAIL이 함께 기록돼 있다.

테스트 screenshot 출력 경로와 artifact 디렉터리만 분리해 baseline 이미지를 덮어쓰지 않게 했다. 앱 코드는 평가·재현이 끝날 때까지 v1.1 그대로였다.
