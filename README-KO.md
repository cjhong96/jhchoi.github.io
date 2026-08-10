# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·카드 리뷰·태그 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- 논문별 메타데이터 파일과 자유형 Markdown 리뷰
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

reviews/
├─ template.md              ← 새 장문 리뷰를 만들 때 복사하는 빈 양식
├─ holographic-antenna.md   ← 위 JS 파일과 자동 연결되는 리뷰
└─ inverse-design.md        ← 위 JS 파일과 자동 연결되는 리뷰
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

첫 두 논문은 [holographic-antenna.js](papers/holographic-antenna.js) 또는 [inverse-design.js](papers/inverse-design.js)를 열어 카드 정보를 채우고, `reviews/`의 같은 이름 Markdown 파일에 장문 리뷰를 작성하면 됩니다. 두 JS 파일은 이미 목록에 등록되어 있습니다.

새 논문을 추가할 때는 다음 순서로 작업합니다.

1. [template.js](papers/template.js)를 복사해 `papers/my-paper-title.js`처럼 저장합니다. 파일 이름은 영문 소문자·숫자·하이픈만 사용합니다.
2. [template.md](reviews/template.md)를 복사해 `reviews/my-paper-title.md`처럼 **같은 파일 이름**으로 저장합니다.
3. 그림을 넣는다면 `reviews/my-paper-title/` 폴더를 만들고 그 안에 이미지 파일을 둡니다.
4. JS 파일에는 제목·서지·상태·태그와 카드에 보일 짧은 `review`를 작성합니다.
5. Markdown 파일에는 제목과 순서를 원하는 대로 정해 장문 리뷰를 작성합니다.
6. [index.js](papers/index.js)의 `paperFiles` 배열에 `"./my-paper-title.js",` 한 줄을 추가합니다.
7. 저장한 뒤 GitHub에 올리면 카드의 `리뷰 읽기` 링크가 상세 리뷰로 자동 연결됩니다.

`title`만 필수이고 나머지는 준비된 만큼만 채워도 됩니다.

- `title`(필수): 논문 제목. 비어 있으면 카드가 만들어지지 않습니다.
- `citation`: `저자 · 학술지 또는 학회 · 출판연도` 순서로 적습니다.
- `status`: `done`(정리 완료), `reading`(읽는 중), `queue`(대기)
- `topics`: `holographic`, `metasurfaces`, `inverse-design`, `ai-em` 중 하나 이상 선택. 여러 개라면 `["holographic", "inverse-design"]`처럼 적습니다.
- `updated`: 이 노트를 마지막으로 수정한 날짜를 `YYYY-MM-DD` 형식으로 적습니다.
- `tags`: `["beam synthesis", "surface wave"]`처럼 입력합니다. 없어도 됩니다.
- `review`: 카드에 표시할 리뷰 도입부 한두 문장. 없어도 됩니다. 기존 `summary`도 호환됩니다.

저장하면 논문 카드, 전체 개수, 읽는 중 개수, 최근 날짜와 주제별 개수가 자동으로 바뀝니다. 사이트는 논문 정리 형식을 강제하지 않습니다.

## 장문 리뷰 작성

`reviews/`의 Markdown 파일은 자유 형식입니다. `Introduction`, `Method`, `Experiments` 같은 제목은 예시일 뿐 필수 항목이 아닙니다. 상세 페이지의 논문 제목이 `h1`이므로 본문 큰 제목은 `##`, 그 아래 제목은 `###`부터 쓰면 됩니다.

- 문단, 목록, 인용, 표, 코드 블록을 일반 Markdown으로 작성할 수 있습니다.
- 이미지는 리뷰 파일을 기준으로 상대경로를 사용합니다. 예: `![설명](./my-paper-title/figure-01.webp)`
- 인라인 수식은 `$...$`, 블록 수식은 `$$...$$`로 작성합니다.
- 리뷰 파일이 아직 비어 있으면 상세 페이지에 작성 전 안내가 표시됩니다.
- `url`이나 `noteUrl` 필드는 필요하지 않습니다. JS와 Markdown의 같은 파일 이름으로 자동 연결됩니다.

## 파일 구성

- [papers/index.js](papers/index.js): 사이트에 불러올 논문 파일 목록
- [papers/template.js](papers/template.js): 새 논문용 빈 양식
- `papers/*.js`: 논문별 개별 노트
- [reviews/template.md](reviews/template.md): 자유형 장문 리뷰용 빈 양식
- `reviews/*.md`: 논문별 장문 리뷰 본문
- `review.html`: 모든 논문이 함께 사용하는 상세 리뷰 화면
- `index.html`: 페이지의 고정 구조
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 카드 생성, 자동 통계, 검색, 필터, 정렬
- `assets/og-paper-log-calm.png`: 링크 공유용 미리보기 이미지

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

`index.html`을 파일 탐색기에서 바로 열면 논문 파일을 불러올 수 없습니다. 이 폴더에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`으로 접속하거나, GitHub Pages에 올려 확인하세요. 별도 빌드와 패키지 설치는 필요하지 않습니다.
