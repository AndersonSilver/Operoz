/**
 * Guest mode — persist comments via Operoz API (Fase 1 backend).
 */
(function (global) {
  function createApiStorageAdapter(options) {
    var apiBase = ((options && options.apiBase) || "").replace(/\/$/, "");
    var token = (options && options.guestToken) || "";

    function guestUrl(path) {
      return apiBase + "/api/guest/prd-review/" + encodeURIComponent(token) + path;
    }

    return {
      load: function () {
        if (!apiBase || !token) {
          return Promise.resolve({ comments: {}, inlineComments: [] });
        }
        return fetch(guestUrl("/"), { credentials: "omit" })
          .then(function (res) {
            if (!res.ok) throw new Error("guest load failed " + res.status);
            return res.json();
          })
          .then(function (data) {
            return {
              comments: data.section_comments || {},
              inlineComments: data.inline_comments || [],
            };
          })
          .catch(function () {
            return { comments: {}, inlineComments: [] };
          });
      },
      saveComment: function (payload) {
        if (!apiBase || !token) {
          return Promise.reject(new Error("[operoz-prd-review] guest token required"));
        }
        return fetch(guestUrl("/comments/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify(payload),
        }).then(function (res) {
          if (!res.ok) throw new Error("guest comment failed " + res.status);
          return res.json();
        });
      },
      deleteComment: function (payload) {
        if (!apiBase || !token) {
          return Promise.reject(new Error("[operoz-prd-review] guest token required"));
        }
        return fetch(guestUrl("/comments/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify({
            delete: true,
            comment_id: payload && payload.comment_id,
          }),
        }).then(function (res) {
          if (!res.ok) throw new Error("guest delete failed " + res.status);
          return res.json();
        });
      },
      syncFromResponse: function (data) {
        return {
          comments: (data && data.section_comments) || {},
          inlineComments: (data && data.inline_comments) || [],
        };
      },
      submit: function (action, summary) {
        if (!apiBase || !token) {
          return Promise.reject(new Error("[operoz-prd-review] guest token required"));
        }
        return fetch(guestUrl("/submit/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify({ action: action, summary: summary || "" }),
        }).then(function (res) {
          if (!res.ok) throw new Error("guest submit failed " + res.status);
          return res.json();
        });
      },
    };
  }

  global.OperozPrdStorageApi = { create: createApiStorageAdapter };
})(window);
