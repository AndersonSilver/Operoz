/**
 * @operoz/prd-review — entry point for PRD client review UX.
 *
 * @param {object} config
 * @param {'preview'|'guest'} [config.mode='preview']
 * @param {string} [config.docTitle]
 * @param {string} [config.storageKey]
 * @param {string} [config.feedbackEmail]
 * @param {string} [config.contentId='content']
 * @param {string} [config.apiBase] — guest mode (Fase 2)
 * @param {string} [config.guestToken]
 * @param {string} [config.reviewSessionId]
 * @param {boolean} [config.embeddedGuest] — hide banner when hosted in Operoz guest page
 * @param {boolean} [config.readOnly] — disable comment edits (resolved session)
 * @param {boolean} [config.autoInit=true]
 */
(function (global) {
  function mergeManifest(config) {
    var base = config || {};
    if (global.OperozPrdManifest && typeof global.OperozPrdManifest.read === "function") {
      var manifest = global.OperozPrdManifest.read();
      if (manifest) {
        base = Object.assign({}, manifest, base);
        if (manifest.title && !base.docTitle) base.docTitle = manifest.title;
        if (manifest.client && !base.storageKey) {
          base.storageKey =
            "operoz-prd-" +
            String(manifest.client)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-") +
            "-comments-v1";
        }
      }
    }
    return base;
  }

  global.initPrdReview = function initPrdReview(userConfig) {
    var config = mergeManifest(userConfig || {});
    config.mode = config.mode || "preview";
    config.contentId = config.contentId || "content";
    if (!config.storageKey) {
      config.storageKey = "operoz-prd-review-comments";
    }

    global.__PRD_REVIEW_CONFIG__ = config;

    if (config.mode === "guest" && global.OperozPrdStorageApi) {
      global.__PRD_REVIEW_STORAGE__ = global.OperozPrdStorageApi.create(config);
    } else if (global.OperozPrdStorageLocal) {
      global.__PRD_REVIEW_STORAGE__ = global.OperozPrdStorageLocal.create(config.storageKey);
    }

    var autoInit = config.autoInit !== false;
    if (!autoInit) return;

    function tryInit() {
      if (typeof global.initApprovalAndComments !== "function") return false;
      var el = document.getElementById(config.contentId);
      if (!el || !el.innerHTML.trim()) return false;
      global.initApprovalAndComments();
      if (config.embeddedGuest) {
        applyEmbeddedGuestChrome();
      }
      return true;
    }

    function applyEmbeddedGuestChrome() {
      document.body.classList.add("operoz-embedded-guest");
      var styleId = "operoz-embedded-guest-styles";
      if (!document.getElementById(styleId)) {
        var style = document.createElement("style");
        style.id = styleId;
        style.textContent =
          ".operoz-embedded-guest #approvalBanner," +
          ".operoz-embedded-guest #btnAdjustFloat," +
          ".operoz-embedded-guest #summaryOverlay," +
          ".operoz-embedded-guest .selection-toolbar," +
          ".operoz-embedded-guest .inline-comment-popover," +
          ".operoz-embedded-guest .inline-comment-viewer," +
          ".operoz-embedded-guest .btn-comment," +
          ".operoz-embedded-guest .comment-block," +
          ".operoz-embedded-guest .comment-saved-card," +
          ".operoz-embedded-guest .section-comment-indicator," +
          ".operoz-embedded-guest .inline-comments-wrap { display: none !important; }";
        document.head.appendChild(style);
      }
    }

    if (tryInit()) return;

    document.addEventListener("DOMContentLoaded", function () {
      tryInit();
    });
  };
})(window);
