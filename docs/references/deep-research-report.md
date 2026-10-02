# 개인용 할 일 관리 애플리케이션 심층 리서치 및 구현 인계 명세

## 결론과 조사 프레임

**핵심 결론과 권장 제품 방향**

조사 기준일은 **2026년 10월 2일, 대한민국 표준시(KST)**이다.

이번 과제에 가장 적합한 방향은 기능이 많은 생산성 도구를 축소 복제하는 것이 아니라, **“생각난 일은 몇 초 안에 담고, 전체 할 일 중 오늘 할 것만 의도적으로 골라 끝내는 계정 없는 로컬 우선 반응형 웹앱”**이다.

경쟁 제품을 비교하면, 강한 제품들은 서로 기능 수는 크게 달라도 세 가지 공통점을 가진다. Todoist는 빠른 캡처와 Today 중심 정리에 강하고, Things는 Inbox와 Today를 분리해 “수집”과 “실행”을 구분하며, Microsoft To Do는 My Day를 매일 초기화하되 원래 할 일은 보존한다. Apple Reminders 역시 Today에 오늘 기한과 기한 초과 항목을 집약한다. 즉, **전체 백로그와 ‘오늘 내가 실제로 하려는 일’을 분리하는 구조는 여러 제품에 걸쳐 지속적으로 확인되는 기본 패턴**이다. citeturn13search0turn14search24turn15search3turn17search0

이번 앱은 이를 그대로 복제하지 않고 다음과 같이 단순화하는 것이 가장 좋다.

> **핵심 가치 한 문장:**  
> **“해야 할 일을 잊지 않게 담고, 오늘 할 일만 선명하게 골라 바로 실행한다.”**

핵심적인 제품 차별점은 두 개면 충분하다.

첫째, **‘오늘’과 ‘기한’을 다른 개념으로 취급한다.** “오늘에 추가”는 오늘 집중하겠다는 선택이고, “기한”은 언제까지 해야 하는지를 나타낸다. Microsoft To Do의 My Day처럼 하루의 집중 목록을 별도로 구성하는 구조와, Todoist가 날짜·기한·우선순위 등 여러 계획 속성을 구분하는 방식에서 설계 근거를 얻을 수 있다. Microsoft My Day는 매일 밤 초기화되지만 원래 작업은 다른 목록에 남고, 기한은 별도 속성이다. citeturn15search0turn15search3turn15search4

둘째, **계정·서버·동기화 없이도 저장 상태와 실수 복구를 분명하게 보여준다.** 로컬 저장 자체는 단순하지만, 사용자가 완료·삭제·수정했을 때 즉시 결과와 복구 방법을 제공해야 제품처럼 느껴진다. Nielsen Norman Group의 사용성 지침도 즉각적인 시스템 상태 피드백, 오류 복구, 중요하지 않은 기능의 점진적 공개를 강조한다. citeturn19search8turn19search4turn19search6

**주 사용자 설정은 검증된 페르소나가 아니라 조사에 근거한 설계 가설이다.** 추천하는 주 사용자는 “학생” 자체가 아니라 다음 유형이다.

> **여러 개인·업무성 할 일을 수시로 떠올리지만, 프로젝트 관리 체계를 꾸미거나 많은 설정을 유지하고 싶지는 않은 1인 사용자.**

이 선택은 대학 과제라는 상황에서 대학생을 억지로 페르소나로 삼은 것이 아니다. Things는 Inbox를 “아직 정리되지 않은 생각을 임시로 담는 곳”으로 정의하며, Microsoft To Do는 My Day와 전체 목록을 분리하고, Todoist 역시 Today와 전체적인 필터·프로젝트 구조를 분리한다. 서로 다른 제품이 같은 문제를 다른 방식으로 해결한다는 점에서 **“수집은 쉽지만 쌓인 할 일 중 지금 무엇을 해야 하는지 결정하기 어렵다”**는 문제를 이번 프로토타입의 설계 가설로 선택하는 것이 합리적이다. citeturn14search24turn15search1turn13search12

첫 실행 후 1분 안에는 다음 가치를 경험해야 한다.

**할 일 입력 → 오늘에 추가 → 기한·우선순위 확인 → 완료 → 실행 취소**가 별도 학습 없이 이어져야 한다. 긴 온보딩이나 기능 소개 슬라이드는 만들지 않는다. 점진적 공개는 초기 화면에 핵심 기능만 노출하고, 날짜·우선순위·분류 같은 세부 속성은 필요할 때 여는 방식이 학습 부담을 줄이는 전통적 사용성 원칙이다. citeturn19search1turn19search6

기술 방향 역시 하나로 좁히는 것이 좋다.

**권장 기본안은 `React + TypeScript + Vite + 일반 CSS + localStorage + GitHub Pages`인 서버 없는 단일 페이지 반응형 웹앱이다.** 라우터, 전역 상태 라이브러리, UI 프레임워크, 데이터베이스, 인증 시스템은 사용하지 않는다. GitHub Pages는 GitHub 프로젝트를 정적 사이트로 호스팅할 수 있고, Vite는 GitHub Pages의 저장소 하위 경로에 배포할 때 `base` 경로를 설정하는 공식 배포 방법을 제공한다. citeturn20search2turn19search3

이 조합을 추천하는 이유는 “최신”이어서가 아니라, **오늘 안에 구현·검증·GitHub 공유까지 완료할 가능성이 가장 높고, AI가 생성한 코드를 사람이 읽고 수정·검증하기도 비교적 쉽기 때문**이다.

**조사 범위·방법·한계**

이번 조사는 공식 제품 도움말·기능 설명·업데이트 기록, 미국 App Store 및 Google Play에서 확인 가능한 현재 설명과 공개 리뷰, 공개 사용자 피드백, W3C WCAG 2.2 자료, Nielsen Norman Group 사용성 지침, WHATWG Web Storage 표준, Vite 및 GitHub 공식 문서를 교차 확인했다. 경쟁 제품은 **Todoist, Things, Microsoft To Do, TickTick, Apple Reminders, Superlist, Google Tasks**의 일곱 개를 선정했고, 그중 **Todoist·Things·Microsoft To Do**를 이번 설계와 직접 연결되는 참고 가치가 높은 세 제품으로 더 깊게 분석했다. citeturn13search0turn14search24turn15search1turn18search0turn17search0turn19search0turn17search3

최근 변화는 2025~2026 자료를 우선했다. 예를 들어 Superlist 1.56은 2026년 6월 데스크톱의 Shift/Cmd/Ctrl 다중 선택과 모바일의 길게 누르기 선택, 빠른 시작 및 로컬 데이터 이상 복구를 추가했고, 1.57은 2026년 8월 다중 선택 드래그와 모바일 타이핑 실행 취소 등을 확장했다. Todoist는 2026년 현재 음성을 여러 구조화된 작업으로 바꾸는 Ramble을 공식 제공한다. 이런 사례는 최근 생산성 앱이 단순히 장식을 바꾸는 것이 아니라 **입력 비용, 대량 조작, 복구, 시작 속도**를 계속 개선하고 있음을 보여준다. citeturn19search0turn14search2turn21search3

다만 다음 한계를 명확히 둔다.

**직접 앱을 설치해 첫 실행부터 모든 화면을 조작한 사용성 테스트는 실시하지 않았다.** 따라서 “첫 실행 화면”이 공식 도움말이나 공개 제품 설명에서 직접 확인되지 않는 경우에는 이를 **미확인**으로 표기한다. App Store에 노출된 설명·평점·리뷰는 확인했지만 모든 스크린샷 픽셀을 시각적으로 비교하거나 전체 리뷰를 수집하지 않았다. 따라서 특정 색상·여백·애니메이션을 실제 제품과 동일하다고 주장하지 않는다.

사용자 인터뷰와 직접 사용자 테스트도 실시하지 않았다. 아래 “주 사용자”, “가장 중요한 문제”, “차별점”은 **경쟁 제품 구조와 공개 피드백을 바탕으로 한 설계 가설**이지 사용자 요구가 입증된 결과가 아니다.

리뷰 역시 전체 모집단을 대표하지 않는다. 예를 들어 미국 App Store의 TickTick 페이지에서는 2025년 6월 26일 리뷰가 기능의 폭과 커스터마이징을 매우 긍정적으로 평가하는 한편, 같은 공개 페이지에 로그인 요구를 원치 않는다는 개별 의견도 노출된다. 이는 “모든 사용자가 계정을 싫어한다”는 증거가 아니라, **로컬·무계정 경험에 가치가 있을 수 있음을 뒷받침하는 개별 사례**로만 취급해야 한다. citeturn18search0

또한 2026년 10월 2일 미국 App Store 한 시점에서 TickTick은 Productivity #139, 4.9점/46K ratings, Google Tasks는 #85, 4.8점/107K ratings로 표시됐다. 이는 **미국 App Store의 해당 시점 스냅샷**일 뿐, 장기적인 인기나 전체 국가·플랫폼에서의 시장 지배력을 의미하지 않는다. citeturn18search0turn18search1

## 경쟁 제품과 사용자 문제

**경쟁 제품 비교표**

