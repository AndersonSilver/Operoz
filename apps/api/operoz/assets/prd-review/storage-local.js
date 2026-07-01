/**
 * Preview mode — persist comments in localStorage (internal / standalone HTML).
 */
(function (global) {
  function createLocalStorageAdapter(storageKey) {
    var key = storageKey || "operoz-prd-review-comments";

    return {
      load: function () {
        try {
          var raw = localStorage.getItem(key);
          if (!raw) return { comments: {}, inlineComments: [] };
          var parsed = JSON.parse(raw);
          return {
            comments: parsed.comments && typeof parsed.comments === "object" ? parsed.comments : {},
            inlineComments: Array.isArray(parsed.inlineComments) ? parsed.inlineComments : [],
          };
        } catch (e) {
          return { comments: {}, inlineComments: [] };
        }
      },
      save: function (payload) {
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              comments: payload.comments || {},
              inlineComments: payload.inlineComments || [],
            })
          );
        } catch (e) {
          /* ignore quota / private mode */
        }
      },
    };
  }

  global.OperozPrdStorageLocal = { create: createLocalStorageAdapter };
})(window);
