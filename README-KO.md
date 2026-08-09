# GitHub Pages 시작 파일 사용법

이 폴더의 파일을 GitHub의 `본인아이디.github.io` 저장소 최상위 위치에 올리면 됩니다.

## 반드시 수정할 곳

`index.html`을 열고 다음 문구를 찾아 바꾸세요.

- `Jaehong Choi`
- `your-email@example.com`
- `YOUR-USERNAME`
- About 소개 문구
- Publications 예시 항목

## 프로필 사진 바꾸기

1. 본인 사진 파일명을 `profile.jpg`로 바꿉니다.
2. `assets` 폴더에 사진을 넣습니다.
3. `index.html`에서 아래 부분을 찾습니다.

```html
src="assets/profile-placeholder.svg"
```

다음과 같이 바꿉니다.

```html
src="assets/profile.jpg"
```

## GitHub에 업로드할 때

압축을 푼 뒤, 바깥 폴더 자체가 아니라 그 안의 아래 항목들을 업로드하세요.

- `index.html`
- `style.css`
- `assets` 폴더

`index.html`이 저장소 첫 화면에서 바로 보여야 정상입니다.
