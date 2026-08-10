# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·질문·태그 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- `Question / Method / Finding / Next` 형식의 펼침 노트
- 주제별 컬렉션과 현재 읽는 논문 큐
- 모바일, 키보드 탐색, 인쇄 화면 지원

라이브러리는 실제 논문을 넣기 전까지 빈 상태로 표시됩니다.

## 논문을 작성하는 곳

논문 내용은 **[papers.js](papers.js) 한 파일에서만 관리합니다.** `index.html`이나 통계 숫자를 직접 수정할 필요가 없습니다.

### 가장 쉬운 방법

정리할 논문의 PDF나 DOI와 함께 아래 네 가지를 Codex에 전달하면 `papers.js`에 바로 추가할 수 있습니다.

1. 읽기 상태: `정리 완료`, `읽는 중`, `대기` 중 하나
2. 이 논문을 읽는 이유 또는 알고 싶은 질문
3. 핵심이라고 생각한 내용
4. 다음에 확인할 내용이나 한계

### 직접 작성하는 방법

1. [papers.js](papers.js)를 엽니다.
2. 파일 안의 빈 템플릿 바로 앞과 뒤에 있는 주석 표시 두 줄을 지웁니다.
3. 따옴표 안의 제목, 서지정보, 링크, 날짜와 노트 내용을 채웁니다.
4. 저장한 뒤 GitHub에 올리면 사이트에 자동으로 나타납니다.

`title`만 필수이고 나머지는 준비된 만큼만 채워도 됩니다.

- `title`(필수): 논문 제목. 비어 있으면 카드가 만들어지지 않습니다.
- `citation`: `저자 · 학술지 또는 학회 · 출판연도` 순서로 적습니다.
- `status`: `done`(정리 완료), `reading`(읽는 중), `queue`(대기)
- `topics`: `holographic`, `metasurfaces`, `inverse-design`, `ai-em` 중 하나 이상 선택. 여러 개라면 `["holographic", "inverse-design"]`처럼 적습니다.
- `updated`: 이 노트를 마지막으로 수정한 날짜를 `YYYY-MM-DD` 형식으로 적습니다.
- `url`: `10.xxxx/...` 형식의 DOI 또는 `https://`로 시작하는 원문 주소. 없으면 비워 둡니다.
- `tags`: `["beam synthesis", "surface wave"]`처럼 입력합니다. 없어도 됩니다.

저장하면 논문 카드, 전체 개수, 읽는 중 개수, 최근 날짜, 주제별 개수와 `CURRENT FOCUS`가 모두 자동으로 바뀝니다.
`reading`인 논문이 여러 편이면 `updated`가 가장 최근인 한 편이 `CURRENT FOCUS`에 표시됩니다.

노트의 네 칸은 다음 역할을 갖습니다.

- `Question`: 이 논문이 답하려는 질문과 내가 읽는 이유
- `Method`: 사용한 방법, 설계 변수, 물리 제약, 검증 방식
- `Finding`: 나중에도 기억할 핵심 아이디어 한 문장
- `Next`: 한계, 반론, 재현할 것, 함께 읽을 다음 논문

## 파일 구성

- [papers.js](papers.js): 직접 작성하는 논문 데이터
- `index.html`: 페이지의 고정 구조
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 카드 생성, 자동 통계, 검색, 필터, 정렬
- `assets/og-paper-log-calm.png`: 링크 공유용 미리보기 이미지

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

이 폴더를 정적 웹 서버로 열거나 GitHub Pages에 올리면 됩니다. 빌드와 패키지 설치는 필요하지 않습니다.
