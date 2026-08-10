(() => {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const cacheKey = Date.now();
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
    const review = toText(paper.review) || toText(paper.summary);
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
    const displayTags = tags.length
      ? tags
      : Array.isArray(paper.topics)
        ? paper.topics.map(toText).filter(Boolean)
        : [];
    displayTags.forEach((tag) => tagsNode.append(element("span", "", `#${tag.replace(/^#/, "")}`)));
    tagsNode.hidden = displayTags.length === 0;

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
      item.dataset.level = heading.tagName === "H3" ? "3" : "2";
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
    if (!slugPattern.test(slug)) {
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
      const { loadPapers } = await import(`./papers/index.js?v=${cacheKey}`);
      loadResult = await loadPapers(cacheKey);
    } catch (error) {
      console.error("논문 목록을 불러오지 못했습니다.", error);
      showPageError(
        "리뷰를 표시할 수 없습니다.",
        "논문 목록을 불러오지 못했습니다.",
        { retry: true },
      );
      return;
    }

    const paper = loadResult.papers.find(
      (candidate) => candidate?.slug === slug && toText(candidate.title),
    );
    if (!paper) {
      if (loadResult.failures.includes(`./${slug}.js`)) {
        showPageError(
          "리뷰 정보를 불러오지 못했습니다.",
          "논문 정보 파일을 읽는 중 문제가 발생했습니다.",
          { retry: true },
        );
        return;
      }
      showPageError("리뷰를 찾을 수 없습니다.", "등록된 논문과 연결되지 않은 리뷰입니다.");
      return;
    }

    renderMetadata(paper);

    const markdownUrl = new URL(`./reviews/${slug}.md`, window.location.href);
    const requestUrl = new URL(markdownUrl);
    requestUrl.searchParams.set("v", cacheKey);

    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(() => requestController.abort(), 12000);
    let markdown;
    try {
      const response = await fetch(requestUrl, {
        cache: "no-store",
        signal: requestController.signal,
      });

      if (response.status === 404) {
        showState("아직 장문 리뷰 파일을 작성하지 않았습니다.");
        return;
      }
      if (!response.ok) {
        showState("리뷰 파일을 불러오는 중 문제가 발생했습니다.", { retry: true });
        return;
      }

      markdown = await response.text();
    } catch (error) {
      console.error("리뷰 파일을 불러오지 못했습니다.", error);
      const message = error?.name === "AbortError"
        ? "리뷰 파일을 불러오는 데 시간이 너무 오래 걸렸습니다."
        : "리뷰 파일을 불러오지 못했습니다.";
      showState(message, { retry: true });
      return;
    } finally {
      window.clearTimeout(requestTimeout);
    }

    const renderableMarkdown = markdown.replace(/^\s*<!--[\s\S]*?-->\s*/, "").trim();
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
