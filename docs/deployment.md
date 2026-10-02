# GitHub 제출과 Pages 배포 준비

## 현재 상태

현재 폴더에서 새 로컬 Git 저장소(main)를 만들고 기존 전역 identity로 실제 완료 작업별 커밋을 남겼다. 기존 프로젝트·실습 폴더를 변경하지 않았다. remote는 없다. 제한 환경의 초기 오류를 재확인한 결과 네트워크 접근 가능한 환경에서 `gh auth status` 정상 로그인을 확인했다. 기존 저장소 목록에는 이 과제용으로 식별 가능한 대상이 없었다. push·저장소 생성·공개 배포를 실행하지 않았으며 확인된 과제 저장소/Live Demo URL은 없다.

필요한 정보는 **이 과제용 대상 저장소 URL**이다. GitHub 인증은 확인했다. 공개 범위는 사용자가 지정한 저장소 설정을 따른다. 새 저장소가 필요하면 저장소 이름과 공개/비공개 범위를 지정하면 된다. 토큰을 문서나 채팅에 붙이지 않는다.

## 제출

1. 대상 저장소 URL을 확인해 origin으로 연결한다. 저장소가 이미 존재하면 먼저 fetch해 기존 이력·파일을 확인한다.
2. 현재 커밋을 정상 push한다. 기존 이력 재작성·force push를 사용하지 않는다.
3. GitHub에서 README 이미지와 docs 링크, 전체 소스·lockfile·테스트·커밋을 확인한다.

`node_modules/`, `dist/`, `.pnpm-store/`, `test-results/`, 로컬 로그와 비밀정보는 Git에서 제외한다. 원문 리서치와 제작 지시는 `.gitattributes`로 byte 보존한다.

## 정적 배포

[Vite 공식 GitHub Pages 안내](https://vite.dev/guide/static-deploy.html#github-pages)를 확인했다. 현재 `vite.config.ts` 기본 base는 `./`이고, `VITE_BASE_PATH`로 실제 저장소 경로를 지정할 수 있다. 라우터가 없어 별도 404 rewrite가 필요 없다.

- `.github/workflows/ci.yml`: push/PR에서 Node 24, 고정 lockfile 설치, 타입·lint·단위·build·Chromium E2E.
- `.github/workflows/pages.yml`: 사용자가 GitHub Actions에서 수동 실행하면 실제 Pages `base_path`를 읽고 검증·빌드·브라우저 검사 후 dist를 배포.

Pages를 사용할 대상 저장소의 **Settings → Pages → Source: GitHub Actions**를 선택한 뒤 **Publish Focusday to Pages** workflow를 실행한다. 권한/공개 정책·Pages environment 요구는 해당 저장소 설정을 따른다. workflow 파일 준비와 원격 Actions 성공은 별개이며 현재 Actions는 미실행이다.

## 하위 경로 로컬 검증

실제 저장소 이름을 모르는 현재 상태에서는 테스트 경로 `/focusday-test/`로 자산 로딩을 검증할 수 있다. 이 경로는 배포 URL이나 저장소 이름을 뜻하지 않는다.

```powershell
$env:VITE_BASE_PATH = '/focusday-test/'
pnpm build
pnpm exec vite preview --host 127.0.0.1 --port 4180
```

위 preview를 실행한 상태에서 다른 PowerShell 터미널에서:

```powershell
$env:VITE_BASE_PATH = '/focusday-test/'
$env:E2E_BASE_URL = 'http://127.0.0.1:4180/focusday-test/'
pnpm test:e2e
Remove-Item Env:VITE_BASE_PATH
Remove-Item Env:E2E_BASE_URL
pnpm build
```

검증 후 첫 터미널의 preview는 Ctrl+C로 종료한다. 이 Windows 도구 환경에서는 자동 서버 종료가 지연되는 실행이 있어 별도로 시작한 preview를 재사용해 exit 0까지 확인했다.

브라우저 테스트는 baseURL 상대 경로로 앱을 열어 repository path도 검증한다. 실제 배포 후에는 workflow가 반환한 URL을 직접 열어 HTML·JS·CSS·favicon이 정상 응답하고 생성·수정·새로고침이 되는지 확인한다. 그 후에만 README의 공개 시연 URL을 갱신한다.
