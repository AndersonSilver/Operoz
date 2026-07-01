function getCfg() {
  return window.__PRD_REVIEW_CONFIG__ || {};
}
var FEEDBACK_EMAIL = "";
var DOC_TITLE = "PRD";
var STORAGE_KEY = "operoz-prd-review-comments";
var comments = {};
var inlineComments = [];
var pendingSelection = null;
var currentInlineBadge = null;

function syncCfgConstants() {
  var cfg = getCfg();
  FEEDBACK_EMAIL = cfg.feedbackEmail || "";
  DOC_TITLE = cfg.docTitle || "PRD";
  STORAGE_KEY = cfg.storageKey || "operoz-prd-review-comments";
}
syncCfgConstants();

function isEmbeddedGuest() {
  return !!getCfg().embeddedGuest;
}
function postToParent(type, payload) {
  if (!isEmbeddedGuest()) return;
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: type, payload: payload || {} }, "*");
  }
}
function hideEmbeddedGuestChrome() {
  if (!isEmbeddedGuest()) return;
  var ids = ["approvalBanner", "btnAdjustFloat", "summaryOverlay"];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document
    .querySelectorAll(
      ".btn-comment, .comment-block, .comment-saved-card, .section-comment-indicator, " +
        ".inline-comments-wrap, .magalu-api-heading-right, #selectionToolbar, " +
        "#inlineCommentPopover, #inlineCommentViewer"
    )
    .forEach(function (el) {
      el.style.display = "none";
    });
}

function getContent() {
  return document.getElementById("content");
}
function getCommentBlock(sectionId) {
  return document.getElementById("comment-block-" + sectionId);
}
function getTextarea(sectionId) {
  var b = getCommentBlock(sectionId);
  return b ? b.querySelector("textarea") : null;
}
function getSavedEl(sectionId) {
  return document.getElementById("saved-" + sectionId);
}
function getCommentBtn(sectionId) {
  return document.querySelector('.btn-comment[data-section="' + sectionId + '"]');
}
function getSavedCard(sectionId) {
  return document.getElementById("saved-card-" + sectionId);
}
function getSectionTitle(sectionId) {
  var section = document.getElementById(sectionId);
  if (!section) return sectionId;
  var titleEl = section.querySelector(".section-title, h2, h3");
  if (titleEl) return titleEl.textContent.trim();
  var content = getContent();
  if (content && section === content) return DOC_TITLE;
  return sectionId;
}

function resolveSectionFromNode(node) {
  if (!node || !node.closest) return null;
  var section = node.closest(".doc-section, .pendencias-section");
  if (section) {
    if (!section.id) {
      var h2 = section.querySelector(".section-title, h2");
      if (h2 && h2.id) section.id = h2.id;
      else section.id = "section-" + String(Math.random()).slice(2, 10);
    }
    return section;
  }
  var content = getContent();
  if (content && content.contains(node)) {
    if (!content.id) content.id = "content";
    return content;
  }
  return null;
}

function getStorage() {
  return window.__PRD_REVIEW_STORAGE__ || null;
}
function usesApiStorage() {
  var storage = getStorage();
  return !!(storage && typeof storage.saveComment === "function");
}
function notifyParentCommentsChanged() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "operoz-prd-review-comments-changed" }, "*");
  }
  if (isEmbeddedGuest()) {
    postToParent("operoz-prd-comment-save", {
      inlineCount: inlineComments.length,
      sectionCount: Object.keys(comments).length,
    });
  }
}
function applyStoragePayload(data) {
  comments = data.comments && typeof data.comments === "object" ? data.comments : {};
  inlineComments = Array.isArray(data.inlineComments) ? data.inlineComments : [];
}
function mergeStorageResponse(data) {
  var storage = getStorage();
  if (storage && typeof storage.syncFromResponse === "function") {
    applyStoragePayload(storage.syncFromResponse(data));
    return;
  }
  if (data && data.section_comments) {
    applyStoragePayload({
      comments: data.section_comments,
      inlineComments: data.inline_comments || inlineComments,
    });
  }
}

function safeStorageGet() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}
function safeStorageSet(v) {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch (e) {}
}

function saveStateLocal() {
  if (!getContent()) return;
  var payload = { comments: comments, inlineComments: inlineComments };
  safeStorageSet(JSON.stringify(payload));
}

function saveState() {
  if (usesApiStorage()) return;
  saveStateLocal();
}

function loadStateLocal() {
  var raw = safeStorageGet();
  if (!raw) return;
  try {
    var parsed = JSON.parse(raw);
    applyStoragePayload(parsed);
  } catch (e) {
    comments = {};
    inlineComments = [];
  }
}

function loadStateAsync(done) {
  var storage = getStorage();
  if (storage && typeof storage.load === "function") {
    storage
      .load()
      .then(function (data) {
        applyStoragePayload(data || {});
        if (done) done();
      })
      .catch(function () {
        if (done) done();
      });
    return;
  }
  loadStateLocal();
  if (done) done();
}

function loadState() {
  loadStateLocal();
}

function persistSectionComment(sectionId, title, text) {
  if (!usesApiStorage()) {
    saveStateLocal();
    notifyParentCommentsChanged();
    return Promise.resolve();
  }
  var storage = getStorage();
  var existing = comments[sectionId];
  if (!text) {
    if (existing && existing.id) {
      return storage.deleteComment({ comment_id: existing.id }).then(function (res) {
        mergeStorageResponse(res);
        notifyParentCommentsChanged();
      });
    }
    notifyParentCommentsChanged();
    return Promise.resolve();
  }
  return storage
    .saveComment({
      type: "section",
      section_id: sectionId,
      body: text,
      comment_id: existing && existing.id,
    })
    .then(function (res) {
      mergeStorageResponse(res);
      if (comments[sectionId]) comments[sectionId].title = title;
      notifyParentCommentsChanged();
    });
}

function persistInlineComment(entry) {
  if (!usesApiStorage()) {
    saveStateLocal();
    notifyParentCommentsChanged();
    return Promise.resolve(entry);
  }
  var storage = getStorage();
  return storage
    .saveComment({
      type: "inline",
      section_id: entry.sectionId,
      body: entry.text,
      quote: entry.quote,
      comment_id: entry.id && String(entry.id).indexOf("ic-") !== 0 ? entry.id : undefined,
    })
    .then(function (res) {
      mergeStorageResponse(res);
      var saved = inlineComments
        .filter(function (c) {
          return c.quote === entry.quote && c.text === entry.text;
        })
        .pop();
      notifyParentCommentsChanged();
      return saved || entry;
    });
}

