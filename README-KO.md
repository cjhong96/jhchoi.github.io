# JH / PAPER LOG

안테나, 전자기학, 역설계, AI 관련 논문을 정리하는 개인 연구 노트 사이트입니다. 별도 빌드 과정 없이 GitHub Pages에서 바로 동작합니다.

## 현재 화면

- 제목·질문·태그 통합 검색
- 연구 주제 및 읽기 상태 필터
- 최근 업데이트·오래된 노트·제목순 정렬
- `Question / Core idea / Method / Limits & Next` 형식의 펼침 노트
- 주제별 컬렉션과 현재 읽는 논문 큐
- 모바일, 키보드 탐색, 인쇄 화면 지원

현재 등록된 세 항목은 레이아웃 확인용 `SAMPLE`입니다. 실제 논문이나 개인 출판물로 오해되지 않도록 저자·저널·DOI는 넣지 않았습니다.

## 실제 논문으로 바꾸기

`index.html`에서 `<article class="paper-card" ...>` 블록 하나가 논문 노트 하나입니다.

1. `data-title`에 검색용 논문 제목을 입력합니다.
2. `data-topics`에 아래 주제 키를 공백으로 구분해 입력합니다.
   - `holographic`
   - `metasurfaces`
   - `inverse-design`
   - `ai-em`
3. `data-status`는 `done`, `reading`, `queue` 중 하나를 사용합니다.
4. `data-order`는 최근 노트일수록 큰 숫자로 둡니다.
5. 카드 안의 제목, 서지정보, 질문, 핵심 문장, 상세 노트, 태그, 날짜를 실제 내용으로 교체합니다.
6. 새 카드를 추가했다면 화면 상단의 `Notes` 수와 섹션의 `LIBRARY / 03`, 주제별 노트 수도 함께 수정합니다.

원문, 코드, 상세 노트 링크는 실제 URL이 준비된 뒤 카드 하단에 추가하세요. 빈 `#` 링크는 넣지 않는 편이 좋습니다.

## 파일 구성

- `index.html`: 페이지 콘텐츠와 논문 카드
- `style.css`: 에디토리얼 레이아웃과 반응형 스타일
- `script.js`: 검색, 필터, 정렬, 빈 결과 처리
- `assets/og-paper-log-calm.png`: 링크 공유용 미리보기 이미지

## 디자인 참고

정보 구조는 [Paperlib](https://paperlib.app/en/)의 라이브러리 패턴과 [Quartz](https://quartz.jzhao.xyz/)의 지식 노트 방식을, 시각적 톤은 [Socratica Toolbox](https://toolbox.socratica.info/)의 에디토리얼 인덱스를 참고해 새로 구성했습니다.

## 로컬에서 확인

이 폴더를 정적 웹 서버로 열거나 GitHub Pages에 올리면 됩니다. 빌드와 패키지 설치는 필요하지 않습니다.
