const allowedFrontMatterKeys = new Set([
  "title",
  "citation",
  "status",
  "updated",
  "tags",
  "card",
]);
const allowedStatuses = new Set(["done", "reading", "queue"]);
const maxTags = 20;
const maxTagLength = 50;
const maxPaperNameLength = 180;

const manifestUrl = new URL("./papers/index.txt", import.meta.url);
const manifestPath = "./papers/index.txt";
const maxManifestBytes = 64 * 1024;
const maxPaperBytes = 2 * 1024 * 1024;
const requestTimeoutMs = 12000;
const parallelRequests = 6;

class PaperDataError extends Error {
  constructor(code, path, message, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = "PaperDataError";
    this.code = code;
    this.path = path;
  }
}

const toText = (value) => String(value ?? "").trim();

function paperNameKey(value) {
  return toText(value).normalize("NFKC").toLocaleLowerCase("ko-KR");
}

function isValidPaperName(value) {
  const text = toText(value);
  if (!text || text.length > maxPaperNameLength) return false;

  const normalized = text.normalize("NFKC");
  if (byteLength(`${text}.md`) > 255 || byteLength(`${normalized}.md`) > 255) return false;
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith(".") ||
    /[. ]$/.test(normalized) ||
    /[<>:"/\\|?*\u0000-\u001F]/u.test(normalized)
  ) {
    return false;
  }

  const windowsStem = normalized.split(".")[0].toLocaleUpperCase("en-US");
  return !/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(windowsStem);
}

function paperPath(name) {
  return `./papers/${name}.md`;
}

function paperUrl(name) {
  return new URL(`./papers/${encodeURIComponent(name)}.md`, import.meta.url);
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

async function fetchText(url, path, maxBytes) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    let response;
    try {
      response = await fetch(url, {
        cache: "no-cache",
        signal: controller.signal,
      });
    } catch (error) {
      const code = error?.name === "AbortError" ? "timeout" : "network";
      throw new PaperDataError(code, path, `파일을 불러오지 못했습니다: ${path}`, error);
    }

    if (response.status === 404) {
      throw new PaperDataError("not-found", path, `파일을 찾을 수 없습니다: ${path}`);
    }
    if (!response.ok) {
      throw new PaperDataError("http", path, `파일 요청에 실패했습니다: ${path}`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new PaperDataError("too-large", path, `파일이 너무 큽니다: ${path}`);
    }

    let text;
    try {
      text = await response.text();
    } catch (error) {
      throw new PaperDataError("read", path, `파일을 읽지 못했습니다: ${path}`, error);
    }

    if (byteLength(text) > maxBytes) {
      throw new PaperDataError("too-large", path, `파일이 너무 큽니다: ${path}`);
    }
    return text;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function parseManifest(source) {
  const slugs = [];
  const seen = new Set();
  const failures = [];
  const failureDetails = [];

  source.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line, index) => {
    let value = line.trim();
    if (!value || value.startsWith("#")) return;
    value = value.replace(/^[-*+]\s+/, "").replace(/\.md$/i, "").trim();
    const key = paperNameKey(value);
    const duplicate = seen.has(key);

    if (!isValidPaperName(value) || duplicate) {
      const path = `${manifestPath}:${index + 1}`;
      const message = duplicate
        ? `목록에 같은 파일 이름이 중복되었습니다: ${value}`
        : `목록의 파일 이름을 확인해 주세요: ${value}`;
      failures.push(path);
      failureDetails.push(new PaperDataError("manifest", path, message));
      return;
    }

    seen.add(key);
    slugs.push(value);
  });

  return { slugs, failures, failureDetails };
}

