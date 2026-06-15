/**
 * Read and validate #operoz-prd-config JSON embedded in PRD HTML.
 */
(function (global) {
  var MANIFEST_ID = "operoz-prd-config";
  var REQUIRED_VERSION = 1;

  function readOperozPrdConfig() {
    var el = document.getElementById(MANIFEST_ID);
    if (!el) return null;
    try {
      var parsed = JSON.parse(el.textContent || "{}");
      if (!parsed || typeof parsed !== "object") return null;
      if (parsed.operoz_prd_version !== REQUIRED_VERSION) {
        console.warn("[operoz-prd-review] operoz_prd_version mismatch", parsed.operoz_prd_version);
      }
      return parsed;
    } catch (err) {
      console.error("[operoz-prd-review] invalid manifest JSON", err);
      return null;
    }
  }

  global.OperozPrdManifest = {
    MANIFEST_ID: MANIFEST_ID,
    read: readOperozPrdConfig,
  };
})(window);