| 제품 | 첫 실행·주 화면 | 빠른 입력 | 오늘과 전체의 구분 | 날짜·우선순위·분류 | 완료·수정·복구 | 이번 프로젝트에서 참고할 점 |
|---|---|---|---|---|---|---|
| **Todoist** | 직접 첫 실행은 미확인. 현재 공식 자료는 Today, Upcoming, Inbox/Projects 중심 구조를 확인시킨다. citeturn13search12turn13search0 | 자연어 입력과 빠른 캡처가 핵심이며, 현재 Ramble은 음성에서 날짜·기한·우선순위 등을 해석한다. citeturn21search0turn21search3 | Today에서 오늘·기한 초과 작업을 계획하고 재조정할 수 있다. citeturn13search0turn13search32 | 날짜·시간·우선순위·라벨·필터 등 강한 메타데이터 구조. citeturn13search16turn13search24 | 세부 task view에서 속성을 편집한다. | **입력은 가볍게, 상세 편집은 나중에**라는 구조. 단, 고급 문법·필터는 이번 범위에서 제외. |
| **Things** | 직접 첫 실행은 미확인. 공식 구조는 Inbox, Today, Upcoming, Anytime, Someday를 기본 목록으로 둔다. citeturn14search24turn14search27 | Mac Quick Entry는 `Ctrl+Space`로 다른 앱 사용 중에도 즉시 캡처 가능하다. citeturn14search0turn14search6 | Inbox는 수집, Today는 오늘, Upcoming은 예정, Anytime은 언젠가 실행 가능한 작업을 분리한다. citeturn14search24 | 일정·마감·태그·반복 등을 필요할 때 추가한다. citeturn14search27 | 키보드와 제스처 지원이 강하다. Mac과 모바일의 조작 방식은 동일하지 않으며 모바일은 제스처 비중이 높다. citeturn14search18 | **수집 상태와 실행 상태의 명확한 분리**, 낮은 시각적 잡음, 키보드 효율. |
| **Microsoft To Do** | 직접 첫 실행은 미확인. 공식 구조에는 My Day, Important, Planned, All, Completed 등의 스마트 목록이 있다. citeturn15search1 | 목록에서 바로 작업을 만들고 세부 패널에서 날짜·반복·메모 등을 추가한다. citeturn15search1turn15search4 | **My Day가 매일 밤 초기화되지만 작업 자체는 원래 목록에 남는다.** 오늘 기한 작업도 My Day 흐름에 연결된다. citeturn15search0turn15search3turn15search6 | 기한은 오늘·내일·다음 주·사용자 지정 날짜로 설정 가능하다. citeturn15search4 | 세부 task view에서 속성 관리. | 이번 앱의 **오늘 집중 상태와 원본 작업을 분리하는 모델**에 가장 직접적인 참고 자료. |
| **TickTick** | 직접 첫 실행은 미확인. 현재 제품은 할 일뿐 아니라 캘린더·습관·집중 타이머·카운트다운까지 포괄한다. citeturn16search1turn18search0 | 텍스트·음성 입력과 Smart Date Parsing을 제공한다. citeturn16search13 | 다양한 목록·캘린더·우선순위·정렬 방식으로 오늘 일정을 관리한다. | 태그, 4단계 우선순위, 반복, 체크리스트, 검색, 배치 편집 등 매우 넓다. citeturn18search0 | 대량 편집까지 지원. | **무엇을 추가할지보다 무엇을 빼야 하는지**를 보여주는 사례. 이번 앱은 캘린더·습관·포모도로를 따라가지 않는다. |
| **Apple Reminders** | 직접 첫 실행은 미확인. Today, Scheduled, All, Flagged, Completed 등의 Smart List가 공식적으로 확인된다. citeturn17search0 | 제목 입력 후 날짜·시간·태그 등을 붙이거나 자연어로 날짜를 입력할 수 있다. citeturn17search1 | Today는 오늘 기한과 기한 초과 리마인더를 함께 보여준다. citeturn17search0 | 날짜, 시간, 태그, flag, 우선순위, 위치 등 매우 폭넓다. 사용자 정의 Smart List는 날짜·우선순위·태그 등으로 필터링 가능하다. citeturn17search1turn17search5 | 완료 항목을 별도로 볼 수 있다. | **스마트 뷰와 명확한 상태 표식**. 단, 위치·알림·Apple Intelligence는 범위 밖. |
| **Superlist** | 공식 도움말·업데이트에서 Today/Inbox/List/Tasks 계층을 확인할 수 있으나 첫 실행은 직접 확인하지 않았다. | 최근 버전은 입력 외에 다중 선택과 작업 이동 효율을 크게 개선했다. citeturn19search0 | Today와 Inbox를 별도 맥락으로 취급한다. | 정렬, 반복 작업, 활동 로그 등 기능을 최근에도 계속 확장 중이다. citeturn14search2turn14search26 | 2026년 업데이트에서 모바일 타이핑 Undo와 로컬 데이터 이상 복구를 강조한다. citeturn19search0 | 최신 제품이 **복구·멀티플랫폼 조작·시작 속도**를 제품 완성도의 일부로 다루는 사례. |
| **Google Tasks** | 직접 첫 실행은 미확인. Google Tasks 자체 목록과 Gmail·Calendar 측면 패널을 통해 접근할 수 있다. citeturn17search3 | 제목 중심의 간단한 작업 추가, 세부 내용·하위 작업·날짜 추가를 제공한다. citeturn18search1 | 날짜가 있는 작업은 Calendar와 연결된다. 별도 목록으로 업무/개인 등을 나눌 수 있다. citeturn17search3 | 날짜·시간·반복·하위 작업·별표·수동 재정렬을 지원한다. citeturn17search3 | 드래그 재정렬 등 기본 조작 중심. | 기능 밀도가 낮아 **단순한 작업 리스트도 충분히 제품성이 있을 수 있음**을 보여준다. |

**참고 가치가 높은 제품 심층 분석**

**Todoist — 빠른 캡처와 점진적인 상세화**

Todoist의 중요한 점은 기능이 많다는 사실보다 **입력 순간에 모든 속성을 요구하지 않는다는 것**이다. 공식 도움말의 task view는 작업을 선택한 뒤 제목, 날짜, 하위 작업, 설명 등 세부 정보를 편집하는 구조를 보여주며, Today는 오늘·기한 초과 작업을 검토하고 재조정하는 별도 작업 공간으로 사용된다. citeturn13search24turn13search0

최근에는 Ramble처럼 음성에서 날짜·기한·우선순위까지 추출하는 기능으로 입력 부담을 더 줄이고 있다. 그러나 이번 과제의 앱 내부 AI는 요구사항이 아니고, AI·음성 인식 자체를 구현하면 핵심 할 일 흐름보다 구현·오류 검증 비용이 커진다. 따라서 **“입력 비용을 줄인다”는 목표만 채택하고 AI 방식은 제외**하는 것이 타당하다. citeturn21search0turn21search3

Todoist에서 가져와야 할 것은 자연어 파서가 아니라 **한 줄 입력의 즉시성, Today의 강한 정보 위계, 세부 정보의 후행 편집**이다.

**Things — Inbox에서 Today로 가는 정신 모델**

Things의 공식 문서는 Inbox를 “정리되지 않은 생각을 임시로 잡아두는 곳”으로 설명한다. Today·Upcoming·Anytime·Someday는 그 뒤에 사용자가 언제 행동할지 결정하도록 한다. Mac에서는 Quick Entry로 현재 작업을 벗어나지 않고 새 할 일을 저장할 수 있다. citeturn14search24turn14search0

이번 앱에는 Things처럼 많은 날짜 기반 목록을 만들 필요는 없다. 대신 핵심 정신 모델을 **“먼저 저장하고, 필요하면 오늘로 가져온다”**로 축소하면 된다.

또한 Things는 Mac에서 풍부한 키보드 명령을 제공하고, 모바일에서는 같은 기능을 그대로 복제하기보다 터치와 제스처를 활용한다. 공식 문서도 iPhone 앱과 Mac의 키보드·Quick Entry 기능이 동일하지 않음을 명시한다. citeturn14search6turn14search18

따라서 반응형 웹에서도 **정보 구조는 동일하게 유지하되 조작 표면은 장치에 맞추는 것**이 좋다. 노트북은 키보드와 hover/focus를 활용하고, 모바일은 큰 터치 영역과 하단 편집 패널을 쓴다.

**Microsoft To Do — 하루의 집중 목록을 별도 상태로 두는 방식**

이번 프로젝트에서 가장 직접적인 제품 모델은 Microsoft To Do의 My Day이다. My Day는 매일 초기화되지만 작업 자체를 지우지 않는다. 미완료 작업은 원래 목록에 남아 다음 날 다시 선택할 수 있다. Microsoft의 공식 자료는 My Day와 All, Planned, Completed 등의 스마트 목록을 별도로 제공한다. citeturn15search3turn15search1

이 구조는 중요한 UX 문제를 해결한다. “오늘 하겠다”와 “오늘이 기한이다”는 같은 뜻이 아니다.

이번 앱에서는 이를 더 명시적으로 모델링한다.

- `dueDate`: 실제 기한
- `focusDate`: 사용자가 오늘 집중 대상으로 선택한 날짜

이렇게 하면 “다음 주 금요일까지 해야 하지만 오늘 미리 시작하려는 일”을 오늘 목록에 넣기 위해 거짓 기한을 설정할 필요가 없다. 반대로 이미 기한이 지난 작업은 사용자가 Today 버튼을 누르지 않아도 기한 초과 섹션에 나타나게 한다.

이 설계는 Microsoft의 My Day를 그대로 복제한 것이 아니라, 여러 제품에서 관찰한 **Today/날짜 분리 패턴을 로컬 단일 사용자 앱에 맞춰 단순화한 제안**이다.

**사용자 문제와 디자인·상호작용 패턴 분석**

가장 중요한 문제는 **할 일을 저장하는 것보다 저장된 할 일 중 지금 무엇을 실행할지 결정하는 것**으로 정의하는 것이 좋다.