function persistInlineDelete(commentId) {
  if (!usesApiStorage()) {
    saveStateLocal();
    notifyParentCommentsChanged();
    return Promise.resolve();
  }
  if (!commentId) {
    notifyParentCommentsChanged();
    return Promise.resolve();
  }
  return getStorage()
    .deleteComment({ comment_id: commentId })
    .then(function (res) {
      mergeStorageResponse(res);
      notifyParentCommentsChanged();
    });
}

function applyStoredCommentToSectionUI(sectionId) {
  var c = comments[sectionId];
  if (!c || !c.text || !String(c.text).trim()) return;
  var text = String(c.text).trim();
  var card = document.getElementById("saved-card-" + sectionId);
  var textEl = card && card.querySelector(".comment-saved-text");
  var ind = document.getElementById("comment-indicator-" + sectionId);
  var bc = document.querySelector('.btn-comment[data-section="' + sectionId + '"]');
  if (textEl) textEl.textContent = text;
  if (card) {
    card.classList.add("show");
    card.classList.remove("expanded");
  }
  if (ind) ind.classList.add("show");
  if (bc) bc.classList.add("has-comment");
}

function injectMagaluApiCommentHeaders(content) {
  if (!content) return;
  var sections = content.querySelectorAll(".doc-section");
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    var st = sec.querySelector(".section-title");
    if (!st) continue;
    var tt = (st.textContent || "").trim();
    if (tt.indexOf("Detalhamento") === -1 || tt.indexOf("API") === -1) continue;
    var parentSectionId = sec.id;
    if (!parentSectionId) continue;
    var body = sec.querySelector(".section-body");
    if (!body) continue;
    var n = 0;
    var candidates = [];
    body.querySelectorAll("h3").forEach(function (h) {
      if (!h.closest(".magalu-api-heading-wrap")) candidates.push(h);
    });
    for (var hi = 0; hi < candidates.length; hi++) {
      var h3 = candidates[hi];
      if (h3.closest(".magalu-api-heading-wrap")) continue;
      var txt = (h3.textContent || "").trim();
      if (!/^\d+\.\s+API\s/.test(txt)) continue;
      if (txt.indexOf("Integrações Tech4H") !== -1) continue;
      n++;
      var subId = parentSectionId + "-magalu-api-" + n;
      var parent = h3.parentNode;
      var nextRef = h3.nextSibling;
      var wrap = document.createElement("div");
      wrap.className = "magalu-api-heading-wrap";
      var row = document.createElement("div");
      row.className = "magalu-api-heading-row";
      var right = document.createElement("div");
      right.className = "magalu-api-heading-right";
      var indicator = document.createElement("button");
      indicator.type = "button";
      indicator.className = "section-comment-indicator";
      indicator.id = "comment-indicator-" + subId;
      indicator.setAttribute("data-section", subId);
      indicator.setAttribute("aria-label", "Ver comentário");
      indicator.textContent = "\uD83D\uDCAC";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-comment";
      btn.setAttribute("data-section", subId);
      btn.setAttribute("data-title", txt);
      btn.textContent = "\uD83D\uDCAC Comentar";
      right.appendChild(indicator);
      right.appendChild(btn);
      row.appendChild(h3);
      row.appendChild(right);
      wrap.appendChild(row);
      parent.insertBefore(wrap, nextRef);
      var commentBlock = document.createElement("div");
      commentBlock.className = "comment-block";
      commentBlock.id = "comment-block-" + subId;
      commentBlock.setAttribute("data-section", subId);
      commentBlock.innerHTML =
        '<button type="button" class="btn-close-comment" aria-label="Fechar sem salvar">\u00D7</button><textarea placeholder="Comentário ou ajuste nesta API (Magalu)..." rows="3"></textarea><div class="comment-saved" id="saved-' +
        subId +
        '">Comentário salvo.</div><button type="button" class="btn-save-comment" data-section="' +
        subId +
        '">Salvar comentário</button>';
      parent.insertBefore(commentBlock, wrap.nextSibling);
      var savedCard = document.createElement("div");
      savedCard.className = "comment-saved-card";
      savedCard.id = "saved-card-" + subId;
      savedCard.setAttribute("data-section", subId);
      savedCard.innerHTML =
        '<div class="comment-saved-card-header" data-section="' +
        subId +
        '"><span class="label">\uD83D\uDCAC Comentário na API</span><span class="chevron">\u25BC</span></div><div class="comment-saved-card-body"><p class="comment-saved-text"></p><button type="button" class="btn-edit-comment" data-section="' +
        subId +
        '">Editar</button><button type="button" class="btn-delete-comment" data-section="' +
        subId +
        '">Apagar</button></div>';
      parent.insertBefore(savedCard, commentBlock.nextSibling);
    }
  }
  Object.keys(comments).forEach(function (sid) {
    if (sid.indexOf("-magalu-api-") !== -1) applyStoredCommentToSectionUI(sid);
  });
}

function bindInlineBadges() {
  /* Abertura do viewer: delegação em #content (uma vez), assim após loadState/innerHTML o clique continua funcionando. */
}

function ensureInlineReviewUiShell() {
  if (isEmbeddedGuest()) return;
  if (!document.getElementById("selectionToolbar")) {
    var toolbar = document.createElement("div");
    toolbar.className = "selection-toolbar";
    toolbar.id = "selectionToolbar";
    toolbar.innerHTML = '<button type="button" id="btnCommentSelection">\uD83D\uDCAC Comentar neste trecho</button>';
    document.body.appendChild(toolbar);
  }
  if (!document.getElementById("inlineCommentPopover")) {
    var popover = document.createElement("div");
    popover.className = "inline-comment-popover";
    popover.id = "inlineCommentPopover";
    popover.innerHTML =
      '<button type="button" class="popover-close" id="btnCloseInlinePopover" aria-label="Fechar sem salvar">\u00D7</button>' +
      '<div class="popover-quote" id="popoverQuote"></div>' +
      '<textarea id="inlineCommentText" placeholder="Digite seu coment\u00e1rio sobre o trecho..." rows="3"></textarea>' +
      '<button type="button" class="btn-save-inline" id="btnSaveInlineComment">Salvar coment\u00e1rio</button>';
    document.body.appendChild(popover);
  }
  if (!document.getElementById("inlineCommentViewer")) {
    var viewer = document.createElement("div");
    viewer.className = "inline-comment-viewer";
    viewer.id = "inlineCommentViewer";
    viewer.setAttribute("aria-hidden", "true");
    viewer.innerHTML =
      '<button type="button" class="viewer-close" id="btnCloseInlineViewer" aria-label="Fechar coment\u00e1rio">\u00D7</button>' +
      '<div class="viewer-quote" id="viewerQuote"></div>' +
      '<div class="viewer-text" id="viewerText"></div>' +
      '<div class="viewer-actions">' +
      '<button type="button" id="btnEditInlineComment">Editar</button>' +
      '<button type="button" class="btn-delete-inline" id="btnDeleteInlineComment">Apagar</button>' +
      "</div>";
    document.body.appendChild(viewer);
  }
}

