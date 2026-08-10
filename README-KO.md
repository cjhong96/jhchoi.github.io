# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·질문·태그 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- `Question / Core idea / Method / Limits & Next` 형식의 펼침 노트
- 주제별 컬렉션과 현재 읽는 논문 큐
- 모바일, 키보드 탐색, 인쇄 화면 지원

라이브러리는 실제 논문을 넣기 전까지 빈 상태로 표시됩니다.

## 첫 논문 추가하기

가장 간단한 방법은 정리할 논문의 PDF나 DOI와 함께 아래 네 가지를 Codex에 전달하는 것입니다.

1. 읽기 상태: `정리 완료`, `읽는 중`, `대기` 중 하나
2. 이 논문을 읽는 이유 또는 알고 싶은 질문
3. 핵심이라고 생각한 내용
4. 다음에 확인할 내용이나 한계

직접 수정할 때는 `index.html`의 `<div id="paper-list">` 안에 `<article class="paper-card" ...>` 블록을 추가합니다. 블록 하나가 논문 노트 하나입니다.

1. `data-title`에 검색용 논문 제목을 입력합니다.
2. `data-topics`에 아래 주제 키를 공백으로 구분해 입력합니다.
   - `holographic`
   - `metasurfaces`
   - `inverse-design`
   - `ai-em`
3. `data-status`는 `done`, `reading`, `queue` 중 하나를 사용합니다.
4. `data-order`는 최근 노트일수록 큰 숫자로 둡니다.
5. 카드 안에 제목, 서지정보, 질문, 방법, 발견, 다음 행동, 태그, 날짜를 입력합니다.
6. 새 카드를 추가했다면 화면 상단의 `Notes 00`, `LIBRARY / 00`, 주제별 `00 NOTES`도 실제 개수로 수정합니다.

원문, 코드, 상세 노트 링크는 실제 URL이 준비된 뒤 카드 하단에 추가하세요. 빈 `#` 링크는 넣지 않는 편이 좋습니다.

노트의 네 칸은 다음 역할을 갖습니다.

- `Question`: 이 논문이 답하려는 질문과 내가 읽는 이유
- `Method`: 사용한 방법, 설계 변수, 물리 제약, 검증 방식
- `Finding`: 나중에도 기억할 핵심 아이디어 한 문장
- `Next`: 한계, 반론, 재현할 것, 함께 읽을 다음 논문

## 파일 구성

- `index.html`: 페이지 콘텐츠와 논문 카드
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 검색, 필터, 정렬, 빈 결과 처리
- `assets/og-paper-log-calm.png`: 링크 공유용 미리보기 이미지

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

이 폴더를 정적 웹 서버로 열거나 GitHub Pages에 올리면 됩니다. 빌드와 패키지 설치는 필요하지 않습니다.
