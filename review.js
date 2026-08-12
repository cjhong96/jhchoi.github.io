(() => {
  const cacheKey = "20260812-5";
  const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);
  const statusLabels = {
    done: "정리 완료",
    reading: "읽는 중",
    queue: "대기",
  };

  const article = document.querySelector(".review-article");
  const titleNode = document.querySelector("#review-title");
  const citationNode = document.querySelector("#review-citation");
  const leadNode = document.querySelector("#review-lead");
  const metaNode = document.querySelector("#review-meta");
  const statusNode = document.querySelector("#review-status");
  const tagsNode = document.querySelector("#review-tags");
  const updatedNode = document.querySelector("#review-updated");
  const tocNode = document.querySelector("#review-toc");
  const tocList = document.querySelector("#review-toc-list");
  const contentNode = document.querySelector("#review-content");

  if (
    !article ||
    !titleNode ||
    !citationNode ||
    !leadNode ||
    !metaNode ||
    !statusNode ||
    !tagsNode ||
    !updatedNode ||
    !tocNode ||
    !tocList ||
    !contentNode
  ) {
    return;
  }

  const toText = (value) => String(value ?? "").trim();

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function finishLoading() {
    article.setAttribute("aria-busy", "false");
  }

  function showState(message, { retry = false } = {}) {
    const state = element("div", "review-state");
    state.append(element("p", "", message));
    if (retry) {
      const link = element("a", "review-retry", "다시 불러오기");
      link.href = window.location.href;
      state.append(link);
    }
    contentNode.replaceChildren(state);
    tocNode.hidden = true;
    finishLoading();
  }

  function showPageError(title, message, { retry = false } = {}) {
    titleNode.textContent = title;
    citationNode.hidden = true;
    leadNode.hidden = true;
    metaNode.hidden = true;
    document.title = `${title} — JH / PAPER LOG`;
    showState(message, { retry });
  }

  function renderMetadata(paper) {
    const title = toText(paper.title);
    const citation = toText(paper.citation);
    const review = toText(paper.review);
    const status = Object.hasOwn(statusLabels, paper.status) ? paper.status : "queue";
    const tags = Array.isArray(paper.tags)
      ? paper.tags.map(toText).filter(Boolean)
      : [];

    titleNode.textContent = title;
    document.title = `${title} — JH / PAPER LOG`;

    citationNode.textContent = citation;
    citationNode.hidden = citation === "";

    leadNode.textContent = review;
    leadNode.hidden = review === "";

    statusNode.className = `status status--${status}`;
    statusNode.textContent = statusLabels[status];

    tagsNode.replaceChildren();
    tags.forEach((tag) => tagsNode.append(element("span", "", `#${tag.replace(/^#/, "")}`)));
    tagsNode.hidden = tags.length === 0;

    const updated = toText(paper.updated);
    updatedNode.textContent = /^\d{4}-\d{2}-\d{2}$/.test(updated)
      ? `UPDATED ${updated}`
      : "UPDATED —";
    if (/^\d{4}-\d{2}-\d{2}$/.test(updated)) updatedNode.dateTime = updated;
    metaNode.hidden = false;
  }

  function safeResolvedUrl(value, baseUrl, allowedProtocols) {
    const raw = toText(value);
    if (!raw) return "";
    if (raw.startsWith("#")) return raw;

    try {
      const url = new URL(raw, baseUrl);
      return allowedProtocols.has(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function normalizeContentUrls(root, markdownUrl) {
    const linkProtocols = new Set(["http:", "https:", "mailto:"]);
    const imageProtocols = new Set(["http:", "https:"]);

    root.querySelectorAll("a[href]").forEach((link) => {
      const safeHref = safeResolvedUrl(link.getAttribute("href"), markdownUrl, linkProtocols);
      if (!safeHref) {
        link.removeAttribute("href");
        return;
      }

      link.href = safeHref;
      if (!safeHref.startsWith("#")) {
        const url = new URL(safeHref);
        if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== window.location.origin) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
      }
    });

    root.querySelectorAll("img[src]").forEach((image) => {
      const safeSrc = safeResolvedUrl(image.getAttribute("src"), markdownUrl, imageProtocols);
      if (!safeSrc) {
        image.remove();
        return;
      }

      image.src = safeSrc;
      image.loading = "lazy";
      image.decoding = "async";
    });
  }

  function convertObsidianImageEmbeds(source) {
    return source.replace(/!\[\[([^\]\r\n]+)\]\]/g, (match, content) => {
      const target = content.split("|", 1)[0].trim().replace(/\\/g, "/");
      if (!target || target.includes("#") || /[<>:"|?*\u0000-\u001F]/u.test(target)) {
        return match;
      }

      const segments = target.split("/");
      if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
        return match;
      }

      const fileName = segments.at(-1);
      const extension = fileName.includes(".") ? fileName.split(".").at(-1).toLocaleLowerCase("en-US") : "";
      if (!imageExtensions.has(extension)) return match;

      const isBareFileName = segments.length === 1;
      const isImageFolderPath = segments.length === 3
        && segments[0] === "assets"
        && segments[1] === "images";
      if (!isBareFileName && !isImageFolderPath) return match;

      const encodedFileName = encodeURIComponent(fileName);
      const imagePath = `../assets/images/${encodedFileName}`;
      const alt = fileName
        .replace(/\.[^.]+$/, "")
        .replace(/([\[\]\\])/g, "\\$1");
      return `![${alt}](<${imagePath}>)`;
    });
  }

  function buildTableOfContents() {
    contentNode.querySelectorAll("h1").forEach((heading) => {
      const replacement = document.createElement("h2");
      while (heading.firstChild) replacement.append(heading.firstChild);
      heading.replaceWith(replacement);
    });

    const headings = Array.from(contentNode.querySelectorAll("h2, h3"));
    tocList.replaceChildren();

    headings.forEach((heading, index) => {
      const id = `section-${String(index + 1).padStart(2, "0")}`;
      heading.id = id;
      const item = element("li", "");
      const label = heading.textContent
        .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
        .replace(/\$([^$]+?)\$/g, "$1")
        .trim();
      const link = element("a", "", label);
      link.href = `#${id}`;
      item.append(link);
      tocList.append(item);
    });

    tocNode.hidden = headings.length === 0;
  }

  async function loadReview() {
    const slug = toText(new URLSearchParams(window.location.search).get("paper"));
    if (!slug || slug.length > 180) {
      showPageError("리뷰를 찾을 수 없습니다.", "올바른 논문 리뷰 주소가 아닙니다.");
      return;
    }

    if (typeof window.markdownit !== "function" || !window.DOMPurify) {
      showPageError(
        "리뷰를 표시할 수 없습니다.",
        "리뷰 표시 도구를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        { retry: true },
      );
      return;
    }

    let loadResult;
    try {
      const { loadPaper } = await import(`./paper-data.js?v=${cacheKey}`);
      loadResult = await loadPaper(slug);
    } catch (error) {
      console.error("논문 목록을 불러오지 못했습니다.", error);
      showPageError(
        "리뷰를 표시할 수 없습니다.",
        "논문 목록을 불러오지 못했습니다.",
        { retry: true },
      );
      return;
    }

    if (!loadResult.registered) {
      showPageError("리뷰를 찾을 수 없습니다.", "등록된 논문과 연결되지 않은 리뷰입니다.");
      return;
    }

    const paper = loadResult.paper;
    if (!paper) {
      const failure = loadResult.failureDetails[0];
      const retry = ["timeout", "network", "http", "read", "unknown"].includes(failure?.code);
      const message = failure?.code === "not-found"
        ? "등록 목록에 있는 Markdown 파일을 찾을 수 없습니다."
        : failure?.code === "parse"
          ? "Markdown 파일 위쪽의 기본 정보 형식을 확인해 주세요."
          : failure?.code === "too-large"
            ? "리뷰 파일이 너무 커서 표시할 수 없습니다."
            : "논문 Markdown 파일을 읽는 중 문제가 발생했습니다.";
      showPageError("리뷰 정보를 불러오지 못했습니다.", message, { retry });
      return;
    }

    if (!toText(paper.title)) {
      showPageError("아직 제목이 입력되지 않았습니다.", "Markdown 파일 위쪽의 title을 작성해 주세요.");
      return;
    }

    renderMetadata(paper);

    const markdownUrl = toText(paper.sourceUrl);
    if (!markdownUrl) {
      showPageError("리뷰를 표시할 수 없습니다.", "리뷰 파일 주소를 확인하지 못했습니다.");
      return;
    }
    const markdown = typeof paper.markdown === "string" ? paper.markdown : "";
    const renderableMarkdown = convertObsidianImageEmbeds(
      markdown.replace(/^\s*<!--[\s\S]*?-->\s*/, ""),
    ).trim();
    if (!renderableMarkdown) {
      showState("아직 리뷰 본문을 작성하지 않았습니다.");
      return;
    }

    try {
      const markdownRenderer = window.markdownit({
        html: false,
        linkify: true,
        typographer: false,
        breaks: false,
      });
      const rendered = markdownRenderer.render(renderableMarkdown);
      const sanitized = window.DOMPurify.sanitize(rendered, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "meta", "link"],
        FORBID_ATTR: ["style", "srcset"],
      });

      const template = document.createElement("template");
      template.innerHTML = sanitized;
      normalizeContentUrls(template.content, markdownUrl);
      contentNode.replaceChildren(template.content);
      buildTableOfContents();

      if (typeof window.renderMathInElement === "function") {
        window.renderMathInElement(contentNode, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
          trust: false,
          maxSize: 20,
          maxExpand: 1000,
        });
      }

      finishLoading();
    } catch (error) {
      console.error("리뷰를 표시하지 못했습니다.", error);
      showState("리뷰 본문을 표시하는 중 문제가 발생했습니다.", { retry: true });
    }
  }

  loadReview().catch((error) => {
    console.error("리뷰 페이지를 준비하지 못했습니다.", error);
    showPageError(
      "리뷰를 표시할 수 없습니다.",
      "리뷰 페이지를 준비하는 중 문제가 발생했습니다.",
      { retry: true },
    );
  });
})();