이는 사용자 인터뷰로 입증한 사실이 아니라 경쟁 제품의 구조를 종합한 설계 가설이다. Things가 Inbox와 Today를 분리하고, Microsoft To Do가 My Day를 별도 스마트 리스트로 제공하며, Todoist와 Apple Reminders가 Today 화면을 핵심 탐색 대상으로 제공하는 것은 서로 다른 제품이 “전체 작업 공간”과 “오늘의 행동 공간”을 구분한다는 강한 제품적 근거다. citeturn14search24turn15search3turn13search0turn17search0

두 번째 문제는 **메타데이터가 도움을 주면서 동시에 입력 부담이 될 수 있다는 점**이다. Apple Reminders는 날짜·시간·위치·태그·우선순위 등 매우 많은 속성을 제공하고, TickTick 역시 네 단계 우선순위·태그·반복·체크리스트·배치 작업 등을 제공한다. 강력하지만 이번 프로토타입에서 모두 노출할 이유는 없다. NN/G는 흔하지 않은 기능을 초기 화면에 모두 노출하지 말고 필요할 때 점진적으로 공개하라고 권고한다. citeturn17search1turn18search0turn19search1turn19search6

따라서 빠른 입력에서는 **제목만 필수**, 상세 편집에서만 **오늘 여부·기한·우선순위·분류**를 제공하는 구조가 적절하다.

세 번째 문제는 **완료·삭제·날짜 변경처럼 되돌릴 수 있는 행위에 대한 신뢰**다. 최근 Superlist가 모바일 타이핑 Undo와 로컬 데이터 복구를 업데이트 항목으로 강조한 것은 오류 복구가 “부수적인 기능”이 아니라 제품 완성도의 일부임을 보여주는 최근 사례다. NN/G 역시 사용자에게 시스템 상태를 즉시 알리고 오류를 진단·복구할 수 있게 하는 것을 핵심 휴리스틱으로 둔다. citeturn19search0turn19search4turn19search8

따라서 이번 앱의 애니메이션보다 중요한 microinteraction은 **Undo snackbar**이다.

최근 변화와 오래 지속된 패턴은 구분해야 한다.

| 구분 | 관찰 | 이번 프로젝트 해석 |
|---|---|---|
| **최근 변화로 확인되는 경향** | Todoist의 AI 음성→구조화된 task 입력, TickTick의 AI/음성 기능, Superlist의 2026 다중 선택·Undo·시작 속도 개선 등. citeturn21search3turn18search0turn19search0 | “AI를 넣어야 트렌디하다”가 아니라 **입력 비용과 조작 비용을 줄이고 복구를 개선하는 방향이 트렌디하다**고 해석한다. |
| **지속적으로 사용되는 기본 패턴** | Today, Inbox/All, quick add, checkbox 완료, 세부 task editor, 날짜·우선순위 같은 보조 메타데이터. citeturn13search0turn14search24turn15search1turn17search0 | 반드시 채택할 기반. |
| **특정 제품의 특징** | Things Quick Entry, Microsoft My Day nightly reset, TickTick의 캘린더·습관·Pomodoro 통합, Apple Smart Lists, Todoist Ramble. citeturn14search0turn15search3turn18search0turn17search5turn21search3 | 원리를 참고하되 브랜드 고유 화면이나 기능 묶음을 복제하지 않는다. |
| **이번 프로젝트 제안** | Today focus와 due date 분리, 제목 우선 입력, accountless local-first, undo, responsive detail editor | 구현 범위는 작지만 핵심 흐름의 신뢰성과 시각적 완성도에 시간을 투자한다. |

공개 사용자 의견에서도 기능의 “많고 적음”에 대한 단일 정답은 나오지 않는다. TickTick의 2025년 6월 26일 미국 App Store 리뷰는 캘린더·습관·집중 타이머·커스터마이징이 모두 있다는 것을 큰 장점으로 평가한다. 반면 현재 r/TickTick에 노출된 일부 개별 의견에서는 기능이 많아 사용 방식을 정하기 어렵거나 디자인이 뒤처졌다는 평가도 확인된다. 이들은 자기선택된 개별 의견이고 전체 사용자 요구를 대표하지 않는다. citeturn18search0turn16search25turn16search37

Apple Reminders의 현재 공개 리뷰에도 “단순함”을 긍정적으로 평가하는 의견과 색상 분류가 더 필요하다는 의견이 동시에 나타난다. 이 역시 기능을 무조건 늘리거나 줄이라는 결론이 아니라, **기본 경험은 단순하게 두고 필요할 때 구조를 추가할 수 있어야 한다**는 방향을 지지하는 참고 사례로 취급하는 편이 안전하다. citeturn17search9

이번 조사 범위의 공개 리뷰 표본만으로는 특정 불만의 실제 발생률을 계산할 수 없으므로, “사용자들이 반복적으로 반드시 요구한다”는 식의 주장은 하지 않는다. **명확하게 반복 검증된 것은 사용자 리뷰의 빈도가 아니라 여러 제품의 정보 구조에서 나타나는 Today/전체 분리와 빠른 입력 패턴**이다.

## 설계 의사결정

**채택·축소·제외 결정표**

| 후보 | 해결하려는 문제 | 실제 제품 근거 | 이번 앱 적용 | 당일 비용·위험 | 결정 |
|---|---|---|---|---|---|
| **Today 중심 홈** | 전체 목록에서 당장 할 일을 찾는 부담 | Todoist Today, MS My Day, Things Today, Apple Today. citeturn13search0turn15search3turn14search24turn17search0 | 기본 진입 화면을 `오늘`로 한다. | 낮음 | **채택** |
| **제목만으로 Quick Add** | 입력 전 설정 부담 | Things Quick Entry, Todoist capture, Google Tasks의 단순 입력. citeturn14search0turn13search12turn18search1 | 제목 입력 + Enter가 최단 경로. 추가 옵션은 나중에. | 낮음 | **채택** |
| **오늘과 기한 분리** | ‘오늘 하고 싶음’과 ‘오늘까지 해야 함’ 혼동 | MS My Day와 due date가 별도 속성. citeturn15search3turn15search4 | `focusDate`, `dueDate` 별도 저장. | 낮음~중간 | **채택** |
| **점진적 상세 편집** | 메타데이터 과부하 | NN/G progressive disclosure. citeturn19search6turn19search1 | 기본 입력은 제목, 편집 패널에 날짜·priority·category. | 낮음 | **채택** |
| **완료·삭제 Undo** | 실수에 대한 불안 | 오류 복구 원칙, Superlist 2026 Undo 강화. citeturn19search4turn19search0 | 완료/삭제 후 snackbar와 `실행 취소`. | 낮음 | **채택** |
| **데스크톱/모바일 다른 조작 표면** | 작은 화면에서 데스크톱 UI 축소판이 되는 문제 | Things가 Mac과 모바일 입력·제스처 방식을 달리한다. Superlist도 desktop multi-select와 mobile long-press를 구분한다. citeturn14search18turn19search0 | desktop sidebar + drawer, mobile bottom nav + bottom sheet. | 중간 | **채택** |
| **우선순위·분류** | 많은 항목에서 맥락 파악 | Todoist, TickTick, Apple Reminders가 제공. citeturn13search16turn18search0turn17search1 | priority 3단계+없음, category 1개만. 별도 카테고리 관리 화면 없음. | 낮음 | **축소 채택** |
| **검색** | 항목이 많을 때 탐색 | TickTick 등에서 빠른 검색 제공. citeturn18search0 | 제목·분류만 로컬 substring 검색. | 낮음 | **권장 최종 범위** |
| **드래그앤드롭·다중 선택** | 대량 정리 속도 | Superlist 1.56/1.57이 최근 강화. citeturn19search0turn14search2 | 프로토타입에서는 자동 정렬 사용. | 중간~높음, 모바일·접근성 검증 증가 | **제외** |
| **음성·자연어 AI 입력** | 입력 비용 감소 | Todoist Ramble, TickTick Smart Date Parsing. citeturn21search3turn16search13 | 앱 내부에서는 구현하지 않음. AI는 제작 과정에 집중. | 높음 | **제외** |
| **캘린더·타임블로킹** | 일정과 작업을 시간축에 배치 | TickTick, Google Tasks/Calendar 등. citeturn18search0turn17search3 | 할 일 관리라는 과제 중심을 흐림. | 높음 | **제외** |
| **습관·포모도로·노트** | 생산성 도구 확장 | TickTick의 all-in-one 구성. citeturn18search0 | 범위 밖. | 높음 | **제외** |
| **로그인·동기화·협업** | 다중 기기/공동 작업 | 경쟁 제품 다수가 제공하지만 프로젝트 조건과 충돌. citeturn18search2turn17search3 | local-only. | 서버 필요 | **제외** |
| **PWA·백그라운드 알림** | 설치·알림 | 이번 핵심 가치와 직접 연결되지 않음 | 알림을 핵심 가치로 약속하지 않는다. | 브라우저별 검증 비용 큼 | **제외** |
| **Glass/Blur/과도한 motion** | 시각적 ‘트렌디함’ | 최근 UI에서 장식적 변화도 존재하지만 제품성의 핵심 근거는 아님 | 약한 그림자·rounded surface 정도만 사용 | 검증 대비 가치 낮음 | **축소/제외** |

핵심 원칙은 **기능의 수가 아니라 상태의 완결성**이다.

예를 들어 “반복 할 일”을 추가하는 것보다, 기본 할 일이 **입력 → 저장 → 오늘 표시 → 수정 → 완료 → 실수 복구 → 새로고침 후 유지**까지 확실하게 되는 것이 이번 평가 환경에서 훨씬 중요하다.

## 최종 제품 명세

**최종 제품·UX·UI 설계 명세**

### 제품 모델

