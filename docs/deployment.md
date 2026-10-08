# Focusday 배포 기록

## v1.4.0 최종 제출 · 2026-10-08 KST

기존 clean main80748d6에서 시작해 remote 사용자 변경을 확인하고 정상 커밋·push했다. task/backup version1·lockfile·과거 태그/증거/identity/환경 정책을 유지했다. [로컬 최종검증](validation.md)은 check 단위60/서울·뉴욕각36/root 및 Pages 경로 E2E각103 PASS, 자산HTTP200이다.

기존 main 직접 제출 정책에 따라 PR 없이 정상 push하고 **main 수동 pages.yml**을 별도로 실행했다. 첫 v1.4 배포 소스는 `22fa8f0c0708c54fb4dc41a485c20943816653d3`다. [CI](https://github.com/gsj118/focusday/actions/runs/37743830378)와 [Pages build/deploy](https://github.com/gsj118/focusday/actions/runs/37743834673)가 모두 **success**다. 실제 고정 pnpm11.19.0/frozen lockfile 원격 로그에서 타입·lint·단위60·서울/뉴욕각36·build·Chromium E2E **각103 passed**를 확인했다. [API 상태·job·PASS 로그](evidence/v1.4/github-actions.json). push만으로 배포됐다고 간주하지 않았으며 보호 규칙 우회나 force push는 없다.

공개 재검증 도구 `node scripts/check-deployment.mjs https://gsj118.github.io/focusday/`는 새로운 격리 Chrome desktop1440×900/mobile390×844 context에서 기존 CRUD/계획/백업과 v1.4 문구/설정/성취/격려/undo·재방문을 실제 조작한다. UI 설정 백업 제외와 복원 후 유지도 확인한다. 6000개 파일은 read port로 실제 다운로드/미리보기만 검사하며 quota/목록 성능은 주장하지 않는다.

2026-10-08 **16:33 KST** 공개 URL에서 위 조작을 실제 실행해 **모두 PASS**했다. 앱1.4.0·HTML/JS/CSS/favicon HTTP200·실행 오류0, 문구 refresh/모드 왕복/HTML 같은 내 문장·독립 끄기, 유머3개 격려·undo/재완료 중복 억제, 성취 시각·개수, UI 제외 전체 백업·합치기 뒤 설정 유지와 재방문을 확인했다. 6000개 모든 task 필드 다운로드→같은 파일 미리보기는4,877,007 bytes/PASS였다. [공개 원본](evidence/v1.4/live-deployment.json) · [실행 log](evidence/v1.4/live-deployment.txt).

[공개 desktop](screenshots/v1.4/live-desktop.png) · [mobile](screenshots/v1.4/live-mobile.png) · [설정](screenshots/v1.4/live-mobile-settings.png) · [성취](screenshots/v1.4/live-desktop-achievements.png) · [격려/undo](screenshots/v1.4/live-mobile-encouragement.png) · [6000개 미리보기](screenshots/v1.4/live-backup-6000.png). 실제 합성 데이터의 앱 캡처이며 공개 desktop/mobile 설정·성취·격려 화면을 열어 검토했다.

출시 [v1.4.0](https://github.com/gsj118/focusday/tree/v1.4.0)은 공개 증거·문서를 보완한 최종 제출 커밋을 가리킨다. 첫 배포22fa8f0 뒤 앱/public/package/lockfile/Vite 소스는 동일하고 후속 변경은 공개 증거·문서다. 최종 main도 같은 수동 workflow로 다시 배포하며 최신 SHA/상태는 [CI 목록](https://github.com/gsj118/focusday/actions/workflows/ci.yml)·[Pages 목록](https://github.com/gsj118/focusday/actions/workflows/pages.yml)에 남는다. 반복 공개 검증은 `test-results/release-v1.4/`에 저장해 첫 실제 자료를 보존한다. 기존 v1.0–v1.3 태그를 이동하지 않았다.

아래는 이전 버전 당시 기록이며 현재 결과로 복사하지 않았다. v1.3 원본 사본은 [보존 문서](versions/v1.3.0/deployment.snapshot.md)다.

## v1.3 배포 당시 기록

## v1.3 UI 교체·실제 GitHub와 공개 배포 완료

2026-10-08 KST. 시작 main/tag v1.2.0 `78492375019cf800f37dc5a7a806bf1bf47f26d7`, 동일한 origin과 깨끗한 작업 폴더를 확인했다. 원격 사용자는 ADMIN이고 main branch protection 조회는404(미설정)였으며 기존 직접 main 제출과 main 수동 Pages 정책을 유지한다. identity/remote/태그/환경 보호를 변경하지 않는다.

`526a06e`는 이번 baseline·before·DESIGN.md·첨부 원문 보존, `8b8a9ad2f6910c500475eefadc4d2dac7c57209c`는 노션 작업 UI 전체 구현과 회귀 보완이다. 앱1.3.0, 저장 key/data version1 유지. 첨부 원문 파일과 최종 Git blob의 byte/hash가 같다.

로컬 check는 타입·lint·단위46·서울/뉴욕각22·build PASS다. 루트 production 및 실제 `/focusday/` production Chrome E2E는 **각80 PASS**, fail/skip/flaky0, exit0다. Pages HTML/JS/CSS/favicon은 모두200이며 예상 content-type과 하위 경로를 확인했다. 첫 preview의 base 환경 설정 누락으로 자산이 HTML이 된 실행은 중단하고 로그를 보존했다. 올바른 base로 다시 시작한 최종 실행과 구분한다. [전체 명령·범위](validation.md), [자산 원본](evidence/v1.3/pages-assets.json).

기존 main에 세 작업 커밋을 정상 push했다. 첫 v1.3 배포 소스는 `ec67a2cdd8f75c870e243a18c0248076a4120bb2`다. [CI](https://github.com/gsj118/focusday/actions/runs/37736055832)와 [Pages 검증·build/deploy](https://github.com/gsj118/focusday/actions/runs/37736088025)가 모두 **success**다. 실제 pnpm11.19.0/frozen lockfile 원격 로그의 타입·lint·단위46·서울/뉴욕각22·build·Chromium E2E **각80 passed**를 확인했다. [API 상태·job·실제 검사 로그](evidence/v1.3/github-actions.json).

2026-10-08 15:12 KST부터 공개 URL에서 Chrome134의 격리된1440×900 desktop·390×844 touch mobile을 조작해 앱 **1.3.0**, HTML/JS/CSS/favicon200, 생성·속성 편집·새로고침 저장·완료/삭제 undo·예시·계획·어제 이어가기 id/기한·compact 전체 백업·미리보기/id 합치기·조합 Enter 무저장·실행 오류0을 확인했다. 모두 PASS다. [공개 실행 원본](evidence/v1.3/live-deployment.json). 실제 공개 desktop과 mobile 편집/계획/복원 화면을 열어 시각 검토했다.

별도 격리 read port의6000개도 공개 앱에서 실제 전체 다운로드→task 모든 필드 비교→같은 파일 선택→6000개 미리보기 PASS, **4,877,007 bytes**였다. 실제 quota/6000개 목록 성능/복원 적용은 실행하지 않았다. [공개 백업 화면](screenshots/v1.3/live-backup-6000.png).

[공개 desktop](screenshots/v1.3/live-desktop.png) · [mobile](screenshots/v1.3/live-mobile.png) · [모바일 계획](screenshots/v1.3/live-mobile-plan.png) · [모바일 복원](screenshots/v1.3/live-mobile-restore.png). 실제 앱의 합성 데이터이며 생성 이미지가 아니다.

출시 [v1.3.0](https://github.com/gsj118/focusday/tree/v1.3.0)은 공개 증거와 문서를 보완한 릴리스다. 첫 배포ec67a2c 이후 앱/public/package/lockfile/Vite 소스는 동일하며 후속 변경은 공개 증거·문서다. 출시 커밋도 허용된 main에서 같은 수동 workflow로 배포한다. 최신 소스 SHA와 상태는 [CI 목록](https://github.com/gsj118/focusday/actions/workflows/ci.yml)·[Pages 목록](https://github.com/gsj118/focusday/actions/workflows/pages.yml)에 표시된다. 반복 공개 검증의 증거/촬영은 `test-results/release-smoke/`에 저장해 첫 공개 자료를 유지한다.

이전 태그/버전 문서/v1.2 증거·identity·remote·환경 보호는 유지했다. force push·이력 재작성·실패 숨김은 없다. 공개 확인 도구의 현재 버전은1.3.0이며 v1.3 경로에만 기록한다. 아래 v1.2/v1.1 결과는 당시 기록이다.

## v1.2 실제 GitHub·공개 배포 결과

시작 main `7ff35e7` / v1.1.0 tag `e29397e`를 유지했다. 앱 1.2.0 구현 커밋은 `a52bb7aaa30c3780a429a2d0761dc928e2029353`이다. 자체 백업 크기와 상세 composition Enter 두 P1을 수정했고 저장 key/schema는 그대로다.

로컬 타입·lint·단위46·서울/뉴욕각22·production build·루트 Chrome71개·실제 `/focusday/` Chrome71개를 통과했다. [53개 Case](SYNTHETIC_BETA_CASES_V1_2.md)와 [12개 관점/범위](SYNTHETIC_BETA_V1_2.md)를 연결한다. v1.1 결과를 현재 검증으로 재사용하지 않는다.

작업별 커밋을 기존 `gsj118/focusday`의 main에 정상 push했다. 첫 v1.2 배포 소스는 `39af79111a617896b52795e8d4ee920df98f578a`다. [CI](https://github.com/gsj118/focusday/actions/runs/36986748185)와 [Pages build/deploy](https://github.com/gsj118/focusday/actions/runs/36986758881)가 모두 **success**다. 각각 실제 원격 로그의 단위46·서울/뉴욕각22·production build·Chromium E2E **71 passed**를 확인했다. [API 상태·job·정확한 PASS 로그](evidence/v1.2/github-actions.json).

2026-10-02 18:00 KST 공개 URL에서 실제 Chrome134의 격리된 1440×900 데스크톱·390×844 touch 모바일을 조작했다. 앱1.2.0·생성/상세/저장/새로고침·완료/삭제 undo·예시·계획/어제 이어가기 id·기한·JSON 전체 속성/완료/예시·복원 합치기·편집 composition Enter 무저장을 확인했다. HTML·JS·CSS·favicon HTTP200, 실행 오류0, 모두 PASS다. [공개 실행 원본](evidence/v1.2/live-deployment.json).

별도 격리 read port context의 6000개 항목도 공개 앱에서 실제 다운로드→같은 파일 선택→6000개 미리보기 PASS, UTF-8 **4,877,007 bytes**였다. id 길이가 로컬 fixture와 달라 bytes도 다르다. 전체 task 필드를 비교했으며 6000개 목록 렌더링·실제 저장 quota·복원 적용을 실행했다고 주장하지 않는다. [공개 백업 화면](screenshots/v1.2/live-backup-6000.png).

[공개 대표 desktop](screenshots/v1.2/live-desktop.png) · [mobile](screenshots/v1.2/live-mobile.png) · [모바일 계획](screenshots/v1.2/live-mobile-plan.png) · [모바일 복원](screenshots/v1.2/live-mobile-restore.png). 실제 앱의 합성 테스트 데이터이며 목업이 아니다.

출시 [v1.2.0](https://github.com/gsj118/focusday/tree/v1.2.0)은 공개 결과·화면·문서를 보완한 최종 릴리스 커밋을 가리킨다. main과 태그를 정상 push하며 같은 main을 다시 배포한다. 첫 공개 증거의 source39af791 및 구현a52bb7a와 출시 태그 사이의 앱 소스·public·package·lockfile·Vite 설정은 동일하고, 후속 차이는 공개 증거·문서다. 반복 공개 확인은 `test-results/release-smoke/`에 저장해 위 첫 실제 증거를 덮어쓰지 않는다. 최신 실행은 [CI 목록](https://github.com/gsj118/focusday/actions/workflows/ci.yml) · [Pages 목록](https://github.com/gsj118/focusday/actions/workflows/pages.yml)에서 소스 SHA와 함께 확인할 수 있다.

배포는 기존 환경이 허용하는 **main**의 수동 workflow를 사용한다. 기존 v1.0/v1.1 태그·identity·remote·환경 보호 규칙은 변경하지 않는다. 평가/보존·실제 결함 구현·53개 검증 문서·공개 출시 증거를 실제 완료 단위로 커밋했다. push 시도만으로 성공을 기록하지 않는다.

## v1.1 확인 결과

기준은 `bb8f852`의 `v1.0.0` 태그다. 기존 문서/화면/증거를 보존하고 앱 1.1.0을 구현했다. 저장 키 `focusday:v1`과 `version:1`은 변경하지 않았다. 로컬 타입·lint·단위 42개·서울/뉴욕 각각 날짜 22개·production build·루트/Pages `/focusday/` Chrome E2E 각각 55개가 통과했다.

v1.1 작업 커밋을 main에 정상 push하고 수동 Pages workflow를 별도로 실행했다. [CI](https://github.com/gsj118/focusday/actions/runs/36961036184)와 [Pages](https://github.com/gsj118/focusday/actions/runs/36961036551)가 모두 성공했으며 실제 로그에서 각각 E2E **55 passed**를 확인했다. [원격 증거](evidence/v1.1/github-actions.json).

첫 v1.1 배포 소스는 `fb5d3e5d87cd7aa5dc6f79661e1e8f7f3141b908`이다. 공개 URL의 실제 Chrome 데스크톱·모바일에서 버전 1.1.0, CRUD·복구·새로고침, 백업 속성/완료/예시 보존, 미리보기/id 합치기, 계획과 어제 이어가기의 id·기한 유지, HTML·JS·CSS·favicon HTTP 200과 실행 오류 0을 확인했다. [공개 검증 원본](evidence/v1.1/live-deployment.json).

출시 태그 [v1.1.0](https://github.com/gsj118/focusday/tree/v1.1.0)은 `e29397ec3b7c3e0340a275c11ae257a6359aed81`을 가리킨다. 위 검증된 앱 소스에 최종 공개 화면·검증 문서를 보완한 커밋이며, 태그와 main을 정상 push했다. 해당 커밋의 [출시 CI](https://github.com/gsj118/focusday/actions/runs/36961788691)도 성공했다. 실제 v1.1 작업 단위는 baseline 보존, 순수 규칙, 패널/UX, production 비교·검증 문서, 공개 출시 증거, 배포 환경 진단·재검증 기록이다.

## 출시 태그 배포 제한과 해결

`v1.1.0` ref로 실행한 [Pages workflow](https://github.com/gsj118/focusday/actions/runs/36961789411)는 타입·lint·단위·시간대·production build와 E2E **55개**를 통과한 뒤 deploy job에서 실패했다. 실제 annotation은 `Tag "v1.1.0" is not allowed to deploy to github-pages due to environment protection rules.`였다. 환경 API에서 허용된 정책은 `main` branch 한 개로 확인됐다.

태그와 환경 정책을 유지하고, **동일한 `e29397e` 커밋의 main**을 기존 수동 workflow로 배포했다. [허용된 main 재실행](https://github.com/gsj118/focusday/actions/runs/36962290813)의 전체 검사·E2E **55개**와 build/deploy가 모두 성공했다. [실제 상태·오류·정책·재실행 증거](evidence/v1.1/release-deployment.json). 태그 직접 배포를 성공으로 기록하지 않으며 force push·태그 이동·보호 규칙 변경은 하지 않았다.

이후 공개 주소의 Chrome 데스크톱·모바일 조작을 다시 실행해 모두 PASS, 자산 HTTP 200, 실행 오류 0을 확인했다. [출시 커밋 공개 재검증](evidence/v1.1/release-public.json)은 실제 시각·브라우저·소스 커밋을 기록한다. 반복 촬영 파일은 `test-results/release-smoke/`에 두고 기존 공개 대표 화면은 유지한다.

이 배포 진단 기록은 출시 태그 이후 main의 문서 커밋으로 보존한다. 앱 소스는 태그와 동일하다. 앞으로도 배포 ref는 `main`을 사용하며 배포 뒤 공개 주소를 확인한다.

## 확인된 제출물

- 공개 저장소: [gsj118/focusday](https://github.com/gsj118/focusday)
- 실제 시연: [Focusday](https://gsj118.github.io/focusday/)
- origin: `https://github.com/gsj118/focusday.git`, 기본 브랜치 `main`.
- v1.0의 [첫 CI 성공](https://github.com/gsj118/focusday/actions/runs/36953822839), [첫 Pages 배포 성공](https://github.com/gsj118/focusday/actions/runs/36953844998).
- v1.0 최초 배포 소스: `6a31e6755fd9c6eb30682d79d32757c3a0f7fb80`. v1.0 최종 커밋 `bb8f852`를 baseline으로 보존했고 v1.1에서 앱 소스를 확장했다.

처음에는 과제 저장소가 지정되지 않아 로컬 구현·검증·문서화와 작업별 커밋을 먼저 완료했다. 후속 요청 **“너가 알아서 만들어주라”**에 따라 정상 인증된 `gsj118` 계정과 기존 저장소 목록을 확인하고, 사용 가능한 `focusday` 이름의 새 공개 저장소를 생성했다. 기존 저장소·실습 폴더는 변경하지 않았다. 기존 전역 Git identity를 사용했고 정상 push했으며 force push하지 않았다.

`node_modules/`, `dist/`, `.pnpm-store/`, `test-results/`, 로그와 비밀정보는 Git에서 제외한다. 원문 리서치와 제작 지시는 `.gitattributes`로 byte 보존한다.

## v1.0 최초 배포 기록

1. `gh repo create gsj118/focusday --public`로 생성하고 origin을 연결했다.
2. 로컬 완료 커밋을 `git push -u origin main`으로 올렸다.
3. GitHub Pages의 build type을 `workflow`로 설정했다.
4. `gh workflow run pages.yml --repo gsj118/focusday --ref main`으로 실행했다.
5. CI와 Pages workflow의 모든 검증·배포 job 성공을 확인했다.
6. 공개 URL에서 실제 Chrome 데스크톱·모바일 조작과 HTML·JS·CSS·favicon HTTP 200을 확인했다. 이후 README에 링크와 실제 공개 화면을 반영했다.

[Vite 공식 Pages 안내](https://vite.dev/guide/static-deploy.html#github-pages)에 따라 `VITE_BASE_PATH`로 저장소 경로를 지정한다. Pages workflow는 `configure-pages`가 반환한 `base_path`(`/focusday`)를 읽는다. 라우터가 없어 별도 404 rewrite가 필요 없다.

- `.github/workflows/ci.yml`: main push/PR에서 Node 24, 고정 lockfile 설치, 타입·lint·단위·서울/뉴욕 시간대·production build·현재 Chromium E2E 80개.
- `.github/workflows/pages.yml`: main 수동 실행으로 위 검증을 수행하고 `/focusday/` production 앱의 현재 E2E 80개를 통과한 후 Pages에 배포.

## 공개 주소 재검증

```sh
pnpm install --frozen-lockfile
node scripts/check-deployment.mjs https://gsj118.github.io/focusday/
```

기본 브라우저는 설치된 Chrome이다. Chrome이 없다면 `pnpm exec playwright install chromium` 후 `PW_CHANNEL=chromium` 환경 변수를 지정한다. 검증은 격리 context만 사용하며 실제 사용자 브라우저의 할 일은 건드리지 않는다.

현재 v1.3 스크립트는 1440×900과 모바일 에뮬레이션 390×844에서 생성·편집·새로고침·완료/삭제 취소·예시, 버전 1.3.0, JSON 전체 백업과 id 합치기, 오늘 계획·어제 이어가기의 id/기한 유지, 편집 조합 Enter 무저장과 compact 백업까지 확인한다. 별도 read port context로 공개 사이트의 6000개 실제 다운로드/미리보기도 확인하되 quota/목록 성능은 주장하지 않는다. 결과는 `docs/evidence/v1.3/live-deployment.json`, 화면은 `docs/screenshots/v1.3/live-*.png`에 기록해 v1.0/v1.1/v1.2 증거를 보존한다. Chrome의 실행 오류·실패한 요청·4xx 응답이 있으면 실패한다. 반복 확인의 부산물을 Git에서 제외하려면 `SMOKE_OUTPUT_DIR=test-results/release-smoke` 환경 변수를 사용할 수 있다.

## 변경 사항 재배포

완료 작업을 커밋하고 main에 정상 push한 다음 GitHub Actions에서 **Publish Focusday to Pages → Run workflow**를 실행한다. 또는 인증된 CLI에서:

```sh
gh workflow run pages.yml --repo gsj118/focusday --ref main
gh run list --repo gsj118/focusday
```

배포 성공 후 공개 주소 재검증을 실행한다. main push만으로 Pages가 자동 배포되지는 않는다. 로컬 사이트와 공개 사이트는 서로 다른 origin이므로 localStorage 데이터를 공유하지 않는다.

## 하위 경로 로컬 검증

v1.0에서는 `/focusday-test/`, v1.1에서는 실제 경로 `/focusday/`의 E2E 55개, v1.2에서는 같은 실제 경로의 production build와 E2E 71개를 실행했다.

```powershell
$env:VITE_BASE_PATH = '/focusday/'
pnpm build
pnpm exec vite preview --host 127.0.0.1 --port 4180
```

위 preview가 실행 중인 상태에서 다른 PowerShell 터미널에서:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:4180/focusday/'
pnpm test:e2e
Remove-Item Env:E2E_BASE_URL
```

첫 터미널의 preview는 Ctrl+C로 종료한다. 기본 로컬 빌드로 돌아갈 때 해당 터미널에서 `Remove-Item Env:VITE_BASE_PATH` 후 `pnpm build`한다. 이 Windows 도구 환경에서는 자동 서버 종료가 지연되는 실행이 있어 별도로 시작한 preview를 재사용해 exit 0까지 확인했다.
