# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 논문 리뷰 아카이브입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·카드 문장·태그·리뷰 본문 통합 검색
- 태그 및 읽기 상태 필터
- 최근 업데이트·오래된 리뷰·제목순 정렬
- 논문별 자유 형식 Markdown 리뷰
- 태그별 리뷰 색인
- 모바일, 키보드 탐색, 인쇄 화면 지원

라이브러리는 실제 논문 제목을 넣기 전까지 빈 상태로 표시됩니다.

## 논문을 작성하는 곳

논문 하나는 `papers/` 폴더의 Markdown 파일 하나로 관리합니다. JS 파일, `index.html`, 통계 숫자는 직접 수정하지 않습니다.

```text
papers/
├─ index.txt                 ← 사이트에 표시할 Markdown 파일 이름 목록
└─ template.md               ← 새 논문을 만들 때 복사하는 빈 양식
```

새 논문은 `template.md`를 복사해 만들며, `index.txt`에는 실제로 표시할 파일만 등록합니다.

### 가장 쉬운 방법

정리할 논문의 PDF나 DOI와 함께 아래처럼 요청하면 Markdown 생성, 목록 등록, 사이트 반영까지 처리할 수 있습니다.

```text
이 논문을 Markdown 리뷰로 추가해줘.
파일 이름: 논문 제목.md
상태: 읽는 중
태그: inverse-design / rfic
PDF 또는 DOI: ...
```

### 직접 작성하는 방법

새 논문을 추가할 때는 다음 세 단계만 필요합니다.

1. [template.md](papers/template.md)를 복사해 `papers/논문 제목.md`처럼 저장합니다. Obsidian의 노트 제목을 파일 이름으로 그대로 사용할 수 있지만 `< > : " / \ | ? *` 문자는 사용할 수 없습니다.
2. 파일 위쪽에는 기본 정보를, 두 번째 `---` 아래에는 리뷰 본문을 Markdown으로 작성합니다.
3. [index.txt](papers/index.txt) 끝에 확장자 `.md`를 뺀 파일 이름을 대소문자와 띄어쓰기까지 똑같이 한 줄 추가합니다.

예시는 다음과 같습니다.

```md
---
title: "Self Forcing: Bridging the Train-Test Gap"
citation: "저자 · 학술지 또는 학회 · 2025"
status: reading
updated: 2026-08-10
tags:
  - inverse-design
  - millimeter-wave
  - surrogate-model
card:
---

이 논문에서 다시 참고하고 싶은 핵심을 한두 문장으로 적습니다.

## Introduction

여기부터 원하는 순서로 리뷰를 작성합니다.

## Method

필요한 제목만 자유롭게 추가합니다.
```

`title`만 필수입니다. `card`를 비워 두면 본문의 첫 일반 문단이 카드 문장으로 자동 사용됩니다.

- `title`: 논문 제목. 비어 있으면 카드가 만들어지지 않습니다.
- `citation`: `저자 · 학술지 또는 학회 · 출판연도` 순서의 서지 정보
- `status`: `done`(정리 완료), `reading`(읽는 중), `queue`(대기)
- `updated`: 이 리뷰를 마지막으로 수정한 날짜, `YYYY-MM-DD`
- `tags`: 검색과 분류에 사용할 자유 태그. `tags:` 아래에 두 칸 들여쓰고 `- 태그` 형식으로 한 줄씩 적습니다. 화면의 필터와 태그 색인은 이 값으로 자동 생성됩니다.
- `card`: 카드에 별도로 보여 줄 짧은 문장. 비워도 됩니다.

태그는 `inverse-design`, `rfic`, `millimeter-wave`처럼 영문 소문자와 하이픈 위주로 적는 것을 권장합니다. 한 논문에 최대 20개, 태그 하나는 최대 50자까지 사용할 수 있습니다. 대소문자만 다른 태그는 같은 태그로 묶입니다. 기존의 `tags: inverse-design, rfic` 한 줄 형식도 계속 읽을 수 있지만 새 글은 Obsidian 목록형을 사용하세요.

## 리뷰 본문 작성

두 번째 `---` 아래는 완전한 자유 형식입니다. `Introduction`, `Method`, `Experiments` 같은 제목이나 순서를 따를 필요가 없습니다. 상세 페이지의 논문 제목이 `h1`이므로 본문 큰 제목은 `##`, 그 아래 제목은 `###`부터 쓰면 됩니다.

- 문단, 목록, 인용, 표, 코드 블록을 일반 Markdown으로 작성할 수 있습니다.
- 인라인 수식은 `$...$`, 블록 수식은 `$$...$$`로 작성합니다.
- 그림을 넣는다면 `papers/my-paper-title/` 폴더를 만들고 이미지 파일을 둡니다.
- 이미지 문법 예: `![설명](./my-paper-title/figure-01.webp)`
- 본문이 비어 있어도 카드는 표시되며, 상세 페이지에는 작성 전 안내가 나옵니다.
- `url`, `noteUrl` 또는 논문별 JS 파일은 필요하지 않습니다.

`tags` 같은 위쪽 속성은 Obsidian 형식과 호환됩니다. 본문은 사이트에서도 보이게 일반 Markdown으로 작성하고, Obsidian 전용 `[[위키링크]]`, `![[임베드]]`, `%%주석%%`은 사용하지 않는 것을 권장합니다.

저장하면 논문 카드, 전체 개수, 읽는 중 개수, 최근 날짜와 태그 색인이 자동으로 바뀝니다. 리뷰 형식은 사이트가 강제하지 않습니다.

## 파일 구성

- [papers/index.txt](papers/index.txt): 사이트에 표시할 Markdown 파일 이름 목록
- [papers/template.md](papers/template.md): 새 논문용 빈 양식
- `papers/*.md`: 기본 정보와 장문 리뷰를 함께 담는 논문별 파일
- `paper-data.js`: Markdown을 읽어 카드 데이터로 바꾸는 사이트 내부 코드
- `review.html`: 모든 논문이 함께 사용하는 상세 리뷰 화면
- `index.html`: 페이지의 고정 구조
- `style.css`: 아카이브 레이아웃과 반응형 스타일
- `script.js`: 카드 생성, 자동 통계, 검색, 필터, 정렬

## 디자인 참고

목록은 [Zotero의 태그 탐색](https://www.zotero.org/support/collections_and_tags)처럼 태그 하나로 결과를 좁히고, 하단 색인은 [Stack Overflow Tags](https://stackoverflow.com/tags)와 [DEV Community Tags](https://dev.to/tags)처럼 실제로 사용된 태그와 리뷰 수를 함께 보여 줍니다. 태그는 Markdown에 적은 값에서 자동으로 만들어지므로 HTML을 따로 수정할 필요가 없습니다.

## 로컬에서 확인

`index.html`을 파일 탐색기에서 바로 열면 Markdown을 불러올 수 없습니다. 이 폴더에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`으로 접속하거나, GitHub Pages에 올려 확인하세요. 별도 빌드와 패키지 설치는 필요하지 않습니다.