가칭은 구현 시 자유롭게 정할 수 있지만, 제품 개념은 다음처럼 고정한다.

> **Today-first local task manager**  
> 계정 없이 빠르게 할 일을 저장하고, 전체 목록에서 오늘 집중할 일을 골라 처리하는 개인용 반응형 웹앱.

정보 구조는 **오늘 / 전체** 두 개를 주 탐색으로 제한한다.

`오늘`에는 다음 중 하나를 만족하는 미완료 작업이 표시된다.

```text
focusDate === 오늘
OR dueDate === 오늘
OR dueDate < 오늘
```

기한이 지난 항목은 `오늘` 안에서도 **“기한 초과”** 섹션에 따로 놓는다.

`전체`에는 삭제되지 않은 모든 미완료 작업이 표시된다.

완료된 작업은 별도 최상위 메뉴를 만들지 않고 **“완료된 할 일” 접힘 영역** 또는 전체 화면의 필터로 제공한다. 최소 구현에서는 접힘 영역이 더 단순하다.

이 구조를 사용하면 메뉴가 Today / Inbox / Upcoming / Completed / Projects / Tags 등으로 확장되는 것을 막을 수 있다.

### 핵심 흐름

**입력**

사용자는 제목 필드만으로 작업을 생성할 수 있다.

노트북:

> `할 일을 입력하고 Enter`

모바일:

> `+ 할 일 추가`

모바일의 버튼을 누르면 작은 bottom composer 또는 bottom sheet를 열고 제목에 포커스를 둔다.

제목은 필수이고 나머지는 선택이다.

새 작업 생성 후 현재 화면이 `오늘`이면 기본적으로 `focusDate = 오늘`로 하는 것을 권한다. `전체`에서 추가하면 `focusDate = null`로 저장한다. 이 규칙은 사용자가 보고 있는 맥락과 생성 결과가 일치하게 한다.

한글 IME 입력 중 Enter가 조합 확정과 작업 제출을 동시에 일으키지 않도록 실제 구현에서 composition 상태를 처리해야 한다.

**확인·정리**

전체 화면의 task row에는 다음 정보만 표시한다.

```text
[완료 체크] 할 일 제목
            기한 · 분류 · 우선순위
                  [오늘에 추가] [더보기]
```

모든 task에 모든 속성을 강제 표시하지 않는다. 메타데이터가 없으면 두 번째 줄 자체를 제거한다.

`오늘에 추가`는 기한을 변경하지 않고 `focusDate`만 오늘 날짜로 설정한다.

Today에서 해당 버튼은 `오늘에서 빼기`로 바뀐다. 단, **기한이 오늘이거나 이미 초과된 작업은 focusDate를 제거해도 Today에 계속 나타난다.** 이 경우 버튼 대신 “오늘 기한” 또는 “기한 초과” 상태를 설명해야 한다.

**실행**

Today를 세 부분 이상으로 쪼개지 않는다.

권장 구조:

```text
오늘                      10월 2일 금요일
오늘에 집중할 일 4개

기한 초과 1
○ 반품 택배 접수       1일 지남 · 높음

오늘 3
○ 발표 자료 최종 확인  오늘 기한 · 높음
○ 세탁소 들르기        개인
○ 카드 명세서 확인
```

기한 초과를 색상만으로 표현하지 않는다. `기한 초과`, `1일 지남` 같은 텍스트를 함께 보여준다.

**완료**

체크박스 선택 즉시 완료 상태로 전환하고 목록에서 자연스럽게 사라지거나 짧은 완료 애니메이션 뒤 완료 영역으로 이동시킨다.

Snackbar:

> `할 일을 완료했습니다.  실행 취소`

완료 항목은 데이터에서 삭제하지 않고 `completedAt`을 기록하므로 snackbar가 사라진 뒤에도 완료 목록에서 “미완료로 되돌리기”가 가능해야 한다.

**삭제**

삭제는 row의 가장 눈에 띄는 위치에 놓지 않는다. task editor나 `더보기` 메뉴에 배치한다.

삭제 직후:

> `할 일을 삭제했습니다.  실행 취소`

당일 프로토타입에서는 삭제 Undo가 snackbar가 표시되는 약 6~8초 동안만 유지되어도 충분하다. 대신 README의 알려진 제한에 **“삭제 복구는 Undo 표시 중에만 제공”**을 명시한다.

### 화면 구조

**노트북·데스크톱**

약 `900px` 이상에서:

```text
┌──────────────┬─────────────────────────────────────┐
│ 로고/앱 이름 │ 오늘                     검색       │
│              │ 10월 2일 금요일                     │
│ ● 오늘       │                                     │
│   전체       │ + 할 일을 입력하고 Enter            │
│              │                                     │
│              │ 기한 초과                           │
│              │ task row                            │
│              │                                     │
│              │ 오늘                                │
│              │ task row                            │
│              │ task row                            │
│              │                                     │
│ 설정/정보    │ 완료된 할 일 3 ▾                    │
└──────────────┴─────────────────────────────────────┘
```

사이드바 폭은 약 `220–240px`, 작업 콘텐츠 최대 폭은 `760–820px` 정도로 제한한다. 대형 화면에서 리스트가 모니터 전체 폭으로 길어지면 제목과 metadata 간 시선 이동이 커진다.

task를 클릭하면 desktop에서는 우측 **detail drawer**를 연다.

```text
┌──── 세부 정보 ────┐
│ 제목              │
│ [..............] │
│                   │
│ 오늘에 추가  [ ]  │
│ 기한       [날짜] │
│ 우선순위   [높음] │
│ 분류       [업무] │
│                   │
│      작업 삭제     │
└───────────────────┘
```

화면이 충분히 넓지 않으면 drawer를 고정 열로 만들지 말고 overlay로 띄워 리스트 폭을 보존한다.

**모바일**

약 `900px` 미만에서는 왼쪽 sidebar를 제거한다.

상단:

```text
오늘                       검색
10월 2일 금요일
```

하단 고정 탐색:

```text
[ 오늘 ]                [ 전체 ]
```

작업 추가는 하단 탐색 바로 위 또는 화면 우측 하단에 명확한 `+ 할 일 추가` 버튼을 둔다.

task 편집은 오른쪽 drawer 대신 **bottom sheet**로 연다. 동일한 TaskEditor 데이터와 로직을 쓰고 CSS 배치만 바꾸는 것이 당일 구현 안정성이 높다.

스와이프만으로 완료나 삭제를 제공하지 않는다. 터치 제스처를 추가하더라도 동일 기능의 일반 버튼을 반드시 남긴다. WCAG 2.2는 dragging 기능을 제공할 경우 드래그가 필요 없는 동등한 조작 수단을 제공하는 방식을 인정한다. citeturn19search14

### 시각 디자인 원칙

이번 앱은 특정 경쟁 제품의 브랜드를 복제하지 않는다.

추천 방향은 **“quiet productivity”**이다.

배경:

```text
App background  #F8FAFC
Surface         #FFFFFF
Primary text    #111827
Secondary text  #475569 또는 #64748B
Accent          #4F46E5
Focus           #4338CA
Danger text     #B91C1C
Border          #E2E8F0
```

`#4F46E5` 위의 흰색 텍스트는 계산상 약 6.29:1 대비를 갖고, `#64748B`는 흰색에서 약 4.76:1이다. 이는 일반 텍스트에 대해 WCAG 2.2가 설명하는 4.5:1 기준 이상이다. 최종 구현에서도 실제 컴포넌트 상태별 대비를 다시 확인해야 한다. citeturn19search5

색은 정보의 유일한 전달 수단으로 사용하지 않는다.

잘못된 예:

> 빨간 점만 있음

권장:

> `기한 초과 · 2일 지남`

priority도:

> `● 높음`

처럼 텍스트를 함께 둔다.

타이포그래피는 외부 웹폰트 의존 없이 시스템 폰트를 우선한다.

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  "Noto Sans KR",
  sans-serif;
