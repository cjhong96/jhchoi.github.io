const moduleCacheKey = "20260812-5";
let loadedPapers = [];
let paperLoadFailures = [];
let paperLoadFailureDetails = [];

try {
  const { loadPapers } = await import(`./paper-data.js?v=${moduleCacheKey}`);
  const loadResult = await loadPapers();
  loadedPapers = Array.isArray(loadResult.papers) ? loadResult.papers : [];
  paperLoadFailures = Array.isArray(loadResult.failures) ? loadResult.failures : [];
  paperLoadFailureDetails = Array.isArray(loadResult.failureDetails)
    ? loadResult.failureDetails
    : [];
} catch (error) {
  console.error("논문 파일 목록을 불러오지 못했습니다.", error);
  paperLoadFailures = ["./papers/index.txt"];
  paperLoadFailureDetails = [{
    path: "./papers/index.txt",
    message: error?.message || "논문 목록을 불러오지 못했습니다.",
  }];
}

(() => {
  const statusLabels = {
    done: "정리 완료",
    reading: "읽는 중",
    queue: "대기",
  };

  const toText = (value) => String(value ?? "").trim();
  const countText = (value) => String(value).padStart(2, "0");
  const normalize = (value) => toText(value).normalize("NFKC").toLocaleLowerCase("ko-KR");

  function cleanTags(values) {
    const tags = [];
    const tagKeys = [];
    const seen = new Set();

    (Array.isArray(values) ? values : []).forEach((value) => {
      const label = toText(value)
        .normalize("NFKC")
        .replace(/^(?:#\s*)+/, "")
        .trim()
        .replace(/\s+/g, " ");
      const key = normalize(label);
      if (!key || seen.has(key)) return;
      seen.add(key);
      tags.push(label);
      tagKeys.push(key);
    });

    return { tags, tagKeys };
  }

  function dateOrder(value, fallback) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isNaN(timestamp) ? fallback : timestamp;
  }

  function shortDate(value) {
    const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[1]}.${match[2]}` : "—";
  }

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const source = Array.isArray(loadedPapers) ? loadedPapers : [];
  const libraryLoadFailed = source.length === 0 && paperLoadFailures.length > 0;
  const papers = source
    .filter((paper) => paper && typeof paper === "object" && toText(paper.title))
    .map((paper, index) => {
      const updated = toText(paper.updated);
      const { tags, tagKeys } = cleanTags(paper.tags);

      return {
        number: index + 1,
        slug: toText(paper.slug),
        title: toText(paper.title),
        citation: toText(paper.citation),
        status: Object.hasOwn(statusLabels, paper.status) ? paper.status : "queue",
        updated: /^\d{4}-\d{2}-\d{2}$/.test(updated) ? updated : "",
        tags,
        tagKeys,
        review: toText(paper.review),
        searchText: toText(paper.searchText),
        order: dateOrder(updated, index),
      };
    });

  const paperList = document.querySelector("#paper-list");
  if (!paperList) return;

  const loadWarning = document.querySelector("#paper-load-warning");
  if (loadWarning && paperLoadFailures.length > 0) {
    const detailByPath = new Map(
      paperLoadFailureDetails.map((detail) => [toText(detail?.path), toText(detail?.message)]),
    );
    const descriptions = paperLoadFailures.map((path) => {
      const detail = detailByPath.get(path);
      return detail ? `${path} — ${detail}` : path;
    });
    loadWarning.textContent = `확인이 필요한 논문 파일 ${paperLoadFailures.length}개: ${descriptions.join(" / ")}`;
    loadWarning.hidden = false;
  }

  function createPaperCard(paper) {
    const card = element("article", "paper-card");
    card.dataset.title = paper.title;
    card.dataset.slug = paper.slug;
    card.dataset.status = paper.status;
    card.dataset.order = String(paper.order);
    card.dataset.search = [
      paper.title,
      paper.citation,
      paper.review,
      ...paper.tags,
      ...paper.tags.map((tag) => `#${tag}`),
    ].join(" ");

    const meta = element("header", "paper-meta");
    meta.append(
      element("span", "paper-number", `PAPER ${String(paper.number).padStart(3, "0")}`),
      element("span", `status status--${paper.status}`, statusLabels[paper.status]),
    );
    card.append(meta);

    card.append(element("h3", "", paper.title));

    if (paper.citation) {
      card.append(element("p", "citation", paper.citation));
    }

    if (paper.review) {
      card.append(element("p", "paper-review", paper.review));
    }

    const footer = element("footer", "paper-footer");
    const tagList = element("div", "tag-list");
    tagList.setAttribute("aria-label", "태그");
    paper.tags.forEach((tag) => {
      tagList.append(element("span", "", `#${tag.replace(/^#/, "")}`));
    });
    tagList.hidden = paper.tags.length === 0;

    const updated = element(
      "time",
      "",
      paper.updated ? `UPDATED ${shortDate(paper.updated)}` : "UPDATED —",
    );
    if (paper.updated) updated.dateTime = paper.updated;

    const footerMeta = element("div", "paper-footer-meta");
    if (paper.slug) {
      const reviewLink = element("a", "paper-review-link", "리뷰 읽기 ↗");
      reviewLink.href = `./review.html?paper=${encodeURIComponent(paper.slug)}`;
      reviewLink.setAttribute("aria-label", `리뷰 읽기 — ${paper.title}`);
      footerMeta.append(reviewLink);
    }
    footerMeta.append(updated);
    footer.append(tagList, footerMeta);
    card.append(footer);

    return card;
  }

  const cardFragment = document.createDocumentFragment();
  papers.forEach((paper) => cardFragment.append(createPaperCard(paper)));
  paperList.replaceChildren(cardFragment);

  const stableCompare = (a, b) => (a === b ? 0 : a < b ? -1 : 1);
  const tagCatalogMap = new Map();
  papers.forEach((paper) => {
    paper.tags.forEach((label, index) => {
      const key = paper.tagKeys[index];
      const entry = tagCatalogMap.get(key) || { key, label, count: 0 };
      entry.count += 1;
      tagCatalogMap.set(key, entry);
    });
  });
  const tagCatalog = [...tagCatalogMap.values()].sort((a, b) => (
    b.count - a.count || a.label.localeCompare(b.label, "ko", { sensitivity: "base" })
  ));

  const tagCombinationMap = new Map();
  papers.forEach((paper) => {
    const keys = [...paper.tagKeys].sort(stableCompare);
    if (keys.length === 0) return;
    const signature = JSON.stringify(keys);
    const entry = tagCombinationMap.get(signature) || { signature, keys, count: 0 };
    entry.count += 1;
    tagCombinationMap.set(signature, entry);
  });
  const tagCombinations = [...tagCombinationMap.values()].sort((a, b) => (
    b.count - a.count || stableCompare(a.signature, b.signature)
  ));

  const tagFilterRow = document.querySelector("#tag-filter-row");
  const tagFilterGroup = document.querySelector("#tag-filter-group");
  const relationshipGraph = document.querySelector("#tag-relationship");
  const relationshipStage = document.querySelector("#relationship-stage");
  const relationshipEdges = document.querySelector("#relationship-edges");
  const relationshipNodes = document.querySelector("#relationship-nodes");
  const relationshipEmpty = document.querySelector("#relationship-empty");
  const relationshipCode = document.querySelector("#relationship-code");

  if (tagFilterRow && tagFilterGroup) {
    const filterTagFragment = document.createDocumentFragment();
    tagCatalog.forEach((entry) => {
      const filterButton = element("button", "filter-chip", `#${entry.label}`);
      filterButton.type = "button";
      filterButton.dataset.tag = entry.key;
      filterButton.setAttribute("aria-pressed", "false");
      filterButton.setAttribute("aria-label", `#${entry.label} 태그, 논문 리뷰 ${entry.count}개`);
      filterTagFragment.append(filterButton);
    });
    tagFilterRow.append(filterTagFragment);
    tagFilterGroup.hidden = tagCatalog.length === 0;
  }

  let relationshipController = { update() {} };
  const relationshipMarkupReady = Boolean(
    relationshipGraph
    && relationshipStage
    && relationshipEdges
    && relationshipNodes,
  );

  if (relationshipCode) {
    relationshipCode.textContent = `RELATIONSHIP MAP / ${countText(tagCatalog.length)} TAGS`;
  }
  if (relationshipEmpty) relationshipEmpty.hidden = tagCatalog.length > 0;
  if (relationshipGraph) relationshipGraph.hidden = tagCatalog.length === 0;

  if (relationshipMarkupReady && tagCatalog.length > 0) {
    const cooccurrence = new Map(tagCatalog.map((entry) => [entry.key, new Map()]));
    const addCooccurrence = (left, right, count) => {
      const neighbors = cooccurrence.get(left);
      neighbors.set(right, (neighbors.get(right) || 0) + count);
    };
    tagCombinations.forEach((combination) => {
      combination.keys.forEach((left, leftIndex) => {
        combination.keys.slice(leftIndex + 1).forEach((right) => {
          addCooccurrence(left, right, combination.count);
          addCooccurrence(right, left, combination.count);
        });
      });
    });

    const graphTagByKey = new Map(tagCatalog.map((entry) => [entry.key, entry]));
    const weightedDegree = (key) => [...(cooccurrence.get(key)?.values() || [])]
      .reduce((total, weight) => total + weight, 0);
    const remainingTagKeys = [...graphTagByKey.keys()].sort((a, b) => (
      weightedDegree(b) - weightedDegree(a)
      || graphTagByKey.get(b).count - graphTagByKey.get(a).count
      || stableCompare(a, b)
    ));
    const orderedTagKeys = remainingTagKeys.splice(0, 1);
    while (remainingTagKeys.length > 0) {
      let best = null;
      remainingTagKeys.forEach((key) => {
        orderedTagKeys.forEach((left, slot) => {
          const right = orderedTagKeys[(slot + 1) % orderedTagKeys.length];
          const gain = (cooccurrence.get(left)?.get(key) || 0)
            + (cooccurrence.get(key)?.get(right) || 0)
            - (cooccurrence.get(left)?.get(right) || 0);
          const candidate = { key, slot, gain };
          if (
            !best
            || candidate.gain > best.gain
            || (
              candidate.gain === best.gain
              && (
                stableCompare(candidate.key, best.key) < 0
                || (candidate.key === best.key && candidate.slot < best.slot)
              )
            )
          ) {
            best = candidate;
          }
        });
      });
      orderedTagKeys.splice(best.slot + 1, 0, best.key);
      remainingTagKeys.splice(remainingTagKeys.indexOf(best.key), 1);
    }

    const graphTags = orderedTagKeys.map((key) => graphTagByKey.get(key));
    const tagEntryByKey = new Map(graphTags.map((entry) => [entry.key, entry]));
    const tagNodeRecords = graphTags.map((entry) => {
      const button = element("button", "relationship-tag");
      button.type = "button";
      button.dataset.tagJump = entry.key;
      button.title = `#${entry.label} · 리뷰 ${entry.count}개`;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute(
        "aria-label",
        `#${entry.label} 태그, 논문 리뷰 ${entry.count}개. 선택하면 해당 리뷰만 표시합니다.`,
      );
      button.append(
        element("span", "relationship-tag-name", `#${entry.label}`),
        element("span", "relationship-tag-count", `${countText(entry.count)} REVIEWS`),
      );
      relationshipNodes.append(button);
      return { entry, node: button, position: { x: 0, y: 0 } };
    });

    const combinationNodeRecords = tagCombinations.map((entry) => {
      const labels = entry.keys.map((key) => tagEntryByKey.get(key)?.label || key);
      const node = element("div", "relationship-group");
      const countNode = element("span", "relationship-group-count", countText(entry.count));
      node.setAttribute("role", "img");
      node.setAttribute(
        "aria-label",
        `정확히 ${labels.map((label) => `#${label}`).join(" + ")} 태그 조합, 논문 리뷰 ${entry.count}개`,
      );
      node.append(countNode);
      relationshipNodes.append(node);
      return {
        entry,
        node,
        countNode,
        radius: 0,
        target: { x: 0, y: 0 },
        position: { x: 0, y: 0 },
      };
    });

    let edgeRecords = [];
    let activeRelationshipTag = "";

    function updateRelationshipState() {
      combinationNodeRecords.forEach((record) => {
        const unrelated = activeRelationshipTag
          && !record.entry.keys.includes(activeRelationshipTag);
        record.node.classList.toggle("is-muted", Boolean(unrelated));
      });
      edgeRecords.forEach((record) => {
        const unrelated = activeRelationshipTag
          && !record.keys.includes(activeRelationshipTag);
        record.node.classList.toggle("is-muted", Boolean(unrelated));
      });
    }

    function setNodePosition(node, position) {
      node.style.left = `${Math.round(position.x * 10) / 10}px`;
      node.style.top = `${Math.round(position.y * 10) / 10}px`;
    }

    function hashText(value) {
      let hash = 2166136261;
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function hashedDirection(value) {
      const angle = (hashText(value) / 4294967296) * Math.PI * 2;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    }

    function ellipsePoint(center, radiusX, radiusY, angle) {
      return {
        x: center.x + Math.cos(angle) * radiusX,
        y: center.y + Math.sin(angle) * radiusY,
      };
    }

    function equallySpacedEllipsePoints(count, center, radiusX, radiusY) {
      if (count === 0) return [];
      const startAngle = Math.PI;
      const sampleCount = Math.max(720, count * 96);
      const samples = [{ angle: startAngle, length: 0 }];
      let previous = ellipsePoint(center, radiusX, radiusY, startAngle);
      let totalLength = 0;
      for (let sample = 1; sample <= sampleCount; sample += 1) {
        const angle = startAngle + (Math.PI * 2 * sample) / sampleCount;
        const point = ellipsePoint(center, radiusX, radiusY, angle);
        totalLength += Math.hypot(point.x - previous.x, point.y - previous.y);
        samples.push({ angle, length: totalLength });
        previous = point;
      }

      return Array.from({ length: count }, (_, index) => {
        const targetLength = totalLength * index / count;
        let low = 0;
        let high = samples.length - 1;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (samples[middle].length < targetLength) low = middle + 1;
          else high = middle;
        }
        const upper = samples[low];
        const lower = samples[Math.max(0, low - 1)];
        const segmentLength = Math.max(0.0001, upper.length - lower.length);
        const ratio = (targetLength - lower.length) / segmentLength;
        const angle = lower.angle + (upper.angle - lower.angle) * ratio;
        return ellipsePoint(center, radiusX, radiusY, angle);
      });
    }

    function minimumPairDistance(points) {
      let minimum = Number.POSITIVE_INFINITY;
      points.forEach((left, leftIndex) => {
        points.slice(leftIndex + 1).forEach((right) => {
          minimum = Math.min(minimum, Math.hypot(left.x - right.x, left.y - right.y));
        });
      });
      return minimum;
    }

    function projectIntoEllipse(record, center, bounds) {
      const radiusX = Math.max(1, bounds.x - record.radius);
      const radiusY = Math.max(1, bounds.y - record.radius);
      const deltaX = record.position.x - center.x;
      const deltaY = record.position.y - center.y;
      const ratio = (deltaX / radiusX) ** 2 + (deltaY / radiusY) ** 2;
      if (ratio <= 1) return;
      const scale = 1 / Math.sqrt(ratio);
      record.position.x = center.x + deltaX * scale;
      record.position.y = center.y + deltaY * scale;
    }

    function relaxCombinationNodes(center, bounds, tagSize) {
      const tagRadius = tagSize / 2;
      const tagRecordByKey = new Map(tagNodeRecords.map((record) => [record.entry.key, record]));

      combinationNodeRecords.forEach((record, index) => {
        const members = record.entry.keys
          .map((key) => tagRecordByKey.get(key))
          .filter(Boolean);
        const centroid = members.reduce((position, member) => ({
          x: position.x + member.position.x / members.length,
          y: position.y + member.position.y / members.length,
        }), { x: 0, y: 0 });
        record.target = {
          x: center.x + (centroid.x - center.x) * 0.38,
          y: center.y + (centroid.y - center.y) * 0.38,
        };
        const direction = hashedDirection(`${record.entry.signature}:${index}`);
        const offset = 8 + (hashText(record.entry.signature) % 19);
        record.position = {
          x: record.target.x + direction.x * offset,
          y: record.target.y + direction.y * offset,
        };
        projectIntoEllipse(record, center, bounds);
      });

      const applyRelaxation = (ticks, attraction) => {
        for (let tick = 0; tick < ticks; tick += 1) {
          const deltas = combinationNodeRecords.map(() => ({ x: 0, y: 0 }));
          const alpha = 1 - tick / Math.max(1, ticks);

          if (attraction > 0) {
            combinationNodeRecords.forEach((record, index) => {
              deltas[index].x += (record.target.x - record.position.x) * attraction * alpha;
              deltas[index].y += (record.target.y - record.position.y) * attraction * alpha;
            });
          }

          combinationNodeRecords.forEach((left, leftIndex) => {
            combinationNodeRecords.slice(leftIndex + 1).forEach((right, offset) => {
              const rightIndex = leftIndex + offset + 1;
              let deltaX = left.position.x - right.position.x;
              let deltaY = left.position.y - right.position.y;
              let distance = Math.hypot(deltaX, deltaY);
              if (distance < 0.001) {
                const direction = hashedDirection(`${left.entry.signature}|${right.entry.signature}`);
                deltaX = direction.x;
                deltaY = direction.y;
                distance = 1;
              }
              const minimum = left.radius + right.radius + 12;
              if (distance >= minimum) return;
              const push = (minimum - distance) * 0.54;
              const unitX = deltaX / distance;
              const unitY = deltaY / distance;
              deltas[leftIndex].x += unitX * push;
              deltas[leftIndex].y += unitY * push;
              deltas[rightIndex].x -= unitX * push;
              deltas[rightIndex].y -= unitY * push;
            });
          });

          combinationNodeRecords.forEach((record, recordIndex) => {
            tagNodeRecords.forEach((tagRecord) => {
              let deltaX = record.position.x - tagRecord.position.x;
              let deltaY = record.position.y - tagRecord.position.y;
              let distance = Math.hypot(deltaX, deltaY);
              if (distance < 0.001) {
                const direction = hashedDirection(`${record.entry.signature}|${tagRecord.entry.key}`);
                deltaX = direction.x;
                deltaY = direction.y;
                distance = 1;
              }
              const minimum = record.radius + tagRadius + 10;
              if (distance >= minimum) return;
              const push = (minimum - distance) * 0.82;
              deltas[recordIndex].x += deltaX / distance * push;
              deltas[recordIndex].y += deltaY / distance * push;
            });
          });

          combinationNodeRecords.forEach((record, index) => {
            const magnitude = Math.hypot(deltas[index].x, deltas[index].y);
            const scale = magnitude > 12 ? 12 / magnitude : 1;
            record.position.x += deltas[index].x * scale;
            record.position.y += deltas[index].y * scale;
            projectIntoEllipse(record, center, bounds);
          });
        }
      };

      applyRelaxation(220, 0.035);
      applyRelaxation(80, 0);
    }

    function maximumOverlap(tagSize) {
      const tagRadius = tagSize / 2;
      let overlap = 0;
      combinationNodeRecords.forEach((left, leftIndex) => {
        combinationNodeRecords.slice(leftIndex + 1).forEach((right) => {
          overlap = Math.max(
            overlap,
            left.radius + right.radius + 12
              - Math.hypot(left.position.x - right.position.x, left.position.y - right.position.y),
          );
        });
        tagNodeRecords.forEach((tagRecord) => {
          overlap = Math.max(
            overlap,
            left.radius + tagRadius + 10
              - Math.hypot(
                left.position.x - tagRecord.position.x,
                left.position.y - tagRecord.position.y,
              ),
          );
        });
      });
      return overlap;
    }

    function layoutRelationshipGraph() {
      const width = Math.max(280, Math.round(relationshipStage.clientWidth));
      const narrow = width < 620;
      const tagSize = width < 380 ? 82 : narrow ? 88 : 96;
      const tagRadius = tagSize / 2;
      const outerPadding = narrow ? 18 : 48;
      const outerRadiusX = Math.max(tagSize, width / 2 - outerPadding - tagRadius);
      const groupBoundsX = Math.max(8, outerRadiusX - tagRadius - 14);
      const maxCombinationCount = tagCombinations.reduce(
        (maximum, entry) => Math.max(maximum, entry.count),
        1,
      );
      const maximumGroupRadius = Math.max(
        2,
        Math.min(narrow ? 44 : 48, groupBoundsX - 2),
      );
      const radiusUnit = Math.min(
        narrow ? 18 : 21,
        maximumGroupRadius / Math.sqrt(maxCombinationCount),
      );

      combinationNodeRecords.forEach((record) => {
        record.radius = radiusUnit * Math.sqrt(record.entry.count);
        const diameter = record.radius * 2;
        record.node.style.setProperty("--relationship-group-size", `${diameter}px`);
        record.node.style.setProperty(
          "--relationship-group-font-size",
          `${Math.max(7, Math.min(12, record.radius * 0.6))}px`,
        );
        record.node.classList.toggle("relationship-group--micro", diameter < 18);
        record.countNode.hidden = diameter < 18;
      });

      const expandedGroupArea = combinationNodeRecords.reduce(
        (total, record) => total + Math.PI * (record.radius + 10) ** 2,
        0,
      );
      const desiredBoundsY = expandedGroupArea
        / (Math.PI * groupBoundsX * (narrow ? 0.38 : 0.3));
      let height = Math.max(
        narrow ? 470 : 460,
        Math.ceil(2 * (desiredBoundsY + outerPadding + tagSize + 14)),
      );

      let center;
      let bounds;
      let settled = false;
      if (narrow) {
        const tagGap = 16;
        const groupGap = 12;
        const tagRows = Math.ceil(tagNodeRecords.length / 2);
        const tagContentHeight = tagRows * tagSize + Math.max(0, tagRows - 1) * tagGap;
        const groupContentHeight = combinationNodeRecords.reduce(
          (total, record) => total + record.radius * 2,
          Math.max(0, combinationNodeRecords.length - 1) * groupGap,
        );
        height = Math.max(
          470,
          tagContentHeight + outerPadding * 2,
          groupContentHeight + outerPadding * 2 + 16,
        );
        center = { x: width / 2, y: height / 2 };

        const tagTop = (height - tagContentHeight) / 2 + tagRadius;
        tagNodeRecords.forEach((record, index) => {
          record.position = {
            x: index % 2 === 0
              ? outerPadding + tagRadius
              : width - outerPadding - tagRadius,
            y: tagTop + Math.floor(index / 2) * (tagSize + tagGap),
          };
        });

        let groupY = (height - groupContentHeight) / 2;
        combinationNodeRecords.forEach((record) => {
          groupY += record.radius;
          record.position = { x: center.x, y: groupY };
          groupY += record.radius + groupGap;
        });
        settled = true;
      } else {
        for (let attempt = 0; attempt < 7 && !settled; attempt += 1) {
          for (let spacingAttempt = 0; spacingAttempt < 28; spacingAttempt += 1) {
            center = { x: width / 2, y: height / 2 };
            const outerRadiusY = Math.max(
              tagSize,
              height / 2 - outerPadding - tagRadius,
            );
            const positions = equallySpacedEllipsePoints(
              tagNodeRecords.length,
              center,
              outerRadiusX,
              outerRadiusY,
            );
            tagNodeRecords.forEach((record, index) => {
              record.position = positions[index];
            });
            bounds = {
              x: groupBoundsX,
              y: Math.max(8, outerRadiusY - tagRadius - 14),
            };
            if (
              tagNodeRecords.length < 2
              || minimumPairDistance(positions) >= tagSize + 12
            ) {
              break;
            }
            height = Math.ceil(height * 1.12 + 20);
          }

          relaxCombinationNodes(center, bounds, tagSize);
          settled = maximumOverlap(tagSize) <= 0.75;
          if (!settled) height = Math.ceil(height * 1.16 + 32);
        }

        if (!settled) {
          const groupGap = 12;
          const maximumRadius = combinationNodeRecords.reduce(
            (maximum, record) => Math.max(maximum, record.radius),
            1,
          );
          const cellSize = maximumRadius * 2 + groupGap;
          const maximumColumns = Math.max(
            1,
            Math.floor((groupBoundsX * 2 + groupGap) / cellSize),
          );
          const columns = Math.min(
            maximumColumns,
            Math.max(1, Math.ceil(Math.sqrt(combinationNodeRecords.length))),
          );
          const rows = Math.ceil(combinationNodeRecords.length / columns);
          const contentWidth = columns * maximumRadius * 2
            + Math.max(0, columns - 1) * groupGap;
          const contentHeight = rows * maximumRadius * 2
            + Math.max(0, rows - 1) * groupGap;
          height = Math.max(
            height,
            Math.ceil(
              contentHeight
              + 2 * (outerPadding + tagSize + maximumRadius + 20),
            ),
          );

          for (let packingAttempt = 0; packingAttempt < 7; packingAttempt += 1) {
            center = { x: width / 2, y: height / 2 };
            const outerRadiusY = Math.max(
              tagSize,
              height / 2 - outerPadding - tagRadius,
            );
            const tagPositions = equallySpacedEllipsePoints(
              tagNodeRecords.length,
              center,
              outerRadiusX,
              outerRadiusY,
            );
            if (
              tagNodeRecords.length > 1
              && minimumPairDistance(tagPositions) < tagSize + 12
            ) {
              height = Math.ceil(height * 1.12 + 20);
              continue;
            }
            tagNodeRecords.forEach((record, index) => {
              record.position = tagPositions[index];
            });
            combinationNodeRecords.forEach((record, index) => {
              const column = index % columns;
              const row = Math.floor(index / columns);
              record.position = {
                x: center.x - contentWidth / 2 + maximumRadius + column * cellSize,
                y: center.y - contentHeight / 2 + maximumRadius + row * cellSize,
              };
            });
            settled = maximumOverlap(tagSize) <= 0.75;
            if (settled) break;
            height = Math.ceil(height * 1.14 + 28);
          }
        }
      }

      relationshipStage.style.height = `${height}px`;
      relationshipEdges.setAttribute("viewBox", `0 0 ${width} ${height}`);
      relationshipEdges.setAttribute("width", String(width));
      relationshipEdges.setAttribute("height", String(height));

      tagNodeRecords.forEach((record) => {
        record.node.style.setProperty("--relationship-tag-size", `${tagSize}px`);
        setNodePosition(record.node, record.position);
      });
      combinationNodeRecords.forEach((record) => setNodePosition(record.node, record.position));

      const svgNamespace = "http://www.w3.org/2000/svg";
      const tagRecordByKey = new Map(tagNodeRecords.map((record) => [record.entry.key, record]));
      edgeRecords = [];
      const edgeFragment = document.createDocumentFragment();
      combinationNodeRecords.forEach((combinationRecord) => {
        combinationRecord.entry.keys.forEach((key) => {
          const tagRecord = tagRecordByKey.get(key);
          if (!tagRecord) return;
          const line = document.createElementNS(svgNamespace, "line");
          line.setAttribute("class", "relationship-edge");
          line.setAttribute("x1", combinationRecord.position.x.toFixed(1));
          line.setAttribute("y1", combinationRecord.position.y.toFixed(1));
          line.setAttribute("x2", tagRecord.position.x.toFixed(1));
          line.setAttribute("y2", tagRecord.position.y.toFixed(1));
          edgeFragment.append(line);
          edgeRecords.push({ node: line, keys: combinationRecord.entry.keys });
        });
      });
      relationshipEdges.replaceChildren(edgeFragment);
      updateRelationshipState();
    }

    relationshipController = {
      update(activeTag) {
        activeRelationshipTag = activeTag;
        updateRelationshipState();
      },
    };

    let lastLayoutWidth = 0;
    let layoutFrame = 0;
    const scheduleRelationshipLayout = (force = false) => {
      const nextWidth = Math.round(relationshipStage.clientWidth);
      if (!force && nextWidth === lastLayoutWidth) return;
      lastLayoutWidth = nextWidth;
      if (layoutFrame) cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        layoutRelationshipGraph();
      });
    };

    requestAnimationFrame(() => scheduleRelationshipLayout(true));
    if (typeof ResizeObserver === "function") {
      const relationshipResizeObserver = new ResizeObserver(() => {
        scheduleRelationshipLayout();
      });
      relationshipResizeObserver.observe(relationshipStage);
      relationshipController.resizeObserver = relationshipResizeObserver;
    } else {
      window.addEventListener("resize", () => scheduleRelationshipLayout(), { passive: true });
    }
  }

  function updateArchiveSummary() {
    const doneCount = papers.filter((paper) => paper.status === "done").length;
    const latest = papers.slice().sort((a, b) => b.order - a.order)[0];

    const values = {
      "#stat-notes": countText(papers.length),
      "#stat-tags": countText(tagCatalog.length),
      "#stat-done": countText(doneCount),
      "#stat-updated": latest?.updated ? shortDate(latest.updated) : "—",
      "#library-code": `REVIEWS / ${countText(papers.length)}`,
    };
    Object.entries(values).forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    });

    const latestLink = document.querySelector("#overview-latest-link");
    const latestTime = document.querySelector("#stat-updated");
    if (latestLink && latest?.slug) {
      latestLink.href = `./review.html?paper=${encodeURIComponent(latest.slug)}`;
      latestLink.setAttribute("aria-label", `최근 업데이트 리뷰 열기 — ${latest.title}`);
    }
    if (latestTime) {
      if (latest?.updated) latestTime.dateTime = latest.updated;
      else latestTime.removeAttribute("datetime");
    }

    const archiveNotice = document.querySelector("#archive-notice");
    if (archiveNotice) {
      archiveNotice.textContent = libraryLoadFailed
        ? "논문 Markdown을 불러오지 못했습니다. 아래 파일 안내를 확인해 주세요."
        : "논문을 추가하면 아카이브 통계가 자동으로 갱신됩니다.";
      archiveNotice.hidden = papers.length > 0;
    }

  }

  updateArchiveSummary();

  const controls = document.querySelector("#paper-controls");
  const searchInput = document.querySelector("#paper-search");
  const clearSearchButton = document.querySelector("#clear-search");
  const sortSelect = document.querySelector("#paper-sort");
  const cards = Array.from(paperList.querySelectorAll(".paper-card"));
  const tagButtons = controls ? Array.from(controls.querySelectorAll("[data-tag]")) : [];
  const statusButtons = controls ? Array.from(controls.querySelectorAll("[data-status]")) : [];
  const tagJumpButtons = Array.from(document.querySelectorAll("[data-tag-jump]"));
  const overviewStatusLinks = Array.from(
    document.querySelectorAll("[data-overview-status]"),
  );
  const resultBar = document.querySelector("#result-bar");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");
  const emptyCode = document.querySelector("#empty-code");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyDescription = document.querySelector("#empty-description");
  const resetButton = document.querySelector("#reset-filters");

  if (
    !controls ||
    !searchInput ||
    !clearSearchButton ||
    !sortSelect ||
    !resultBar ||
    !resultCount ||
    !emptyState ||
    !emptyCode ||
    !emptyTitle ||
    !emptyDescription ||
    !resetButton ||
    statusButtons.length === 0
  ) {
    return;
  }

  const state = {
    query: "",
    tag: "",
    status: "all",
    sort: "recent",
  };

  const paperSearchIndex = new Map(
    papers.map((paper) => [
      paper.slug,
      normalize([
        paper.title,
        paper.citation,
        paper.review,
        paper.tags.join(" "),
        paper.tags.map((tag) => `#${tag}`).join(" "),
        paper.searchText,
      ].join(" ")),
    ]),
  );
  const searchableText = new Map(
    cards.map((card) => [
      card,
      paperSearchIndex.get(card.dataset.slug) || normalize(card.dataset.search || ""),
    ]),
  );
  const papersBySlug = new Map(papers.map((paper) => [paper.slug, paper]));
  const tagKeysByCard = new Map(
    cards.map((card) => [
      card,
      papersBySlug.get(card.dataset.slug)?.tagKeys || [],
    ]),
  );

  function setPressed(buttons, activeValue, dataKey) {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[dataKey] === activeValue));
    });
  }

  function setCurrentOverviewStatus() {
    overviewStatusLinks.forEach((link) => {
      const isCurrent = link.dataset.overviewStatus === state.status;
      if (isCurrent) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function compareCards(a, b) {
    if (state.sort === "oldest") {
      return Number(a.dataset.order) - Number(b.dataset.order);
    }

    if (state.sort === "title") {
      return (a.dataset.title || "").localeCompare(b.dataset.title || "", "en", {
        sensitivity: "base",
      });
    }

    return Number(b.dataset.order) - Number(a.dataset.order);
  }

  function render() {
    const query = normalize(state.query);
    const visibleCards = cards.filter((card) => {
      const matchesQuery = query === "" || searchableText.get(card).includes(query);
      const matchesTag = state.tag === "" || tagKeysByCard.get(card).includes(state.tag);
      const matchesStatus = state.status === "all" || card.dataset.status === state.status;
      return matchesQuery && matchesTag && matchesStatus;
    });

    const sortedCards = cards.slice().sort(compareCards);
    sortedCards.forEach((card) => paperList.append(card));

    cards.forEach((card) => {
      card.classList.remove("paper-card--wide");
      card.hidden = !visibleCards.includes(card);
    });

    const sortedVisibleCards = sortedCards.filter((card) => visibleCards.includes(card));
    if (sortedVisibleCards.length % 2 === 1) {
      sortedVisibleCards[sortedVisibleCards.length - 1].classList.add("paper-card--wide");
    }

    const visibleCount = visibleCards.length;
    const libraryIsEmpty = cards.length === 0;
    resultBar.hidden = libraryIsEmpty;
    controls.hidden = libraryIsEmpty;
    controls.querySelectorAll("input, button, select").forEach((control) => {
      control.disabled = libraryIsEmpty;
    });

    if (libraryIsEmpty) {
      if (libraryLoadFailed) {
        resultCount.textContent = "논문 Markdown을 불러오지 못했습니다.";
        emptyCode.textContent = "REVIEWS / LOAD ERROR";
        emptyTitle.textContent = "논문 파일을 확인해 주세요.";
        emptyDescription.textContent = "위 안내에 표시된 파일을 수정한 뒤 페이지를 새로고침해 주세요.";
      } else {
        resultCount.textContent = "등록된 논문 리뷰가 없습니다.";
        emptyCode.textContent = "REVIEWS / EMPTY";
        emptyTitle.textContent = "아직 등록된 논문이 없습니다.";
        emptyDescription.textContent = "첫 논문을 추가하면 카드와 검색·필터가 표시됩니다.";
      }
      emptyState.hidden = false;
      resetButton.hidden = true;
    } else {
      resultCount.textContent = `논문 리뷰 ${visibleCount} / ${cards.length}개 표시 중`;
      emptyCode.textContent = "NO MATCH / 000";
      emptyTitle.textContent = "조건에 맞는 리뷰가 없습니다.";
      emptyDescription.textContent = "검색어를 줄이거나 필터를 초기화해 보세요.";
      emptyState.hidden = visibleCount !== 0;
      resetButton.hidden = visibleCount !== 0;
    }

    clearSearchButton.hidden = state.query.length === 0;
    setPressed(tagButtons, state.tag, "tag");
    setPressed(statusButtons, state.status, "status");
    setPressed(tagJumpButtons, state.tag, "tagJump");
    relationshipController.update(state.tag);
    setCurrentOverviewStatus();
  }

  function resetFilters({ focusSearch = false, status = "all" } = {}) {
    state.query = "";
    state.tag = "";
    state.status = status;
    state.sort = "recent";
    searchInput.value = "";
    sortSelect.value = "recent";
    setPressed(tagButtons, "", "tag");
    setPressed(statusButtons, status, "status");
    render();

    if (focusSearch) searchInput.focus();
  }

  controls.addEventListener("submit", (event) => event.preventDefault());

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    render();
  });

  clearSearchButton.addEventListener("click", () => {
    state.query = "";
    searchInput.value = "";
    render();
    searchInput.focus();
  });

  tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.tag = button.dataset.tag;
      render();
    });
  });

  statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      setPressed(statusButtons, state.status, "status");
      render();
    });
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  tagJumpButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      state.tag = state.tag === button.dataset.tagJump ? "" : button.dataset.tagJump;
      state.query = "";
      state.status = "all";
      searchInput.value = "";
      setPressed(statusButtons, "all", "status");
      render();
      if (event.detail === 0) {
        document.querySelector("#library-title")?.focus({ preventScroll: true });
      }
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector("#library").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  overviewStatusLinks.forEach((link) => {
    link.addEventListener("click", () => {
      resetFilters({ status: link.dataset.overviewStatus });
    });
  });

  resetButton.addEventListener("click", () => resetFilters({ focusSearch: true }));
  render();

  if (window.location.hash === "#tags") {
    requestAnimationFrame(() => {
      document.querySelector("#tags")?.scrollIntoView({ block: "start" });
    });
  }
})();
