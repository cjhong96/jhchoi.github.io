# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·카드 문장·태그·리뷰 본문 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- 논문별 자유 형식 Markdown 리뷰
- 주제별 컬렉션
- 모바일, 키보드 탐색, 인쇄 화면 지원

라이브러리는 실제 논문 제목을 넣기 전까지 빈 상태로 표시됩니다.

## 논문을 작성하는 곳

논문 하나는 `papers/` 폴더의 Markdown 파일 하나로 관리합니다. JS 파일, `index.html`, 통계 숫자는 직접 수정하지 않습니다.

```text
papers/
├─ index.txt                 ← 사이트에 표시할 Markdown 파일 이름 목록
├─ template.md               ← 새 논문을 만들 때 복사하는 빈 양식
├─ holographic-antenna.md    ← Holographic Antennas용 빈 파일
└─ inverse-design.md         ← Inverse Design용 빈 파일
```

두 빈 논문 파일은 `title`을 작성하기 전까지 사이트에 표시되지 않습니다.

### 가장 쉬운 방법

정리할 논문의 PDF나 DOI와 함께 아래처럼 요청하면 Markdown 생성, 목록 등록, 사이트 반영까지 처리할 수 있습니다.

```text
이 논문을 Markdown 리뷰로 추가해줘.
파일 이름: my-paper-title.md
상태: 읽는 중
주제: inverse-design
PDF 또는 DOI: ...
```

### 직접 작성하는 방법

첫 두 논문은 [holographic-antenna.md](papers/holographic-antenna.md) 또는 [inverse-design.md](papers/inverse-design.md)를 열고 바로 작성하면 됩니다. 두 파일 이름은 이미 목록에 들어 있습니다.

새 논문을 추가할 때는 다음 세 단계만 필요합니다.

1. [template.md](papers/template.md)를 복사해 `papers/my-paper-title.md`처럼 저장합니다. 파일 이름은 영문 소문자·숫자·하이픈만 사용합니다.
2. 파일 위쪽에는 기본 정보를, 두 번째 `---` 아래에는 리뷰 본문을 Markdown으로 작성합니다.
3. [index.txt](papers/index.txt) 끝에 확장자를 뺀 `my-paper-title`을 한 줄 추가합니다.

기존에 만든 `papers/1.js` 같은 JS 파일은 새 목록에서 읽지 않습니다. 같은 이름의 `papers/1.md`를 만들고 `index.txt`에 `1`을 추가하면 됩니다.

예시는 다음과 같습니다.

```md
---
title: Self Forcing: Bridging the Train-Test Gap
citation: 저자 · 학술지 또는 학회 · 2025
status: reading
topics: ai-em, inverse-design
updated: 2026-08-10
tags: diffusion, autoregressive model
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
- `topics`: `holographic`, `metasurfaces`, `inverse-design`, `ai-em` 중 하나 이상. 여러 개는 쉼표로 구분합니다.
- `updated`: 이 리뷰를 마지막으로 수정한 날짜, `YYYY-MM-DD`
- `tags`: 검색에 사용할 자유 태그. 여러 개는 쉼표로 구분합니다.
- `card`: 카드에 별도로 보여 줄 짧은 문장. 비워도 됩니다.

## 리뷰 본문 작성

두 번째 `---` 아래는 완전한 자유 형식입니다. `Introduction`, `Method`, `Experiments` 같은 제목이나 순서를 따를 필요가 없습니다. 상세 페이지의 논문 제목이 `h1`이므로 본문 큰 제목은 `##`, 그 아래 제목은 `###`부터 쓰면 됩니다.

- 문단, 목록, 인용, 표, 코드 블록을 일반 Markdown으로 작성할 수 있습니다.
- 인라인 수식은 `$...$`, 블록 수식은 `$$...$$`로 작성합니다.
- 그림을 넣는다면 `papers/my-paper-title/` 폴더를 만들고 이미지 파일을 둡니다.
- 이미지 문법 예: `![설명](./my-paper-title/figure-01.webp)`
- 본문이 비어 있어도 카드는 표시되며, 상세 페이지에는 작성 전 안내가 나옵니다.
- `url`, `noteUrl` 또는 논문별 JS 파일은 필요하지 않습니다.

저장하면 논문 카드, 전체 개수, 읽는 중 개수, 최근 날짜와 주제별 개수가 자동으로 바뀝니다. 리뷰 형식은 사이트가 강제하지 않습니다.

## 파일 구성

- [papers/index.txt](papers/index.txt): 사이트에 표시할 Markdown 파일 이름 목록
- [papers/template.md](papers/template.md): 새 논문용 빈 양식
- `papers/*.md`: 기본 정보와 장문 리뷰를 함께 담는 논문별 파일
- `paper-data.js`: Markdown을 읽어 카드 데이터로 바꾸는 사이트 내부 코드
- `review.html`: 모든 논문이 함께 사용하는 상세 리뷰 화면
- `index.html`: 페이지의 고정 구조
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 카드 생성, 자동 통계, 검색, 필터, 정렬

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

`index.html`을 파일 탐색기에서 바로 열면 Markdown을 불러올 수 없습니다. 이 폴더에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`으로 접속하거나, GitHub Pages에 올려 확인하세요. 별도 빌드와 패키지 설치는 필요하지 않습니다.