```

권장 크기:

| 용도 | 크기 |
|---|---:|
| desktop page title | 28px / 34px |
| mobile page title | 24px / 30px |
| task title | 16px / 24px |
| body/input | 16px / 24px |
| metadata | 13–14px / 18–20px |
| button | 14–15px / 20px |

간격은 `4, 8, 12, 16, 24, 32px` 토큰만 사용한다. Radius는 작은 control 8~10px, card/drawer 12~16px 정도면 충분하다.

그림자는 계층을 구분할 때만 사용한다. 유리 효과, 강한 gradient, 움직이는 배경, 3D card 등은 구현하지 않는다. NN/G의 미니멀 디자인 원칙은 불필요한 시각 요소가 관련 정보와 사용자의 주의를 경쟁한다고 설명한다. citeturn19search1turn19search4

### 상태별 UI

**입력 전**

> `무엇을 해야 하나요?`

보조 텍스트는 최소화한다.

desktop에서는 다음 정도만 보여도 충분하다.

> `Enter로 추가`

**입력 중**

제목 입력 후 선택적으로:

> `기한` `우선순위` `분류`

를 펼칠 수 있다.

세부 속성을 항상 펼쳐 놓지 않는다.

**제목 없음**

> `할 일 제목을 입력해 주세요.`

공백만 입력한 문자열도 거부한다.

**성공**

일반 추가는 task가 즉시 나타나는 것 자체가 충분한 피드백이므로 매번 큰 toast를 띄우지 않는다.

저장 상태가 필요하면 헤더에 작게:

> `저장됨`

을 표시한다.

**완료**

> `할 일을 완료했습니다.`  
> `실행 취소`

**삭제**

> `할 일을 삭제했습니다.`  
> `실행 취소`

**오늘이 비어 있음**

> **오늘은 비어 있습니다**  
> 전체 할 일에서 오늘 할 일을 고르거나 새 할 일을 추가해 보세요.  
> `+ 새 할 일`

**앱 전체가 처음 비어 있음**

> **해야 할 일을 하나 적어보세요**  
> 계정 없이 이 기기에 바로 저장됩니다.  
> `첫 할 일 추가`  
> `예시로 둘러보기`

온보딩 carousel은 만들지 않는다.

**검색 결과 없음**

> **“발표”와 일치하는 할 일이 없습니다**  
> 검색어를 지우거나 전체 할 일을 확인해 보세요.

**기한 초과**

> **기한 초과 2개**

row:

> `2일 지남`

가능하면 detail editor에서:

> `기한 변경`

을 바로 제공한다.

**저장 실패**

Web Storage 표준상 `setItem()`은 저장소가 비활성화되었거나 quota를 초과한 경우 `QuotaExceededError`가 발생할 수 있고, 정책상 저장소 접근 자체가 허용되지 않으면 `localStorage` 접근이 `SecurityError`가 될 수 있다. 따라서 저장 호출은 예외를 처리해야 한다. citeturn20search1turn20search3

실패 시 사용자가 저장됐다고 오해하지 않게 한다.

> **변경 사항을 이 브라우저에 저장하지 못했습니다.**  
> 현재 탭에서는 계속 사용할 수 있지만 새로고침하면 변경 내용이 사라질 수 있습니다.

오류 발생 중에는 “저장됨” 상태를 표시하지 않는다.

### 접근성 요구

목표는 “WCAG 준수 완료”라고 주장하는 것이 아니라, **WCAG 2.2 AA 수준에서 검증할 핵심 요구를 설계 단계부터 반영**하는 것이다. 실제 구현 후 테스트 없이 conformance를 주장하면 안 된다. W3C 역시 WCAG 준수 판단에 기능 테스트가 필요하며, 별도의 사용성 테스트도 권장한다. citeturn19search13

필수 요구:

- 모든 핵심 기능을 키보드로 실행할 수 있어야 한다.
- Tab 순서는 시각적·논리적 순서와 같아야 한다. WCAG는 focus order가 콘텐츠의 관계와 작업 순서를 따르도록 요구한다. citeturn19search11
- 포커스 표시를 제거하지 않는다.
- focus ring은 주변 상태와 명확히 구분한다. WCAG의 Focus Appearance 설명은 충분한 시각적 면적과 대비를 강조한다. citeturn19search2
- 일반 텍스트 대비는 최소 4.5:1을 목표로 한다. citeturn19search5
- WCAG 2.2 AA의 minimum target 기준은 24×24 CSS px 또는 충분한 간격이다. 이번 앱은 모바일 핵심 버튼에 **44×44px 이상**을 내부 설계 목표로 사용해 더 여유 있게 만든다. citeturn20search0
- native `<button>`, `<input>`, `<input type="checkbox">`를 우선한다.
- 아이콘 단독 버튼에는 accessible name을 제공한다.
- 저장 실패·완료·Undo 같은 상태 메시지는 적절한 `aria-live="polite"` 영역에서 전달한다.
- 우선순위와 기한 초과를 색상만으로 전달하지 않는다.
- hover에서 나타나는 기능은 keyboard focus에서도 접근 가능하게 한다.
- modal/drawer가 열리면 적절하게 focus를 이동하고 `Escape`로 닫을 수 있게 한다.
- motion은 작고 짧게 유지하며 `prefers-reduced-motion`에서는 불필요한 전환을 최소화한다.

권장 keyboard 동작:

| 조작 | 결과 |
|---|---|
| `Tab / Shift+Tab` | 논리적 포커스 이동 |
| `Enter` | Quick Add 저장 |
| `Escape` | 편집 패널·메뉴 닫기 |
| `Space` | 포커스된 native checkbox 토글 |
| `N` | 입력 필드가 활성 상태가 아닐 때 새 할 일 입력으로 이동 |
| `/` | 입력 중이 아닐 때 검색으로 이동 |

단축키는 추가 편의 기능이므로 핵심 기능을 단축키에만 숨기지 않는다.

### 최소 데이터 구조

권장 구조는 다음 수준이면 충분하다.

```text
AppData
  version: 1
  tasks: Task[]

Task
  id: string
  title: string
  createdAt: ISO timestamp
  updatedAt: ISO timestamp
  dueDate: "YYYY-MM-DD" | null
  focusDate: "YYYY-MM-DD" | null
  priority: "none" | "low" | "medium" | "high"
  category: string | null
  completedAt: ISO timestamp | null
  isDemo: boolean
```

삭제 후 즉시 배열에서 제거해도 되며, Undo를 위해 직전 삭제 task를 일시적으로 메모리에 보관한다. 더 강한 복구가 필요하면 `deletedAt`을 추가할 수 있으나 **오늘 안에 구현하는 기본안에서는 불필요한 영속 Trash까지 만들 필요는 없다.**

저장 key 예:

```text
focusday:v1
```

실제 앱 이름이 정해지면 변경한다.

`localStorage`는 origin별 저장 영역을 제공하고 현재 세션 이후에도 사용할 수 있는 클라이언트 저장 수단이지만, 브라우저 정책이나 사용자의 데이터 삭제에 의해 영구 보존을 보장할 수 있는 것은 아니다. 따라서 README에는 “서버 백업 없음”을 명확히 적는다. citeturn20search3

### 날짜 처리

`dueDate`, `focusDate`는 UTC timestamp가 아니라 **사용자의 로컬 달력 날짜인 `YYYY-MM-DD`**로 저장한다.

오늘 날짜를 구할 때:

```text
new Date().toISOString().slice(0, 10)
```

를 그대로 쓰지 않는 편이 안전하다. UTC 변환 때문에 한국 시간 자정 주변에서 날짜가 다르게 계산될 수 있기 때문이다.

대신 현재 브라우저의 `getFullYear()`, `getMonth()`, `getDate()`를 이용해 local date key를 생성한다.

앱이 열린 상태에서 날짜가 바뀌는 경우를 위해 window focus 또는 `visibilitychange`에서 오늘 날짜를 다시 계산한다.

새 날짜가 되면:

- 어제의 `focusDate` 작업은 자동으로 오늘 목록에서 빠진다.
- task 자체는 `전체`에 그대로 남는다.
- 기한이 과거가 됐다면 `기한 초과`로 오늘 화면에 나타난다.

이는 Microsoft My Day의 “새 날에는 깨끗한 daily list, 원본 task는 유지”라는 정신 모델과 일치하지만, 구현 방식은 이번 앱의 로컬 데이터 모델에 맞춘 별도 설계다. citeturn15search3

### 정렬 규칙

드래그앤드롭을 구현하지 않는 대신 결과가 예측 가능한 자동 정렬을 사용한다.

Today:

```text
기한 초과
  오래 지난 날짜 → 최근 날짜
  같은 날짜면 high → medium → low → none

오늘
  high → medium → low → none
  같은 priority면 createdAt
```

전체:

```text
오늘/기한 초과 작업
미래 기한 작업
기한 없는 작업
```

각 그룹 안에서는 우선순위와 생성 순서를 적용한다.

복잡한 사용자 지정 sort UI는 만들지 않는다.

### 긴 제목과 많은 항목

제목은 `200자` 정도에서 제한한다.

리스트에서는 desktop 2줄, 모바일 2~3줄까지 보이고 넘치면 시각적으로 clamp할 수 있다. 세부 편집기에서는 전체 제목을 확인할 수 있어야 한다.

많은 task가 있다고 가정한 검증 데이터는 최소 100~200개까지 만들어 레이아웃과 검색이 깨지지 않는지 확인하되, 실제 측정 전에는 “고성능”이라고 README에 쓰지 않는다.

### 예시 데이터

첫 실행에 예시 데이터를 자동 삽입하지 않는다.

빈 상태에:

> `예시로 둘러보기`

를 둔다.

누르면 다음과 같은 5개 정도를 넣는다.

```text
택배 반품 접수
  어제 기한 · 높음

발표 자료 최종 확인
  오늘 기한 · 업무 · 높음

세탁소 들르기
  오늘에 추가 · 개인

카드 명세서 확인
  이번 주 기한 · 개인 · 보통

주말 장보기
  기한 없음 · 개인