window.initApprovalAndComments = function () {
  syncCfgConstants();
  loadStateAsync(function () {
    runInitApprovalAndComments();
  });
};

function runInitApprovalAndComments() {
  syncCfgConstants();
  ensureInlineReviewUiShell();
  injectMagaluApiCommentHeaders(getContent());
  Object.keys(comments).forEach(function (sectionId) {
    applyStoredCommentToSectionUI(sectionId);
  });
  if (getCfg().readOnly) {
    document
      .querySelectorAll(
        ".btn-comment, .btn-save-comment, .btn-edit-comment, .btn-delete-comment, #btnCommentSelection, #btnSaveInlineComment"
      )
      .forEach(function (el) {
        el.setAttribute("disabled", "disabled");
      });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".btn-comment");
    if (btn) {
      var sectionId = btn.getAttribute("data-section");
      var block = getCommentBlock(sectionId);
      var textarea = getTextarea(sectionId);
      if (!block || !textarea) return;
      var isOpening = !block.classList.contains("open");
      block.classList.toggle("open");
      if (isOpening && comments[sectionId] && comments[sectionId].text) textarea.value = comments[sectionId].text;
      return;
    }
    var saveBtn = e.target.closest(".btn-save-comment");
    if (saveBtn) {
      var sectionId = saveBtn.getAttribute("data-section");
      var title = (getCommentBtn(sectionId) && getCommentBtn(sectionId).getAttribute("data-title")) || sectionId;
      var textarea = getTextarea(sectionId);
      var block = getCommentBlock(sectionId);
      var savedCard = getSavedCard(sectionId);
      if (!textarea || !block) return;
      var text = (textarea.value || "").trim();
      comments[sectionId] = text ? { title: title, text: text } : null;
      block.classList.remove("open");
      var bc = getCommentBtn(sectionId);
      if (bc) bc.classList.toggle("has-comment", !!text);
      if (savedCard) {
        var textEl = savedCard.querySelector(".comment-saved-text");
        if (textEl) {
          textEl.textContent = text || "";
          savedCard.classList.toggle("show", !!text);
          if (!text) savedCard.classList.remove("expanded");
        }
        var ind = document.getElementById("comment-indicator-" + sectionId);
        if (ind) ind.classList.toggle("show", !!text);
      }
      updateBtnApproveState();
      persistSectionComment(sectionId, title, text);
      return;
    }
    var header = e.target.closest(".comment-saved-card-header");
    if (header) {
      var card = header.closest(".comment-saved-card");
      if (card) card.classList.toggle("expanded");
      return;
    }
    var ind = e.target.closest(".section-comment-indicator");
    if (ind && ind.classList.contains("show")) {
      var sectionId = ind.getAttribute("data-section");
      var card = getSavedCard(sectionId);
      if (card && card.classList.contains("show")) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        card.classList.add("expanded");
      }
      return;
    }
    var delBtn = e.target.closest(".btn-delete-comment");
    if (delBtn) {
      var sectionId = delBtn.getAttribute("data-section");
      comments[sectionId] = null;
      var card = getSavedCard(sectionId);
      var ind = document.getElementById("comment-indicator-" + sectionId);
      var textarea = getTextarea(sectionId);
      var bc = getCommentBtn(sectionId);
      if (textarea) textarea.value = "";
      if (card) {
        card.classList.remove("show");
        card.classList.remove("expanded");
      }
      if (ind) ind.classList.remove("show");
      if (bc) bc.classList.remove("has-comment");
      updateBtnApproveState();
      persistSectionComment(sectionId, "", "");
      return;
    }
    var closeBtn = e.target.closest(".btn-close-comment");
    if (closeBtn) {
      var block = closeBtn.closest(".comment-block");
      if (block) block.classList.remove("open");
      return;
    }
    var editBtn = e.target.closest(".btn-edit-comment");
    if (editBtn) {
      var sectionId = editBtn.getAttribute("data-section");
      var block = getCommentBlock(sectionId);
      var textarea = getTextarea(sectionId);
      if (!block || !textarea) return;
      if (comments[sectionId] && comments[sectionId].text) textarea.value = comments[sectionId].text;
      block.classList.add("open");
      textarea.focus();
      return;
    }
  });

  var selectionToolbar = document.getElementById("selectionToolbar");
  var inlineCommentPopover = document.getElementById("inlineCommentPopover");
  var popoverQuote = document.getElementById("popoverQuote");
  var inlineCommentText = document.getElementById("inlineCommentText");
  var inlineCommentViewer = document.getElementById("inlineCommentViewer");
  var viewerQuote = document.getElementById("viewerQuote");
  var viewerText = document.getElementById("viewerText");
  var btnCommentSelection = document.getElementById("btnCommentSelection");
  var btnSaveInlineComment = document.getElementById("btnSaveInlineComment");
  var btnCloseInlinePopover = document.getElementById("btnCloseInlinePopover");
  var btnCloseInlineViewer = document.getElementById("btnCloseInlineViewer");
  var btnEditInlineComment = document.getElementById("btnEditInlineComment");
  var btnDeleteInlineComment = document.getElementById("btnDeleteInlineComment");

  if (isEmbeddedGuest()) {
    hideEmbeddedGuestChrome();
    window.addEventListener("message", function onEmbeddedParentMessage(event) {
      var data = event.data;
      if (!data || !data.type) return;
      if (data.type === "operoz-prd-refresh-comments") {
        loadStateAsync(function () {
          rehydrateInlineCommentMarkers();
          updateBtnApproveState();
        });
      }
      if (data.type === "operoz-prd-scroll-to-inline" && data.payload && data.payload.id) {
        scrollToInlineCommentTarget(data.payload.id);
      }
    });
  }

  if (
    !isEmbeddedGuest() &&
    (!selectionToolbar ||
      !inlineCommentPopover ||
      !btnCommentSelection ||
      !btnSaveInlineComment ||
      !btnCloseInlinePopover)
  ) {
    return;
  }

  function hideSelectionToolbar() {
    if (!selectionToolbar) return;
    selectionToolbar.classList.remove("show");
    window.getSelection().removeAllRanges();
  }

  document.addEventListener("mouseup", function (e) {
    publishSelectionFromEvent(e);
  });

  if (isEmbeddedGuest()) {
    var selectionPublishTimer = null;
    document.addEventListener("selectionchange", function () {
      clearTimeout(selectionPublishTimer);
      selectionPublishTimer = setTimeout(function () {
        publishSelectionFromEvent(null);
      }, 150);
    });
  }

  function publishSelectionFromEvent(e) {
    var sel = window.getSelection();
    var text = (sel.toString() || "").trim();
    if (!text) {
      if (isEmbeddedGuest()) postToParent("operoz-prd-selection-clear", {});
      if (!isEmbeddedGuest() && selectionToolbar) selectionToolbar.classList.remove("show");
      return;
    }
    if (getCfg().readOnly && !isEmbeddedGuest()) return;
    var range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range) return;
    var node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    var section = resolveSectionFromNode(node);
    if (!section || !section.id) {
      if (!isEmbeddedGuest() && selectionToolbar) selectionToolbar.classList.remove("show");
      return;
    }
    var sectionId = section.id;
    var sectionTitle = getSectionTitle(sectionId);
    var rect = range.getBoundingClientRect();
    pendingSelection = { sectionId: sectionId, sectionTitle: sectionTitle, quote: text };
    if (isEmbeddedGuest()) {
      postToParent("operoz-prd-selection", {
        sectionId: sectionId,
        sectionTitle: sectionTitle,
        quote: text,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        clientX: e ? e.clientX : rect.left + rect.width / 2,
        clientY: e ? e.clientY : rect.top,
      });
      return;
    }
    selectionToolbar.style.top = rect.top - 44 + "px";
    selectionToolbar.style.left = rect.left + "px";
    selectionToolbar.classList.add("show");
  }

  if (!isEmbeddedGuest()) {
    document.addEventListener("mousedown", function (e) {
      if (!selectionToolbar || !inlineCommentPopover) return;
      if (!selectionToolbar.contains(e.target) && !inlineCommentPopover.contains(e.target)) hideSelectionToolbar();
    });
  }

  function openViewer(badge) {
    if (!badge) return;
    currentInlineBadge = badge;
    viewerQuote.textContent = '"' + (badge.getAttribute("data-comment-quote") || "") + '"';
    viewerText.textContent = badge.getAttribute("data-comment-text") || "";
    var rect = badge.getBoundingClientRect();
    inlineCommentViewer.style.top = Math.max(8, rect.bottom + 8) + "px";
    inlineCommentViewer.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 340)) + "px";
    inlineCommentViewer.classList.add("show");
    inlineCommentViewer.setAttribute("aria-hidden", "false");
  }
  function closeViewer() {
    inlineCommentViewer.classList.remove("show");
    inlineCommentViewer.setAttribute("aria-hidden", "true");
  }

  var contentRoot = getContent();
  if (contentRoot && !contentRoot.dataset.prdInlineBadgeDelegation) {
    contentRoot.dataset.prdInlineBadgeDelegation = "1";
    contentRoot.addEventListener("click", function (ev) {
      var badge = ev.target.closest && ev.target.closest(".inline-comment-badge");
      if (!badge || !contentRoot.contains(badge)) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (isEmbeddedGuest()) {
        postToParent("operoz-prd-inline-badge-click", {
          id: badge.getAttribute("data-inline-id") || "",
          quote: badge.getAttribute("data-comment-quote") || "",
          text: badge.getAttribute("data-comment-text") || "",
        });
        return;
      }
      openViewer(badge);
    });
  }

  if (!isEmbeddedGuest() && btnCloseInlinePopover) {
    btnCloseInlinePopover.addEventListener("click", function () {
      if (pendingSelection && pendingSelection.markerSpan && pendingSelection.markerSpan.parentNode) {
        var span = pendingSelection.markerSpan;
        var parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      }
      inlineCommentPopover.classList.remove("show");
      hideSelectionToolbar();
      pendingSelection = null;
    });
    if (btnCloseInlineViewer) btnCloseInlineViewer.addEventListener("click", closeViewer);

    btnCommentSelection.addEventListener("click", function () {
      if (!pendingSelection) return;
      var sel = window.getSelection();
      var range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (range && !range.collapsed) {
        pendingSelection.markerSpan = wrapSelectionAsMarkerSpan(range);
      }
      popoverQuote.textContent =
        '"' +
        (pendingSelection.quote.length > 80 ? pendingSelection.quote.slice(0, 77) + "..." : pendingSelection.quote) +
        '"';
      inlineCommentText.value = "";
      inlineCommentPopover.classList.add("show");
      var rect = selectionToolbar.getBoundingClientRect();
      inlineCommentPopover.style.top = rect.top - 8 + "px";
      inlineCommentPopover.style.left = rect.left + "px";
      inlineCommentText.focus();
    });

    btnSaveInlineComment.addEventListener("click", function () {
      var text = (inlineCommentText.value || "").trim();
      if (!text || !pendingSelection) return;
      if (pendingSelection.markerSpan) {
        var inlineId = "ic-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
        pendingSelection.markerSpan.title = "Comentário: " + text;
        pendingSelection.markerSpan.setAttribute("data-comment-text", text);
        pendingSelection.markerSpan.setAttribute("data-inline-id", inlineId);
        var badge = document.createElement("button");
        badge.type = "button";
        badge.className = "inline-comment-badge";
        badge.setAttribute("aria-label", "Abrir comentário do trecho");
        badge.setAttribute("data-comment-text", text);
        badge.setAttribute("data-comment-quote", pendingSelection.quote);
        badge.setAttribute("data-inline-id", inlineId);
        badge.textContent = "\uD83D\uDCAC";
        pendingSelection.markerSpan.appendChild(badge);
      }
      var entry = {
        id:
          (pendingSelection.markerSpan && pendingSelection.markerSpan.getAttribute("data-inline-id")) ||
          "ic-" + Date.now(),
        sectionId: pendingSelection.sectionId,
        sectionTitle: pendingSelection.sectionTitle,
        quote: pendingSelection.quote,
        text: text,
      };
      inlineComments.push(entry);
      inlineCommentPopover.classList.remove("show");
      hideSelectionToolbar();
      pendingSelection = null;
      bindInlineBadges();
      renderInlineComments();
      updateBtnApproveState();
      persistInlineComment(entry).then(function () {
        rehydrateInlineCommentMarkers();
        renderInlineComments();
      });
    });
  }

  function findBadgeByInlineId(contentEl, id) {
    if (!contentEl || !id) return null;
    var badges = contentEl.querySelectorAll(".inline-comment-badge[data-inline-id]");
    for (var i = 0; i < badges.length; i++) {
      if (badges[i].getAttribute("data-inline-id") === id) return badges[i];
    }
    return null;
  }

  function findMarkerByInlineId(contentEl, id) {
    if (!contentEl || !id) return null;
    var safe = String(id).replace(/"/g, "");
    var byAttr = contentEl.querySelector('.inline-comment-marker[data-inline-id="' + safe + '"]');
    if (byAttr) return byAttr;
    var badge = findBadgeByInlineId(contentEl, id);
    return badge ? badge.closest(".inline-comment-marker") : null;
  }

  function unifyTypographicChars(s) {
    return String(s || "")
      .replace(/\u00A0/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  }

  function normQuoteForLocate(s) {
    return unifyTypographicChars(s).replace(/\s+/g, " ").trim();
  }

  function skipNodeForQuoteLocate(el) {
    if (!el || !el.closest) return true;
    return !!(
      el.closest(".inline-comments-wrap") ||
      el.closest(".section-header") ||
      el.closest(".comment-block") ||
      el.closest(".comment-saved-card") ||
      el.closest(".selection-toolbar") ||
      el.closest(".inline-comment-popover") ||
      el.closest(".inline-comment-viewer")
    );
  }

  function buildNeedleCandidates(quoteRaw) {
    var q = normQuoteForLocate(quoteRaw);
    q = q.replace(/(\u2026|\.{2,})\s*$/g, "").trim();
    q = q
      .replace(/\([^)]*$/g, "")
      .replace(/\[[^\]]*$/g, "")
      .trim();
    var list = [];
    function add(s) {
      s = String(s || "").trim();
      if (s.length < 10) return;
      if (list.indexOf(s) === -1) list.push(s);
    }
    add(q);
    if (q.length > 140) add(q.slice(0, 140));
    if (q.length > 100) add(q.slice(0, 100));
    if (q.length > 70) add(q.slice(0, 70));
    if (q.length > 45) add(q.slice(0, 45));
    if (q.length > 30) add(q.slice(0, 30));
    return list;
  }

  /** Blocos na ordem do documento cujo textContent (junto) contém a agulha — cobre &lt;strong&gt; etc. */
  function collectMatchingBlocks(sectionEl, needle) {
    if (!sectionEl || !needle || needle.length < 10) return [];
    var blocks = [];
    var seen = [];
    var candidates = sectionEl.querySelectorAll("p, li, td, th, h1, h2, h3, h4, h5, h6, blockquote, dd");
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (skipNodeForQuoteLocate(el)) continue;
      var t = normQuoteForLocate(el.textContent);
      if (t.indexOf(needle) === -1) continue;
      if (seen.indexOf(el) === -1) {
        seen.push(el);
        blocks.push(el);
      }
    }
    return blocks;
  }

  /**
   * matchIndex = quantos comentários em trecho nesta seção vêm antes deste na lista (ordem do array).
   * Assim o 2º / 3º item da mesma lista (vários &lt;li&gt;) não ficam presos no primeiro match.
   */
  function findBlockElementContainingQuote(sectionEl, quoteRaw, matchIndex) {
    matchIndex = typeof matchIndex === "number" && matchIndex >= 0 ? matchIndex : 0;
    if (!sectionEl || !quoteRaw) return null;
    var needles = buildNeedleCandidates(quoteRaw);
    for (var n = 0; n < needles.length; n++) {
      var blocks = collectMatchingBlocks(sectionEl, needles[n]);
      if (blocks.length === 0) continue;
      var idx = Math.min(matchIndex, blocks.length - 1);
      return blocks[idx];
    }
    return null;
  }

  function inlineCommentIndexInSection(entry) {
    if (!entry || !entry.sectionId) return 0;
    var k = 0;
    for (var i = 0; i < inlineComments.length; i++) {
      if (inlineComments[i].id === entry.id) break;
      if (inlineComments[i].sectionId === entry.sectionId) k++;
    }
    return k;
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Localiza trecho no texto de um nó (indexOf exato ou palavras com espaços flexíveis). Offsets válidos no string `raw` original. */
  function findLooseSpanInText(raw, needle) {
    if (!raw || !needle) return null;
    var rawU = unifyTypographicChars(raw);
    var trimmed = unifyTypographicChars(String(needle).trim());
    if (trimmed.length < 10) return null;
    var direct = rawU.indexOf(trimmed);
    if (direct !== -1) return { start: direct, end: direct + trimmed.length };
    var norm = normQuoteForLocate(trimmed);
    var parts = norm.split(/\s+/).filter(function (p) {
      return p.length > 0;
    });
    if (parts.length < 2) return null;
    function tryRe(partsSlice) {
      if (partsSlice.length < 2) return null;
      var reStr = partsSlice.map(escapeRegExp).join("\\s+");
      var re;
      try {
        re = new RegExp(reStr);
      } catch (e) {
        return null;
      }
      var m = rawU.match(re);
      if (m && m.index !== undefined) return { start: m.index, end: m.index + m[0].length };
      return null;
    }
    var r = tryRe(parts);
    if (r) return r;
    if (parts.length > 12) {
      r = tryRe(parts.slice(0, 10));
      if (r) return r;
    }
    if (parts.length > 6) {
      r = tryRe(parts.slice(0, 6));
      if (r) return r;
    }
    return tryRe(parts.slice(0, 3));
  }

  /** Nós de texto do bloco na ordem do documento (ignora trechos já marcados). */
  function getBlockTextNodesForWrap(block) {
    var out = [];
    if (!block) return out;
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || p.closest(".inline-comment-marker")) return NodeFilter.FILTER_REJECT;
        if (skipNodeForQuoteLocate(p)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  function mapOffsetsToRangeInNodes(nodes, startOffset, endOffset) {
    if (!nodes.length || startOffset < 0 || endOffset < startOffset) return null;
    var acc = 0;
    var startNode = null;
    var startOff = 0;
    var endNode = null;
    var endOff = 0;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var len = node.textContent.length;
      var nodeStart = acc;
      var nodeEnd = acc + len;
      if (startNode === null && startOffset < nodeEnd) {
        startNode = node;
        startOff = startOffset - nodeStart;
      }
      if (startNode !== null) {
        if (endOffset <= nodeEnd) {
          endNode = node;
          endOff = endOffset - nodeStart;
          break;
        }
      }
      acc += len;
    }
    if (!startNode || !endNode) return null;
    if (startOff < 0 || endOff < 0 || startOff > startNode.textContent.length || endOff > endNode.textContent.length)
      return null;
    try {
      var range = document.createRange();
      range.setStart(startNode, startOff);
      range.setEnd(endNode, endOff);
      return range;
    } catch (err) {
      return null;
    }
  }

  /** Intervalo no DOM cobrindo o trecho (vários nós de texto, ex.: &lt;strong&gt; + texto no &lt;li&gt;). */
  function buildRangeForQuoteInBlock(block, quoteRaw) {
    if (!block || !quoteRaw) return null;
    var nodes = getBlockTextNodesForWrap(block);
    if (!nodes.length) return null;
    var full = nodes
      .map(function (n) {
        return n.textContent;
      })
      .join("");
    var needles = buildNeedleCandidates(quoteRaw);
    for (var ni = 0; ni < needles.length; ni++) {
      var spanPos = findLooseSpanInText(full, needles[ni]);
      if (!spanPos) continue;
      var r = mapOffsetsToRangeInNodes(nodes, spanPos.start, spanPos.end);
      if (r && !r.collapsed) return r;
    }
    return null;
  }

  /** Envolve a seleção com o marcador; se cruzar tags (ex.: &lt;/strong&gt;), usa extractContents. */
  function wrapSelectionAsMarkerSpan(range) {
    if (!range || range.collapsed) return null;
    var markerSpan = document.createElement("span");
    markerSpan.className = "inline-comment-marker";
    try {
      range.surroundContents(markerSpan);
      return markerSpan;
    } catch (err) {
      try {
        var frag = range.extractContents();
        markerSpan.appendChild(frag);
        range.insertNode(markerSpan);
        return markerSpan;
      } catch (err2) {
        return null;
      }
    }
  }

  function insertInlineMarkerFromRange(range, entry) {
    if (!range || range.collapsed || !entry || !entry.id) return false;
    var mark = document.createElement("span");
    mark.className = "inline-comment-marker";
    mark.setAttribute("data-inline-id", entry.id);
    mark.setAttribute("data-comment-quote", entry.quote || "");
    mark.setAttribute("data-comment-text", entry.text || "");
    mark.title = "Comentário: " + (entry.text || "");
    try {
      range.surroundContents(mark);
    } catch (e) {
      try {
        var frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      } catch (e2) {
        return false;
      }
    }
    var badge = document.createElement("button");
    badge.type = "button";
    badge.className = "inline-comment-badge";
    badge.setAttribute("aria-label", "Abrir comentário do trecho");
    badge.setAttribute("data-comment-text", entry.text || "");
    badge.setAttribute("data-comment-quote", entry.quote || "");
    badge.setAttribute("data-inline-id", entry.id);
    badge.textContent = "\uD83D\uDCAC";
    mark.appendChild(badge);
    return true;
  }

  /**
   * Recria no DOM o marcador amarelo + badge quando o comentário existe em inlineComments
   * mas o HTML carregado não tem mais o span (ex.: estado antigo, ou body rerenderizado).
   */
  function tryRehydrateMarkerForEntry(entry) {
    var contentEl = getContent();
    if (!entry || !entry.id || !entry.sectionId || !entry.quote) return false;
    if (findMarkerByInlineId(contentEl, entry.id)) return false;
    var sec = document.getElementById(entry.sectionId);
    if (!sec) return false;
    var block = findBlockElementContainingQuote(sec, entry.quote, inlineCommentIndexInSection(entry));
    if (!block) return false;
    var range = buildRangeForQuoteInBlock(block, entry.quote);
    if (!range) return false;
    return insertInlineMarkerFromRange(range, entry);
  }

  function rehydrateInlineCommentMarkers() {
    var contentEl = getContent();
    if (!contentEl || !inlineComments.length) return;
    var changed = false;
    inlineComments.forEach(function (entry) {
      if (tryRehydrateMarkerForEntry(entry)) changed = true;
    });
    if (changed) saveState();
  }

  function scrollToInlineCommentTarget(id) {
    var contentEl = getContent();
    var entry = inlineComments.filter(function (c) {
      return c.id === id;
    })[0];
    var marker = findMarkerByInlineId(contentEl, id);
    var targetEl = marker;
    var useBlockFlash = false;
    if (!targetEl && entry && entry.sectionId && entry.quote) {
      var sec = document.getElementById(entry.sectionId);
      if (sec) {
        var idx = inlineCommentIndexInSection(entry);
        targetEl = findBlockElementContainingQuote(sec, entry.quote, idx);
        useBlockFlash = !!targetEl;
      }
    }
    if (!targetEl) {
      window.alert(
        "Trecho não encontrado no texto. O texto da seção pode ter mudado no arquivo ou o trecho foi editado."
      );
      return;
    }
    closeViewer();
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    var flashClass = useBlockFlash ? "inline-comment-quote-locate-flash" : "inline-comment-target-flash";
    targetEl.classList.remove("inline-comment-target-flash", "inline-comment-quote-locate-flash");
    void targetEl.offsetWidth;
    targetEl.classList.add(flashClass);
    window.setTimeout(function () {
      targetEl.classList.remove("inline-comment-target-flash", "inline-comment-quote-locate-flash");
    }, 2300);
  }

  function updateInlineCommentTextById(id, newText) {
    if (!id) return;
    newText = (newText || "").trim();
    if (!newText) return;
    var contentEl = getContent();
    var badge = findBadgeByInlineId(contentEl, id);
    if (badge) {
      badge.setAttribute("data-comment-text", newText);
      var marker = badge.closest(".inline-comment-marker");
      if (marker) {
        marker.setAttribute("data-comment-text", newText);
        marker.title = "Comentário: " + newText;
      }
    }
    inlineComments = inlineComments.map(function (c) {
      return c.id === id ? Object.assign({}, c, { text: newText }) : c;
    });
    if (currentInlineBadge && currentInlineBadge.getAttribute("data-inline-id") === id) {
      viewerText.textContent = newText;
    }
    renderInlineComments();
    var entry = inlineComments.filter(function (c) {
      return c.id === id;
    })[0];
    if (entry) persistInlineComment(entry);
  }

  function deleteInlineCommentById(id) {
    if (!id) return;
    if (!window.confirm("Apagar este comentário do trecho?")) return;
    var contentEl = getContent();
    var badge = findBadgeByInlineId(contentEl, id);
    var marker = badge ? badge.closest(".inline-comment-marker") : null;
    inlineComments = inlineComments.filter(function (c) {
      return c.id !== id;
    });
    if (marker && marker.parentNode) {
      var parent = marker.parentNode;
      while (marker.firstChild) {
        var child = marker.firstChild;
        if (child.classList && child.classList.contains("inline-comment-badge")) marker.removeChild(child);
        else parent.insertBefore(child, marker);
      }
      parent.removeChild(marker);
    }
    if (currentInlineBadge && currentInlineBadge.getAttribute("data-inline-id") === id) {
      closeViewer();
      currentInlineBadge = null;
    }
    renderInlineComments();
    updateBtnApproveState();
    persistInlineDelete(id);
  }

  function ensureInlineCommentsWrap(sectionId) {
    if (!sectionId) return null;
    if (document.getElementById("inline-comments-" + sectionId))
      return document.getElementById("inline-comments-" + sectionId);
    var section = document.getElementById(sectionId);
    if (!section) return null;
    if (!section.classList.contains("doc-section") && !section.classList.contains("pendencias-section")) return null;
    var body = section.querySelector(".section-body");
    var mount = body || section;
    var wrap = document.createElement("div");
    wrap.className = "inline-comments-wrap";
    wrap.id = "inline-comments-" + sectionId;
    wrap.setAttribute("data-section", sectionId);
    mount.appendChild(wrap);
    return wrap;
  }

  function renderInlineComments() {
    if (isEmbeddedGuest()) return;
    var content = getContent();
    if (!content) return;
    var seenSid = {};
    inlineComments.forEach(function (c) {
      if (!c || !c.sectionId || seenSid[c.sectionId]) return;
      seenSid[c.sectionId] = true;
      ensureInlineCommentsWrap(c.sectionId);
    });
    content.querySelectorAll('[id^="inline-comments-"]').forEach(function (wrap) {
      var sectionId = wrap.id.replace("inline-comments-", "");
      var items = inlineComments.filter(function (c) {
        return c.sectionId === sectionId;
      });
      wrap.innerHTML = "";
      if (items.length === 0) {
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "block";
      var title = document.createElement("div");
      title.className = "inline-comments-title";
      title.textContent = "Comentários em trechos (" + items.length + ")";
      wrap.appendChild(title);
      items.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "inline-comment-item";
        div.setAttribute("data-inline-id", item.id);
        var qShort = item.quote.length > 100 ? item.quote.slice(0, 97) + "..." : item.quote;
        div.innerHTML =
          '<div class="quote">' +
          escapeHtml('"' + qShort + '"') +
          '</div><div class="text">' +
          escapeHtml(item.text) +
          "</div>";
        var btnLocate = document.createElement("button");
        btnLocate.type = "button";
        btnLocate.className = "btn-inline-snippet-locate";
        btnLocate.setAttribute("aria-label", "Ir ao trecho no documento");
        btnLocate.setAttribute("title", "Ir ao trecho no documento");
        btnLocate.textContent = "\uD83D\uDC41\uFE0F";
        btnLocate.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          scrollToInlineCommentTarget(item.id);
        });
        div.appendChild(btnLocate);
        var actions = document.createElement("div");
        actions.className = "inline-comment-item-actions";
        var btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.className = "btn-inline-snippet-edit";
        btnEdit.textContent = "Editar";
        btnEdit.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var cur = inlineComments.filter(function (c) {
            return c.id === item.id;
          })[0];
          var prev = cur ? cur.text : "";
          var next = window.prompt("Editar comentário do trecho:", prev);
          if (next === null) return;
          next = next.trim();
          if (!next) return;
          updateInlineCommentTextById(item.id, next);
        });
        var btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "btn-inline-snippet-delete";
        btnDel.textContent = "Apagar";
        btnDel.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          deleteInlineCommentById(item.id);
        });
        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);
        div.appendChild(actions);
        wrap.appendChild(div);
      });
    });
  }

  function buildSummaryText(approved) {
    var statusLine = approved ? "Status: PROJETO APROVADO" : "Status: SOLICITAÇÃO DE AJUSTES";
    var lines = ["Feedback – " + DOC_TITLE, "", statusLine, "Data: " + new Date().toLocaleString("pt-BR"), ""];
    Object.keys(comments)
      .sort()
      .forEach(function (sectionId) {
        var c = comments[sectionId];
        if (c && c.text) {
          lines.push("--- Comentário da seção: " + c.title + " ---");
          lines.push(c.text);
          lines.push("");
        }
      });
    if (inlineComments.length > 0) {
      lines.push("--- Comentários em trechos ---");
      inlineComments.forEach(function (ic) {
        lines.push("Seção: " + ic.sectionTitle);
        lines.push('Trecho: "' + ic.quote + '"');
        lines.push("Comentário: " + ic.text);
        lines.push("");
      });
    }
    if (lines.length === 5) lines.push("(Nenhum comentário.)");
    return lines.join("\n");
  }

  function showSummary(approved) {
    window._printSummaryContext = approved ? "approve" : "feedback";
    var summaryText = buildSummaryText(approved);
    var subject = approved ? "Aprovação: " + DOC_TITLE : "Ajustes solicitados: " + DOC_TITLE;
    var summaryTitleEl = document.getElementById("summaryTitle");
    if (summaryTitleEl) summaryTitleEl.textContent = approved ? "Aprovação do projeto" : "Resumo do seu feedback";
    document.getElementById("summaryStatus").textContent = approved
      ? "✓ Projeto aprovado"
      : "✏️ Solicitação de ajustes";
    document.getElementById("summaryStatus").className = "summary-status " + (approved ? "approved" : "adjust");
    var list = document.getElementById("summaryCommentsList");
    list.innerHTML = "";
    var hasAny = false;
    Object.keys(comments)
      .sort()
      .forEach(function (sectionId) {
        var c = comments[sectionId];
        if (c && c.text) {
          hasAny = true;
          var li = document.createElement("li");
          li.innerHTML =
            '<span class="sec-name">Seção: ' +
            escapeHtml(c.title) +
            '</span><div class="sec-text">' +
            escapeHtml(c.text) +
            "</div>";
          list.appendChild(li);
        }
      });
    inlineComments.forEach(function (ic) {
      hasAny = true;
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="sec-name">Trecho em ' +
        escapeHtml(ic.sectionTitle) +
        '</span><div class="sec-text" style="font-style:italic;margin-bottom:0.25rem;">"' +
        escapeHtml(ic.quote.length > 60 ? ic.quote.slice(0, 57) + "..." : ic.quote) +
        '"</div><div class="sec-text">' +
        escapeHtml(ic.text) +
        "</div>";
      list.appendChild(li);
    });
    if (!hasAny) {
      var li = document.createElement("li");
      li.textContent = "Nenhum comentário.";
      li.style.color = "var(--t4h-gray-400)";
      list.appendChild(li);
    }
    var printHint = document.getElementById("summaryPrintHint");
    if (printHint) {
      printHint.textContent = approved
        ? "Imprima o PRD (só escolha o modo de cor) ou copie o texto de confirmação abaixo."
        : "Imprima o PRD escolhendo se os comentários entram na página ou copie o texto do resumo.";
    }
    document.getElementById("summaryOverlay").classList.add("show");
    document.getElementById("summaryOverlay").setAttribute("aria-hidden", "false");
    window._lastSummaryText = summaryText;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
  function hasAnyComment() {
    var hasSection = Object.keys(comments).some(function (sectionId) {
      var c = comments[sectionId];
      return c && c.text && c.text.trim();
    });
    return hasSection || inlineComments.length > 0;
  }
  function updateBtnApproveState() {
    if (isEmbeddedGuest()) return;
    var hasComment = hasAnyComment();
    var btnApprove = document.getElementById("btnApprove");
    var btnAdjust = document.getElementById("btnAdjust");
    var btnAdjustFloat = document.getElementById("btnAdjustFloat");
    if (!btnApprove) return;
    btnApprove.disabled = hasComment;
    btnApprove.title = hasComment ? 'Com comentários, use "Enviar feedback".' : "Aprovar projeto sem ajustes.";
    if (btnAdjust) {
      btnAdjust.disabled = !hasComment;
      btnAdjust.title = hasComment ? "Abrir resumo." : "Adicione comentários para enviar feedback.";
    }
    if (btnAdjustFloat) {
      btnAdjustFloat.disabled = !hasComment;
      btnAdjustFloat.title = hasComment ? "Abrir resumo." : "Adicione comentários para enviar feedback.";
    }
  }

  if (!isEmbeddedGuest()) {
    var btnApproveEl = document.getElementById("btnApprove");
    if (btnApproveEl) {
      btnApproveEl.addEventListener("click", function () {
        if (hasAnyComment()) return;
        showSummary(true);
      });
    }
    var btnAdjustEl = document.getElementById("btnAdjust");
    if (btnAdjustEl)
      btnAdjustEl.addEventListener("click", function () {
        showSummary(false);
      });
    var btnAdjustFloatEl = document.getElementById("btnAdjustFloat");
    if (btnAdjustFloatEl)
      btnAdjustFloatEl.addEventListener("click", function () {
        showSummary(false);
      });
    var btnPrintEl = document.getElementById("btnPrintWithComments");
    if (btnPrintEl) {
      btnPrintEl.addEventListener("click", function () {
        if (window.openPrintOptionsModal) window.openPrintOptionsModal();
      });
    }
    var btnCopySummary = document.getElementById("btnCopySummary");
    if (btnCopySummary) {
      btnCopySummary.addEventListener("click", function () {
        var text = window._lastSummaryText;
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            var btn = document.getElementById("btnCopySummary");
            var orig = btn.textContent;
            btn.textContent = "✓ Copiado!";
            setTimeout(function () {
              btn.textContent = orig;
            }, 2000);
          });
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          var btn = document.getElementById("btnCopySummary");
          var orig = btn.textContent;
          btn.textContent = "✓ Copiado!";
          setTimeout(function () {
            btn.textContent = orig;
          }, 2000);
        }
      });
    }
    var btnCloseSummary = document.getElementById("btnCloseSummary");
    if (btnCloseSummary) {
      btnCloseSummary.addEventListener("click", function () {
        document.getElementById("summaryOverlay").classList.remove("show");
        document.getElementById("summaryOverlay").setAttribute("aria-hidden", "true");
      });
    }
    var summaryOverlay = document.getElementById("summaryOverlay");
    if (summaryOverlay) {
      summaryOverlay.addEventListener("click", function (e) {
        if (e.target === this) {
          this.classList.remove("show");
          this.setAttribute("aria-hidden", "true");
        }
      });
    }
  }
  if (!isEmbeddedGuest()) {
    if (btnEditInlineComment) {
      btnEditInlineComment.addEventListener("click", function () {
        if (!currentInlineBadge) return;
        var id = currentInlineBadge.getAttribute("data-inline-id");
        var oldText = currentInlineBadge.getAttribute("data-comment-text") || "";
        var next = window.prompt("Editar comentário do trecho:", oldText);
        if (next === null) return;
        next = next.trim();
        if (!next) return;
        updateInlineCommentTextById(id, next);
      });
    }
    if (btnDeleteInlineComment) {
      btnDeleteInlineComment.addEventListener("click", function () {
        if (!currentInlineBadge) return;
        deleteInlineCommentById(currentInlineBadge.getAttribute("data-inline-id"));
      });
    }
    document.addEventListener("click", function (e) {
      if (
        inlineCommentViewer &&
        !inlineCommentViewer.contains(e.target) &&
        !(e.target.closest && e.target.closest(".inline-comment-badge"))
      )
        closeViewer();
    });
  }

  bindInlineBadges();
  rehydrateInlineCommentMarkers();
  renderInlineComments();
  updateBtnApproveState();
  if (isEmbeddedGuest()) hideEmbeddedGuestChrome();
}