function unquote(value) {
  const text = value.trim();
  if (text.length < 2) return text;

  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  return text;
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map(unquote).map(toText).filter(Boolean);
  }

  let text = value.trim();
  if (text.startsWith("[") && text.endsWith("]")) {
    text = text.slice(1, -1);
  }
  if (!text) return [];
  return text.split(",").map(unquote).map(toText).filter(Boolean);
}

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function stripMarkdown(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/~~~[^\n]*\n([\s\S]*?)~~~/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\$+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCardText(markdown) {
  const visible = markdown.replace(/<!--[\s\S]*?-->/g, " ").trim();
  if (!visible) return "";

  const blocks = visible.split(/\n\s*\n/);
  for (const block of blocks) {
    const candidate = block.trim();
    if (
      !candidate ||
      /^(?:#{1,6}\s|```|~~~|!\[|>|[-*+]\s|\d+\.\s|\|)/.test(candidate) ||
      candidate.startsWith("$$")
    ) {
      continue;
    }

    const text = stripMarkdown(candidate);
    if (!text) continue;
    return text.length > 220 ? `${text.slice(0, 219).trimEnd()}…` : text;
  }
  return "";
}

function parsePaperMarkdown(source, slug) {
  const path = `./papers/${slug}.md`;
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new PaperDataError("parse", path, "파일 맨 위에 기본 정보 영역이 필요합니다.");
  }

  const closingLine = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingLine < 0) {
    throw new PaperDataError("parse", path, "기본 정보 영역을 닫는 ---가 없습니다.");
  }

  const metadata = {};
  const presentKeys = new Set();
  let activeListKey = "";
  for (let index = 1; index < closingLine; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const listItem = /^\s*-\s*(.*)$/.exec(rawLine);
    if (listItem) {
      if (activeListKey !== "tags") {
        throw new PaperDataError("parse", path, `기본 정보 ${index + 1}번째 줄의 목록을 확인해 주세요.`);
      }

      const value = listItem[1].trim();
      if (!value) {
        throw new PaperDataError("parse", path, `tags ${index + 1}번째 줄의 값을 입력해 주세요.`);
      }
      metadata.tags.push(value);
      continue;
    }

    activeListKey = "";

    const separator = line.indexOf(":");
    if (separator <= 0) {
      throw new PaperDataError("parse", path, `기본 정보 ${index + 1}번째 줄을 확인해 주세요.`);
    }

    const key = line.slice(0, separator).trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(key)) {
      throw new PaperDataError("parse", path, `기본 정보 이름을 확인해 주세요: ${key}`);
    }
    if (!allowedFrontMatterKeys.has(key)) {
      throw new PaperDataError("parse", path, `지원하지 않는 기본 정보입니다: ${key}`);
    }
    if (presentKeys.has(key)) {
      throw new PaperDataError("parse", path, `기본 정보가 중복되었습니다: ${key}`);
    }

    presentKeys.add(key);
    const value = line.slice(separator + 1).trim();
    if (key === "tags" && value === "") {
      metadata.tags = [];
      activeListKey = "tags";
    } else {
      metadata[key] = value;
    }
  }

  if (!presentKeys.has("title")) {
    throw new PaperDataError("parse", path, "title 항목이 없습니다.");
  }

  const title = toText(unquote(metadata.title ?? ""));
  if (!title) {
    throw new PaperDataError("parse", path, "title 값을 입력해 주세요.");
  }

  const markdown = lines.slice(closingLine + 1).join("\n").trimStart();
  const card = unquote(metadata.card ?? "") || extractCardText(markdown);
  const status = unquote(metadata.status ?? "queue") || "queue";
  if (!allowedStatuses.has(status)) {
    throw new PaperDataError("parse", path, `status 값을 확인해 주세요: ${status}`);
  }

  const rawTags = parseList(metadata.tags ?? "");
  if (rawTags.length > maxTags) {
    throw new PaperDataError("parse", path, `tags는 ${maxTags}개까지 작성할 수 있습니다.`);
  }
  const tagKeys = new Set();
  const tags = [];
  rawTags.forEach((value) => {
    const tag = toText(value)
      .normalize("NFKC")
      .replace(/^(?:#\s*)+/, "")
      .trim()
      .replace(/\s+/g, " ");
    if (!tag) return;
    if (tag.length > maxTagLength) {
      throw new PaperDataError("parse", path, `tags는 항목당 ${maxTagLength}자까지 작성할 수 있습니다: ${tag}`);
    }
    const key = tag.toLocaleLowerCase("ko-KR");
    if (tagKeys.has(key)) return;
    tagKeys.add(key);
    tags.push(tag);
  });

  const updated = unquote(metadata.updated ?? "");
  if (updated && !isValidDate(updated)) {
    throw new PaperDataError("parse", path, `updated 날짜를 확인해 주세요: ${updated}`);
  }

  return {
    slug,
    title,
    citation: unquote(metadata.citation ?? ""),
    status,
    updated,
    tags,
    review: card,
    searchText: stripMarkdown(markdown),
    markdown,
  };
}

async function loadManifest() {
  const source = await fetchText(
    manifestUrl,
    manifestPath,
    maxManifestBytes,
  );
  return parseManifest(source);
}

async function loadPaperFile(slug) {
  const path = paperPath(slug);
  const url = paperUrl(slug);
  const source = await fetchText(url, path, maxPaperBytes);
  return {
    ...parsePaperMarkdown(source, slug),
    sourceUrl: url.href,
  };
}

async function mapWithLimit(values, task) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(values[index], index);
    }
  }

  const workerCount = Math.min(parallelRequests, values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function loadPapers() {
  const manifest = await loadManifest();
  const results = await mapWithLimit(manifest.slugs, async (slug) => {
    try {
      return { paper: await loadPaperFile(slug) };
    } catch (error) {
      const normalizedError = error instanceof PaperDataError
        ? error
        : new PaperDataError("unknown", `./papers/${slug}.md`, "논문 파일을 처리하지 못했습니다.", error);
      console.error(`논문 Markdown을 불러오지 못했습니다: ${slug}`, normalizedError);
      return { error: normalizedError };
    }
  });

  return {
    papers: results.filter((result) => result.paper).map((result) => result.paper),
    failures: [
      ...manifest.failures,
      ...results.filter((result) => result.error).map((result) => result.error.path),
    ],
    failureDetails: [
      ...manifest.failureDetails,
      ...results.filter((result) => result.error).map((result) => result.error),
    ],
  };
}

export async function loadPaper(slug) {
  if (!isValidPaperName(slug)) {
    return { registered: false, paper: null, failures: [], failureDetails: [] };
  }

  const manifest = await loadManifest();
  if (!manifest.slugs.includes(slug)) {
    return {
      registered: false,
      paper: null,
      failures: manifest.failures,
      failureDetails: manifest.failureDetails,
    };
  }

  try {
    const paper = await loadPaperFile(slug);
    return {
      registered: true,
      paper,
      failures: manifest.failures,
      failureDetails: manifest.failureDetails,
    };
  } catch (error) {
    const normalizedError = error instanceof PaperDataError
      ? error
      : new PaperDataError("unknown", `./papers/${slug}.md`, "논문 파일을 처리하지 못했습니다.", error);
    console.error(`논문 Markdown을 불러오지 못했습니다: ${slug}`, normalizedError);
    return {
      registered: true,
      paper: null,
      failures: [...manifest.failures, normalizedError.path],
      failureDetails: [...manifest.failureDetails, normalizedError],
    };
  }
}