```

모두:

```text
isDemo: true
```

로 표시한다.

중요한 규칙:

- 실제 task가 존재할 때 demo load가 사용자 데이터를 지우지 않는다.
- 예시 데이터를 추가한 뒤 사용자가 새로 만든 task는 `isDemo: false`.
- `예시 데이터 제거`는 `isDemo === true`인 항목만 삭제한다.
- `전체 데이터 초기화`는 별도 위험 작업이며 확인 dialog를 거친다.

문구:

> **모든 할 일을 삭제할까요?**  
> 이 기기에 저장된 할 일이 모두 삭제되며 되돌릴 수 없습니다.  
> `취소` `모두 삭제`

### 최소 구현 범위와 권장 최종 범위

**최소 구현 범위**

오늘 안에 반드시 먼저 완성할 것은 다음이다.

1. task 제목 추가
2. Today / 전체 전환
3. 오늘에 추가·제거
4. 기한 설정
5. 제목·기한 수정
6. 완료 및 완료 복원
7. 삭제 + 즉시 Undo
8. localStorage 저장/불러오기
9. desktop/mobile responsive layout
10. empty/error/focus 상태

여기까지 완성하고 검증하기 전에는 새로운 기능을 추가하지 않는다.

**권장 최종 범위**

최소 범위가 안정적일 때만 추가한다.

- priority
- single category
- title/category 검색
- demo dataset
- 저장 상태 표시
- keyboard shortcut
- 완성도 높은 empty state
- reduced-motion 등 접근성 polish
- 아주 짧은 완료 transition

**이번에는 제외**

- 로그인
- 서버
- cloud sync
- 팀 협업
- sharing
- 캘린더 화면
- 시간 단위 스케줄링
- 반복 task
- notification/reminder
- browser를 닫은 뒤의 background notification
- subtasks
- task notes
- file attachment
- habit tracker
- Pomodoro
- gamification
- AI assistant
- voice capture
- natural-language date parser
- drag & drop
- bulk selection
- custom themes
- dark mode
- PWA 설치 기능

여기서 일부가 구현하기 쉬워 보여도 넣지 않는 것이 좋다. **남은 시간을 상태 검증·responsive 보정·README·스크린샷에 쓰는 편이 제출물의 완성도를 더 높인다.**

## 구현·검증·시연

**당일 구현 우선순위와 검증·시연 계획**

권장 작업 순서는 기능 개발 순서이면서 동시에 Git commit 단위가 될 수 있다.

**기반 단계**

React/TypeScript/Vite 프로젝트를 만들고 task model과 localStorage adapter부터 구현한다. UI보다 먼저 “새로고침해도 데이터가 남는 최소 task”를 확인한다.

**핵심 흐름 단계**

Today / 전체 → Quick Add → focusDate → dueDate → 완료 → 편집 → 삭제/Undo를 완성한다.

이 시점에 제품의 핵심 가치가 이미 작동해야 한다.

**responsive 단계**

desktop sidebar/detail drawer와 mobile bottom navigation/bottom sheet를 적용한다.

**견고성 단계**

storage exception, local date boundary, 빈 제목, 긴 제목, 100개 이상의 task, 검색 없음, overdue 등을 검증한다.

**polish 단계**

색·간격·focus ring·microinteraction·empty state·demo 데이터를 넣는다.

**문서 단계**

검증 기록, screenshot, 설계 근거, AI 사용 과정, 알려진 제한을 README에 넣는다.

### 수용 기준

아래는 **실행해야 할 테스트 명세**이지 이미 통과한 결과가 아니다. 구현 후 실제 브라우저·화면 크기·결과를 기록해야 한다.

| 사용자가 수행할 행동 | 기대 결과 |
|---|---|
| Today 화면에서 제목을 입력하고 Enter | task가 즉시 Today에 나타나고 제목이 정확히 저장된다. |
| 전체 화면에서 task를 생성 | 전체에는 보이지만 기한이 오늘이 아니고 `오늘에 추가`하지 않았다면 Today에는 나타나지 않는다. |
| 전체 task의 `오늘에 추가` 실행 | 기한을 바꾸지 않고 Today에도 나타난다. |
| 내일 기한 task를 만든 뒤 Today에 추가 | Today에 보이지만 metadata는 `내일 기한`으로 유지된다. |
| 어제 날짜를 기한으로 지정 | Today의 `기한 초과` 영역에 나타나고 색 외에 `기한 초과` 텍스트가 표시된다. |
| task 완료 | active list에서 완료 상태로 이동하고 `실행 취소` 피드백을 받을 수 있다. |
| 완료 직후 Undo | 동일한 task가 미완료 상태로 복귀한다. |
| task 삭제 후 Undo | 삭제 전 제목·날짜·우선순위·분류 상태가 복구된다. |
| 제목·기한·우선순위를 수정하고 새로고침 | 수정된 데이터가 그대로 유지된다. |
| task를 여러 개 만든 뒤 브라우저 새로고침 | 저장 실패가 없었다면 모든 task가 유지된다. |
| storage 저장을 의도적으로 실패시키는 테스트 | 성공한 것처럼 표시하지 않고 저장 실패 안내가 나타난다. |
| 200자에 가까운 제목 입력 | row가 가로로 넘치지 않고 editor에서 전체 제목을 확인할 수 있다. |
| 100~200개 demo/test task 생성 | UI가 깨지지 않고 scroll/search가 작동한다. 성능 결과는 실제 측정 후 기록한다. |
| 검색어가 없는 결과 입력 | 명확한 검색 결과 없음 empty state와 검색 초기화 방법이 보인다. |
| keyboard만 사용해 추가→편집→완료 | mouse 없이 핵심 flow를 수행할 수 있고 focus indicator가 보인다. |
| 화면 폭 약 1366×768 또는 1440×900 | sidebar, list, editor가 겹치지 않고 핵심 작업이 화면 내에서 가능하다. |
| 화면 폭 약 390×844 | 수평 overflow가 없고 주요 터치 control이 충분히 크며 bottom navigation/editor가 겹치지 않는다. |
| 날짜 경계를 테스트용으로 변경 | 이전 focusDate task는 오늘 집중 목록에서 빠지고, 지난 dueDate는 overdue가 된다. |
| demo 데이터가 있는 상태에서 실제 task 작성 후 `예시 데이터 제거` | demo task만 없어지고 실제 task는 남는다. |

접근성은 단순한 자동 검사 한 번으로 “준수” 판정하지 않는다. W3C는 WCAG 성공 기준 검증에 자동 테스트와 사람이 수행하는 기능적 평가가 함께 필요할 수 있음을 설명한다. citeturn19search13

### 권장 실제 검증 환경

최소:

```text
Chrome 최신 버전 / 노트북
Chrome DevTools responsive 390×844
```

가능하다면 추가:

```text
실제 스마트폰 Chrome 또는 Safari
keyboard-only desktop test
```

README에는 실행하지 않은 환경을 `검증 완료`로 쓰지 않는다.

검증 표 예:

| 항목 | 환경 | 결과 | 비고 |
|---|---|---|---|
| Core flow | Chrome / 1440×900 | 구현 후 기입 | |
| Refresh persistence | Chrome | 구현 후 기입 | |
| Mobile layout | 390×844 | 구현 후 기입 | |
| Keyboard flow | Chrome | 구현 후 기입 | |
| Storage failure | DevTools/test injection | 구현 후 기입 | |

### 교수님에게 보여줄 2~3분 시연

**첫 20초 — 제품 가치**

Today 빈 상태 또는 준비된 예시 데이터로 시작한다.

> “이 앱은 전체 할 일을 복잡하게 관리하기보다, 계정 없이 빠르게 기록하고 오늘 할 일만 고르는 개인용 task manager입니다.”

**다음 30초 — 빠른 입력**

`발표 자료 최종 확인` 입력 → Enter.

두 번째 task:

`자료 출처 정리`

전체에서 생성한 뒤 `오늘에 추가`.

핵심은 별도 설정 화면 없이 바로 저장되는 모습을 보여주는 것이다.

**다음 30초 — Today와 기한 차이**

한 task는 `오늘에 추가`, 기한은 `내일`.

> “오늘 하기로 선택하는 것과 실제 기한을 분리했습니다.”

이 한 장면이 이번 제품의 가장 중요한 설계 결정이다.

**다음 20초 — 완료와 실수 복구**

작업 체크 → 완료.

곧바로 `실행 취소`.

이때 즉각적인 feedback과 복구를 보여준다.

**다음 20초 — 새로고침**

task를 수정한 뒤 페이지 새로고침.

데이터 유지 확인.

> “서버와 로그인이 없고 브라우저 로컬에 저장됩니다.”

단, 영구 백업을 의미한다고 말하지 않는다.

**다음 20초 — 모바일**

DevTools device toolbar 또는 실제 휴대폰에서 열어 Today/전체 탐색과 detail bottom sheet를 보여준다.

desktop UI를 단순 축소한 것이 아니라 장치에 맞게 navigation/editor가 바뀐다는 점을 강조한다.

**마지막 20~30초 — AI 활용 증거**

GitHub README로 이동해:

- 조사 근거
- 설계 결정
- AI implementation prompt
- 실제 테스트 결과
- Git commit history

를 빠르게 보여준다.

이 과제는 AI 활용 자체가 평가 포인트이므로, 단순히 “AI로 코드를 만들었다”가 아니라 **리서치 → 범위 결정 → 구현 → AI code review → 검증 → 문서화**에 AI를 썼다는 연결 구조가 더 설득력 있다.

## 문서화와 인계

**README 및 AI 활용 증거 구성안**

README의 첫 화면부터 기술 스택을 나열하기보다 **제품을 먼저 보여주는 것**이 좋다.

권장 구조:

```text
# Focusday
생각난 일은 빠르게 담고, 오늘 할 일만 선명하게.

[대표 desktop screenshot]
[Live Demo] [Run locally]

## What it solves
## Core experience
## Screenshots
## Why it is designed this way
## Features and intentional exclusions
## How to run
## Data & privacy
## Architecture
## Validation
## Known limitations
## How AI was used
## Research sources
```

### README에서 가장 먼저 보여줄 것

상단에는 다음 네 가지가 한 화면에 보여야 한다.

**한 줄 제품 설명**

> 계정 없이 할 일을 저장하고, 전체 목록에서 오늘 집중할 일만 골라 실행하는 local-first task manager.

**대표 screenshot**

Today 화면 desktop 한 장.

가능하면 mobile 한 장도 아래에 배치한다.

**Live Demo**

GitHub Pages 주소.

**핵심 차별점**

> Today focus ≠ Due date  
> Local-only, no account  
> Undo-first interaction

### 조사 근거와 설계 결정 연결

일반적인 “Todoist를 참고했다”로 끝내지 않는다.

예:

| 조사 발견 | 설계 결정 |
|---|---|
| Microsoft My Day는 daily focus를 원본 task와 분리한다. citeturn15search3 | `focusDate`와 `dueDate` 분리 |
| Things는 Inbox에서 일단 잡고 나중에 정리한다. citeturn14search24 | 제목만으로 Quick Add |
| NN/G는 uncommon option의 progressive disclosure를 권한다. citeturn19search6 | priority/category를 editor로 이동 |
| Superlist는 최근 Undo와 데이터 복구를 강화했다. citeturn19search0 | 완료·삭제 Undo, 저장 실패 상태 |
| WCAG 2.2는 focus, contrast, target size 기준을 제시한다. citeturn19search2turn19search5turn20search0 | visible focus, 대비 token, 충분한 터치 영역 |

이 표 하나가 단순한 모방이 아니라 **근거 기반 설계**임을 잘 보여준다.

### AI 활용 증거

추천 디렉터리:

```text
docs/
  research.md
  product-spec.md
  ai-prompts/
    01-implementation.md
    02-ux-review.md
    03-bug-review.md
    04-accessibility-review.md
    05-readme-review.md
  validation.md
  decisions.md
