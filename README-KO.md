# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·요약·태그 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- 자유 형식 노트와 원문 링크 연결
- 주제별 컬렉션
- 모바일, 키보드 탐색, 인쇄 화면 지원

라이브러리는 실제 논문을 넣기 전까지 빈 상태로 표시됩니다.

## 논문을 작성하는 곳

논문마다 `papers/` 폴더 안에 별도 파일을 하나씩 둡니다. `index.html`이나 통계 숫자를 직접 수정할 필요는 없습니다.

```text
papers/
├─ index.js                 ← 사이트에 불러올 논문 파일 목록
├─ template.js              ← 새 논문을 만들 때 복사하는 빈 양식
├─ holographic-antenna.js   ← Holographic Antennas용 빈 파일
└─ inverse-design.js        ← Inverse Design용 빈 파일
```

두 빈 논문 파일은 `title`을 작성하기 전까지 사이트에 표시되지 않습니다.

### 가장 쉬운 방법

정리할 논문의 PDF나 DOI와 함께 아래처럼 요청하면 새 파일 생성, 목록 등록, 사이트 반영까지 처리할 수 있습니다.

```text
이 논문을 새 파일로 추가해줘.
파일 이름: my-paper-title.js
상태: 읽는 중
주제: inverse-design
PDF 또는 DOI: ...
```

### 직접 작성하는 방법

첫 두 논문은 [holographic-antenna.js](papers/holographic-antenna.js) 또는 [inverse-design.js](papers/inverse-design.js)를 열고 내용을 채우기만 하면 됩니다. 두 파일은 이미 목록에 등록되어 있습니다.

새 논문을 추가할 때는 다음 순서로 작업합니다.

1. [template.js](papers/template.js)를 복사합니다.
2. `papers/` 폴더에 `my-paper-title.js`처럼 새 이름으로 저장합니다. 파일 이름은 영문 소문자와 하이픈 사용을 권장합니다.
3. 새 파일에서 `title`과 필요한 내용을 작성합니다.
4. [index.js](papers/index.js)의 `paperFiles` 배열에 `"./my-paper-title.js",` 한 줄을 추가합니다.
5. 저장한 뒤 GitHub에 올리면 사이트에 자동으로 나타납니다.

`title`만 필수이고 나머지는 준비된 만큼만 채워도 됩니다.

- `title`(필수): 논문 제목. 비어 있으면 카드가 만들어지지 않습니다.
- `citation`: `저자 · 학술지 또는 학회 · 출판연도` 순서로 적습니다.
- `status`: `done`(정리 완료), `reading`(읽는 중), `queue`(대기)
- `topics`: `holographic`, `metasurfaces`, `inverse-design`, `ai-em` 중 하나 이상 선택. 여러 개라면 `["holographic", "inverse-design"]`처럼 적습니다.
- `updated`: 이 노트를 마지막으로 수정한 날짜를 `YYYY-MM-DD` 형식으로 적습니다.
- `url`: `10.xxxx/...` 형식의 DOI 또는 `https://`로 시작하는 원문 주소. 없으면 비워 둡니다.
- `noteUrl`: 본인이 작성한 별도 논문 노트의 파일 경로나 페이지 주소. 없으면 비워 둡니다.
- `tags`: `["beam synthesis", "surface wave"]`처럼 입력합니다. 없어도 됩니다.
- `summary`: 카드에 표시할 짧은 한두 문장. 없어도 됩니다.

전체 논문 정리는 JavaScript 파일 안에 억지로 맞추지 않습니다. 본인이 편한 Markdown, HTML, 문서 서비스 등으로 별도 작성한 뒤 그 주소를 `noteUrl`에 넣으면 카드에 `노트 보기` 링크가 생깁니다.

저장하면 논문 카드, 전체 개수, 읽는 중 개수, 최근 날짜와 주제별 개수가 자동으로 바뀝니다. 사이트는 논문 정리 형식을 강제하지 않습니다.

## 파일 구성

- [papers/index.js](papers/index.js): 사이트에 불러올 논문 파일 목록
- [papers/template.js](papers/template.js): 새 논문용 빈 양식
- `papers/*.js`: 논문별 개별 노트
- `index.html`: 페이지의 고정 구조
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 카드 생성, 자동 통계, 검색, 필터, 정렬
- `assets/og-paper-log-calm.png`: 링크 공유용 미리보기 이미지

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

이 폴더를 정적 웹 서버로 열거나 GitHub Pages에 올리면 됩니다. 빌드와 패키지 설치는 필요하지 않습니다.
