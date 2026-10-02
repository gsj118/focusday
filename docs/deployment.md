# GitHub 제출과 Pages 배포 결과

## 확인된 제출물

- 공개 저장소: [gsj118/focusday](https://github.com/gsj118/focusday)
- 실제 시연: [Focusday](https://gsj118.github.io/focusday/)
- origin: `https://github.com/gsj118/focusday.git`, 기본 브랜치 `main`.
- [첫 CI 성공](https://github.com/gsj118/focusday/actions/runs/36953822839), [첫 Pages 배포 성공](https://github.com/gsj118/focusday/actions/runs/36953844998).
- 최초 배포 소스: `6a31e6755fd9c6eb30682d79d32757c3a0f7fb80`. 이후 제출 커밋은 문서·공개 검증 도구·증거를 보완하며 앱 소스는 동일하다.

처음에는 과제 저장소가 지정되지 않아 로컬 구현·검증·문서화와 작업별 커밋을 먼저 완료했다. 후속 요청 **“너가 알아서 만들어주라”**에 따라 정상 인증된 `gsj118` 계정과 기존 저장소 목록을 확인하고, 사용 가능한 `focusday` 이름의 새 공개 저장소를 생성했다. 기존 저장소·실습 폴더는 변경하지 않았다. 기존 전역 Git identity를 사용했고 정상 push했으며 force push하지 않았다.

`node_modules/`, `dist/`, `.pnpm-store/`, `test-results/`, 로그와 비밀정보는 Git에서 제외한다. 원문 리서치와 제작 지시는 `.gitattributes`로 byte 보존한다.

## 수행한 배포

1. `gh repo create gsj118/focusday --public`로 생성하고 origin을 연결했다.
2. 로컬 완료 커밋을 `git push -u origin main`으로 올렸다.
3. GitHub Pages의 build type을 `workflow`로 설정했다.
4. `gh workflow run pages.yml --repo gsj118/focusday --ref main`으로 실행했다.
5. CI와 Pages workflow의 모든 검증·배포 job 성공을 확인했다.
6. 공개 URL에서 실제 Chrome 데스크톱·모바일 조작과 HTML·JS·CSS·favicon HTTP 200을 확인했다. 이후 README에 링크와 실제 공개 화면을 반영했다.

[Vite 공식 Pages 안내](https://vite.dev/guide/static-deploy.html#github-pages)에 따라 `VITE_BASE_PATH`로 저장소 경로를 지정한다. Pages workflow는 `configure-pages`가 반환한 `base_path`(`/focusday`)를 읽는다. 라우터가 없어 별도 404 rewrite가 필요 없다.

- `.github/workflows/ci.yml`: main push/PR에서 Node 24, 고정 lockfile 설치, 타입·lint·단위·서울/뉴욕 시간대·production build·Chromium E2E 25개.
- `.github/workflows/pages.yml`: 수동 실행으로 위 검증을 수행하고 `/focusday/` production 앱의 E2E 25개를 통과한 후 Pages에 배포.

## 공개 주소 재검증

```sh
pnpm install --frozen-lockfile
node scripts/check-deployment.mjs https://gsj118.github.io/focusday/
```

기본 브라우저는 설치된 Chrome이다. Chrome이 없다면 `pnpm exec playwright install chromium` 후 `PW_CHANNEL=chromium` 환경 변수를 지정한다. 검증은 격리 context만 사용하며 실제 사용자 브라우저의 할 일은 건드리지 않는다.

스크립트는 1440×900과 모바일 에뮬레이션 390×844에서 생성→속성 편집→새로고침 저장→오늘/전체 이동→완료 취소→삭제 취소→예시와 편집기 확인을 수행한다. 결과는 [live-deployment.json](evidence/live-deployment.json), 실제 화면은 `docs/screenshots/live-*.png`로 기록된다. Chrome의 실행 오류·실패한 요청·4xx 응답이 있으면 실패한다.

## 변경 사항 재배포

완료 작업을 커밋하고 main에 정상 push한 다음 GitHub Actions에서 **Publish Focusday to Pages → Run workflow**를 실행한다. 또는 인증된 CLI에서:

```sh
gh workflow run pages.yml --repo gsj118/focusday --ref main
gh run list --repo gsj118/focusday
```

배포 성공 후 공개 주소 재검증을 실행한다. main push만으로 Pages가 자동 배포되지는 않는다. 로컬 사이트와 공개 사이트는 서로 다른 origin이므로 localStorage 데이터를 공유하지 않는다.

## 하위 경로 로컬 검증

배포 전에는 `/focusday-test/`에서도 production build와 전체 E2E 25개를 실행했다. 실제 배포 경로는 `/focusday/`다.

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