```

`research.md`에는 이번 조사 결과를 요약한다.

`product-spec.md`에는 최종 기능 범위와 상태 모델을 넣는다.

AI prompt는 전부 저장할 필요는 없으며, **실제로 제품을 바꾼 의미 있는 prompt**를 남긴다.

예를 들어:

- 최초 구현 prompt
- 저장 오류 검토 prompt
- responsive UI review prompt
- accessibility review prompt
- 날짜 경계 bug review prompt
- README 개선 prompt

각 prompt 아래에 가능하면:

```text
Result:
- accepted:
- modified:
- rejected:
- why:
```

를 남긴다.

이렇게 하면 “AI 출력물을 무조건 사용했다”가 아니라 **AI 결과를 평가하고 선택했다**는 증거가 된다.

### 권장 Git commit 단위

아직 수행하지 않은 commit을 수행했다고 기록하면 안 된다. 아래는 권장 계획이다.

```text
docs: add research-backed product brief

feat: add task model and local persistence

feat: implement today and all task flows

feat: add task editing, completion and undo

feat: add responsive desktop and mobile layouts

fix: handle local date boundaries and storage failures

feat: add search, demo data and empty states

test: document core flow and responsive verification

docs: add screenshots, validation results and AI workflow
```

한 번에 모든 코드를 생성한 뒤 `initial commit` 하나만 남기는 것보다, 실제 개발 흐름에 맞춰 의미 있는 상태에서 commit하는 편이 과정을 설명하기 쉽다.

단, **Git history를 과제 제출용으로 꾸며내기 위해 존재하지 않은 중간 개발 과정을 사후 조작해서는 안 된다.** 실제 작업 단위에서 commit한다.

### validation 문서

`docs/validation.md`에는 계획이 아니라 실제 결과만 쓴다.

예:

```text
## Test environment
- Date:
- Browser/version:
- Screen size:
- Device:

## Core flow
PASS / FAIL
Evidence:

## Refresh persistence
PASS / FAIL

## Mobile layout
PASS / FAIL

## Keyboard navigation
PASS / FAIL

## Known defects
...
```

실패한 항목도 숨기지 않는다. 수정하지 못했다면 README의 known limitations와 연결한다.

### 알려진 제한에 포함할 것

최종 결과에 실제로 해당하면 명시한다.

- server/cloud backup 없음
- 다른 기기와 동기화하지 않음
- browser/site data 삭제 시 task가 사라질 수 있음
- browser가 닫힌 상태의 알림 제공 안 함
- multi-tab 동시 편집 보장 안 함
- drag-and-drop 없음
- recurring task 없음
- 삭제 Undo는 제한된 시간만 제공
- 사용자 연구를 실시하지 않았음

localStorage는 장기 보존용으로 활용할 수 있지만 browser policy나 사용자의 데이터 정리 설정에 의해 삭제될 수 있기 때문에 클라우드 백업과 동일시해서는 안 된다. WHATWG 표준도 사용자 에이전트 정책이 persistent storage에 영향을 줄 수 있음을 명시한다. citeturn20search3

**개발 AI에게 전달할 ‘구현 인계 요약’**

아래 블록은 후속 제작 프롬프트의 핵심 입력으로 그대로 사용할 수 있는 수준으로 작성했다.

> **제품 목표**  
> 계정·서버 없이 동작하는 개인용 responsive task manager를 만든다. 핵심 경험은 “빠른 입력 → 전체 task 정리 → 오늘 집중할 task 선택 → 완료 → 실수 복구”다. 생산성 suite가 아니라 task management에만 집중한다.
>
> **주 사용자 가설**  
> 해야 할 일을 자주 떠올리지만 복잡한 project-management 체계나 많은 설정을 유지하고 싶지 않은 개인 사용자. 이 가설은 경쟁 제품 조사에 기반하며 실제 사용자 검증을 마친 것은 아니다.
>
> **핵심 가치**  
> “해야 할 일을 잊지 않게 담고, 오늘 할 일만 선명하게 골라 바로 실행한다.”
>
> **정보 구조**  
> 최상위 view는 `오늘`과 `전체` 두 개만 둔다. 별도 Calendar, Projects, Notes, Habits 화면은 만들지 않는다. 완료 task는 접을 수 있는 완료 영역으로 제공한다.
>
> **Today 규칙**  
> 미완료 task 중 `focusDate === today`, `dueDate === today`, `dueDate < today` 중 하나를 만족하면 Today에 표시한다. 과거 dueDate task는 `기한 초과` section에 먼저 표시한다. `focusDate`와 `dueDate`는 독립적이다.
>
> **Task model**  
> `id`, `title`, `createdAt`, `updatedAt`, `dueDate|null`, `focusDate|null`, `priority`, `category|null`, `completedAt|null`, `isDemo`.  
> `priority = none | low | medium | high`.  
> `dueDate`와 `focusDate`는 local-calendar `YYYY-MM-DD`.
>
> **빠른 입력**  
> 제목만 필수다. desktop은 page header 아래 persistent quick-add input을 제공하고 Enter로 생성한다. mobile은 명확한 `+ 할 일 추가` 버튼/compact composer를 제공한다. 날짜·우선순위·분류는 처음부터 강제하지 않고 detail editor에서 설정한다. 한글 IME composition 중 Enter 제출 오류를 방지한다.
>
> **Task row**  
> native checkbox + title + 필요한 metadata chip만 표시한다. due, overdue, priority, category, Today 상태를 읽기 쉬운 text label로 표현한다. 색만으로 상태를 전달하지 않는다.
>
> **Task editor**  
> desktop에서는 right drawer, mobile에서는 bottom sheet. 제목, `오늘에 추가`, 기한, priority, category, delete를 제공한다. `Escape`로 닫을 수 있고 logical focus behavior를 갖는다.
>
> **완료**  
> checkbox를 누르면 `completedAt` 기록. immediate visual feedback. snackbar `할 일을 완료했습니다. 실행 취소`. 완료 영역에서도 `미완료로 되돌리기` 가능.
>
> **삭제**  
> secondary action으로 제공. 삭제 직후 snackbar `할 일을 삭제했습니다. 실행 취소`. 최소 구현에서는 snackbar가 있는 동안만 delete undo를 보장한다.
>
> **검색**  
> 최소 기능 완료 후 추가한다. title/category에 대한 case-insensitive local substring search만 구현한다. 결과 없음 empty state를 제공한다.
>
> **빈 상태**  
> 최초 데이터 없음: `해야 할 일을 하나 적어보세요` + `첫 할 일 추가` + secondary `예시로 둘러보기`.  
> Today 없음: `오늘은 비어 있습니다. 전체 할 일에서 오늘 할 일을 고르거나 새 할 일을 추가해 보세요.`  
> 검색 없음: `"검색어"와 일치하는 할 일이 없습니다.`
>
> **예시 데이터**  
> 자동 삽입 금지. 사용자가 `예시로 둘러보기`를 눌렀을 때만 추가한다. demo task는 `isDemo=true`. `예시 데이터 제거`는 demo task만 삭제하며 실제 사용자 task를 절대 덮어쓰거나 제거하지 않는다.
>
> **로컬 저장**  
> versioned JSON을 하나의 localStorage key에 저장한다. load/parse/write 모두 error handling을 한다. `setItem` 실패 시 변경사항을 saved로 표시하지 않고 persistent banner로 저장 실패를 안내한다. 서버·API·로그인·DB를 사용하지 않는다.
>
> **날짜 경계**  
> UTC `toISOString().slice(0,10)`를 today key에 사용하지 않는다. 브라우저 local calendar component로 `YYYY-MM-DD`를 생성한다. visibility/focus 시 today를 다시 계산한다. 어제 focusDate task는 새 날 Today에서 빠지지만 All에는 남고, 지난 dueDate는 overdue가 된다.
>
> **desktop layout**  
> 약 900px 이상: 220~240px sidebar + 최대 760~820px main list. sidebar에 Today/All. task detail은 right drawer/overlay. 넓은 빈 공간과 명확한 hierarchy를 사용한다.
>
> **mobile layout**  
> sidebar 제거. top page title + bottom navigation Today/All. task editor는 bottom sheet. horizontal overflow 금지. 중요한 touch control은 프로젝트 내부 목표로 약 44×44px 이상 확보.
>
> **design**  
> quiet/minimal productivity style.  
> bg `#F8FAFC`; surface `#FFF`; text `#111827`; secondary `#475569` 또는 `#64748B`; accent `#4F46E5`; focus `#4338CA`; danger `#B91C1C`.  
> system font. body/task 16px. 4/8/12/16/24/32 spacing scale. radius 8~16px. subtle shadow only. no heavy gradient/glass/animated decoration. 외부 product의 브랜드 UI를 복제하지 않는다.
>
> **접근성**  
> semantic HTML, native button/input/checkbox 우선. 모든 핵심 flow keyboard 가능. visible focus ring. logical Tab order. normal text contrast >= 4.5:1을 검증한다. 색만으로 status를 전달하지 않는다. icon-only button에는 accessible name. snackbar/status는 적절한 live region 사용. reduced-motion 고려.
>
> **필수 구현 범위**  
> Quick Add, Today, All, Today add/remove, due date, edit, complete/uncomplete, delete+undo, local persistence, responsive layout, empty/error states, storage failure behavior, date boundary.
>
> **권장 최종 범위**  
> priority, single category, search, demo dataset, keyboard shortcut, polished empty states, reduced-motion, subtle transition.
>
> **명시적 제외 범위**  
> 로그인, cloud sync, 서버, 협업, 공유, calendar view, time blocking, notes, subtasks, habits, Pomodoro, gamification, repeating task, reminders/background notification, in-app AI, voice/NLP, drag-and-drop, bulk edit, theme system, PWA.
>
> **기술 기본안**  
> React + TypeScript + Vite + plain CSS. 별도 router/state-management/UI framework 불필요. GitHub Pages 정적 배포. repository Pages 경로라면 Vite `base`를 repo path에 맞게 설정한다. citeturn19search3turn20search2
>
> **수용 기준**  
> 제목 추가가 즉시 보일 것; Today/All 규칙이 정확할 것; focusDate와 dueDate가 독립적일 것; overdue가 명확할 것; 완료·삭제 Undo가 작동할 것; 수정 후 refresh해도 유지될 것; storage failure를 성공으로 표시하지 않을 것; 200자 제목이 layout을 깨지 않을 것; 100~200 task에서 기본 조작이 유지될 것; 1366/1440 desktop 및 약 390px mobile에서 horizontal overflow가 없을 것; keyboard-only 핵심 flow가 가능할 것; demo 제거가 사용자 task를 지우지 않을 것.
>
> **완성 순서**  
> 데이터 model/storage → core CRUD → Today logic → completion/undo → responsive layout → error/edge cases → accessibility → search/demo → polish → validation → README. 핵심 flow 검증 전에는 새 기능을 추가하지 않는다.

