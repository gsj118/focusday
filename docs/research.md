# 리서치 연결

제공된 [리서치 원문](references/deep-research-report.md)은 수정 없이 보존한다. 원문의 조사 날짜는 2026-10-02이며, 공식 제품 설명·도움말·공개 리뷰를 종합한 구현 전 보고서다.

## 채택한 근거

- Things의 수집/실행 분리와 Quick Entry → 제목만으로 빠른 입력.
- Microsoft To Do의 My Day → 오늘 선택은 매일 바뀌지만 원본은 전체에 보존.
- Todoist·Apple Reminders의 오늘/기한 초과 묶음 → 기한 초과를 오늘 화면에 중복 없이 표시.
- 점진적 공개와 사용자 제어·복구 → 속성은 편집기에, 완료·삭제에는 실행 취소.
- 기기별 상호작용과 접근성 지침 → 하단 탐색, 시트, native control, 포커스 관리.

## 조사와 검증의 구분

‘설정을 오래 유지하고 싶지 않은 개인 사용자’는 설계 가설이다. 직접 경쟁 앱 설치·전체 상호작용 비교, 사용자 인터뷰, 모집단 대표 리뷰 분석은 수행하지 않았다. 원문의 평점·업데이트·스토어 순위는 제공 보고서의 주장으로만 보존하며 본 구현에서 재검증했다고 주장하지 않는다. 내부 인용 토큰은 URL로 변환하지 않는다.

## 구현에 필요한 공식 자료

- [Vite 시작과 런타임 요구](https://vite.dev/guide/)
- [Vite GitHub Pages 배포](https://vite.dev/guide/static-deploy.html#github-pages)
- [React createRoot](https://react.dev/reference/react-dom/client/createRoot)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Playwright 설치·브라우저 테스트](https://playwright.dev/docs/intro)

위 링크는 제작 중 공식 문서를 열어 확인했다. 실제 제품 검증은 [validation.md](validation.md)에 별도로 기록한다.
