/**
 * 사이트에 불러올 논문 파일 목록입니다.
 * 새 논문 파일을 만들면 아래 배열에 "./파일이름.js", 한 줄만 추가하세요.
 */
export const paperFiles = [
  "./holographic-antenna.js",
  "./inverse-design.js",
];

export async function loadPapers(cacheKey = Date.now()) {
  const results = await Promise.all(
    paperFiles.map(async (file) => {
      try {
        const paperModule = await import(`${file}?v=${cacheKey}`);
        if (!paperModule.default || typeof paperModule.default !== "object") {
          throw new TypeError("default export가 논문 객체가 아닙니다.");
        }
        return { file, paper: paperModule.default };
      } catch (error) {
        console.error(`논문 파일을 불러오지 못했습니다: ${file}`, error);
        return { file, error };
      }
    }),
  );

  return {
    papers: results.filter((result) => result.paper).map((result) => result.paper),
    failures: results.filter((result) => result.error).map((result) => result.file),
  };
}
