/**
 * Browser-native HTML sanitizer for rendering untrusted/semi-trusted HTML.
 *
 * Strips dangerous elements (script, iframe, object, embed, form, style, link,
 * base, meta) and removes inline event-handler attributes (onclick, onerror, etc.)
 * plus javascript: URLs from href/src/action.
 *
 * This is NOT a full DOMPurify replacement but provides meaningful defence-in-depth
 * for server-generated HTML rendered via dangerouslySetInnerHTML.
 */

const DANGEROUS_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "style",
  "link",
  "base",
  "meta",
  "math",
  "svg",
  "template",
]);

const EVENT_HANDLER_RE = /^on[a-z]/i;
const DANGEROUS_URL_RE = /^\s*(javascript|data|vbscript)\s*:/i;
const URL_ATTRS = new Set(["href", "src", "action", "formaction", "xlink:href"]);

function sanitizeNode(node: Element): void {
  const tag = node.tagName.toLowerCase();

  if (DANGEROUS_TAGS.has(tag)) {
    node.remove();
    return;
  }

  const attrsToRemove: string[] = [];
  for (const attr of Array.from(node.attributes)) {
    if (EVENT_HANDLER_RE.test(attr.name)) {
      attrsToRemove.push(attr.name);
    } else if (URL_ATTRS.has(attr.name.toLowerCase()) && DANGEROUS_URL_RE.test(attr.value)) {
      attrsToRemove.push(attr.name);
    }
  }
  for (const name of attrsToRemove) {
    node.removeAttribute(name);
  }

  // Recurse into children (iterate a snapshot because the live list mutates on removal)
  for (const child of Array.from(node.children)) {
    sanitizeNode(child);
  }
}

/**
 * Sanitizes an HTML string by removing dangerous elements and attributes.
 * Returns the cleaned HTML string safe for `dangerouslySetInnerHTML`.
 *
 * Falls back to the raw string when DOMParser is unavailable (e.g. SSR);
 * in that scenario the caller should ensure content is trusted.
 */
export function sanitizeHtmlForRender(html: string): string {
  if (!html) return "";

  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const child of Array.from(doc.body.children)) {
    sanitizeNode(child);
  }
  return doc.body.innerHTML;
}