## 출처와 확인 상태

**출처 목록**

아래 자료는 조사 기준일인 **2026년 10월 2일**에 웹에서 확인한 자료다. 제품의 홍보성 설명은 제품 측 주장으로, 공식 도움말은 문서화된 동작으로, App Store 및 공개 커뮤니티 의견은 개별 사용자 의견으로 구분해서 해석했다.

**Todoist 공식 자료**

- Todoist Help — Today view: 현재 Today에서 기한 초과·all-day·time-blocked 작업을 검토하고 재조정하는 흐름. citeturn13search0
- Todoist Help — Task view: task 상세 화면에서 제목·날짜·하위 작업 등 관리. citeturn13search24
- Todoist Help — Scheduling: 날짜 변경 및 overdue reschedule. citeturn13search32
- Todoist Help — Filters: 날짜·priority·label 기반 필터 구조. citeturn13search16
- Todoist — Ramble 및 2026년 도움말: 음성 입력에서 날짜·deadline·priority 등을 해석하는 현재 AI 입력 기능. citeturn21search0turn21search3

**Things 공식 자료**

- Cultured Code — Quick Entry: Mac에서 `Ctrl+Space`로 어디서나 task 캡처. citeturn14search0
- Cultured Code — Today, Upcoming, Anytime, Someday: Inbox와 날짜 기반 기본 목록의 목적. citeturn14search24
- Cultured Code — Keyboard Shortcuts: desktop keyboard-oriented task creation/navigation. citeturn14search6
- Cultured Code — Trying the App: Mac과 모바일의 Quick Entry·keyboard·gesture 차이. citeturn14search18
- Cultured Code — Features overview: 일정·태그·자연어·Quick Find 등 현재 기능 체계. citeturn14search27

**Microsoft To Do 공식 자료**

- Microsoft Support — My Day and Suggestions: My Day가 매일 reset되고 미완료 task가 원본 목록에 유지되는 동작. citeturn15search3
- Microsoft Support — Use My Day with To Do: 자정 초기화와 원본 task 보존. citeturn15search0
- Microsoft Support — Manage tasks with To Do: My Day, Important, Planned, All, Completed 등 smart list와 task detail 기능. citeturn15search1
- Microsoft Support — Due dates and reminders: 오늘·내일·다음 주·사용자 지정 기한 설정. citeturn15search4
- Microsoft accessibility documentation — screen reader에서 My Day Suggestions를 사용하는 흐름. citeturn15search7

**TickTick**

- TickTick 공식 사이트: task 외 calendar·habit 등 넓은 제품 범위. citeturn16search1
- Google Play 공식 listing: typing/voice 및 Smart Date Parsing. citeturn16search13
- 미국 App Store listing, 2026-10-02 확인: 46K ratings, 4.9, 해당 시점 Productivity #139, 기능 설명 및 2025-06-26 공개 리뷰. 순위는 한 시점의 미국 스토어 값일 뿐 지속적 인기의 근거로 사용하지 않았다. citeturn18search0
- r/TickTick의 최근 공개 의견: 기능·디자인·사용 방식에 대한 일부 이용자의 의견으로만 참고했으며 전체 사용자 요구로 일반화하지 않았다. citeturn16search25turn16search37

**Apple Reminders**

- Apple Support — Smart Lists: Today에 오늘 기한 및 overdue reminders가 표시되고 Scheduled, All, Flagged, Completed 등을 제공. citeturn17search0
- Apple Support — Add or change reminders: 날짜·시간·태그·priority·flag 및 자연어 입력. 현재 문서는 macOS 27의 Apple Intelligence 관련 기능도 설명한다. citeturn17search1
- Apple Support — Custom Smart Lists: 태그·날짜·시간·priority·flag·location 등 필터. citeturn17search5
- Apple App Store — Reminders 기능 설명. citeturn17search2
- Apple App Store 공개 reviews: 단순성, Siri 활용, 색상 분류 요구 등 개별 의견. 리뷰 모집단 전체를 대표한다고 해석하지 않았다. citeturn17search9

**Superlist**

- Superlist Updates — 1.56, 2026-06-27: desktop/web 다중 선택, mobile long-press selection, startup 개선, local-data recovery. citeturn19search0
- Superlist Updates — 1.57, 2026-08-14: recurring task 개선, Activity Log, multiselect 기능 확장. citeturn14search2
- Superlist Updates — 1.53, 2026-04-16: list sort options. citeturn14search26

**Google Tasks**

- Google Workspace — Google Tasks: list, subtasks, star, drag ordering, date/time, Calendar integration 및 현재 Workspace 연결 구조. citeturn17search3
- 미국 App Store, 2026-10-02 확인: 107K ratings, 4.8, 해당 시점 Productivity #85 및 현재 기능 설명. 역시 한 시점의 미국 스토어 스냅샷으로만 사용했다. citeturn18search1

**사용성·상호작용 근거**

- Nielsen Norman Group — Progressive Disclosure: 고급·저빈도 기능을 secondary level로 미뤄 초기 학습 부담과 오류를 줄이는 원칙. citeturn19search6
- Nielsen Norman Group — Aesthetic and Minimalist Design: 불필요한 UI와 콘텐츠가 중요한 정보와 경쟁한다는 원칙. citeturn19search1
- Nielsen Norman Group — Usability Heuristics for Complex Applications: system status, user control, error recovery, minimal design 등의 적용. citeturn19search4
- Nielsen Norman Group — Visibility of System Status: interaction 직후 즉각적인 feedback의 중요성. citeturn19search8

**접근성 기준**

- W3C WCAG 2.2 — Contrast Minimum: 일반 텍스트 4.5:1 기준의 설명. citeturn19search5
- W3C WCAG 2.2 — Focus Appearance: keyboard focus indicator의 가시성과 대비. citeturn19search2
- W3C WCAG 2.2 — Target Size Minimum: 24 CSS px 기준 및 spacing exception 설명. citeturn20search0
- W3C WCAG 2.2 — Focus Order: 콘텐츠 의미와 작업 순서에 맞는 focus 순서. citeturn19search11
- W3C WCAG 2.2 — Dragging Movements: drag 기능의 non-dragging equivalent 제공 원칙. citeturn19search14
- W3C — Understanding Conformance: WCAG 준수 판단과 기능·사용성 테스트의 관계. citeturn19search13

**저장·배포 기술 근거**

- WHATWG HTML Standard — Web Storage: `localStorage`의 origin별 storage, 세션을 넘는 저장 용도, `QuotaExceededError` 및 `SecurityError` 가능성. citeturn20search1turn20search3
- Vite 공식 배포 문서 — GitHub Pages의 repository path 배포 시 `base` 설정 방법과 GitHub Actions 배포 예시. citeturn19search3
- GitHub Docs — GitHub Pages Quickstart 및 GitHub Free public repository에서의 Pages 제공. citeturn20search2

**최종 확인 상태:** 경쟁 제품의 공식적으로 문서화된 기능·업데이트와 공개 스토어 정보는 확인했다. 직접 경쟁 앱을 설치해 first-run onboarding과 모든 세부 interaction을 실사용 비교하지는 않았고, 사용자 인터뷰·과업 테스트·프로토타입 성능 측정도 아직 실시하지 않았다. 따라서 이 보고서가 확정하는 것은 **구현 전 설계 방향과 검증 계획**이며, 실제 사용성·출시 적합성은 후속 구현과 실제 검증 결과가 나온 뒤에만 판단해야 한다.