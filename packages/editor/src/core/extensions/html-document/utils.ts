import type { Editor } from "@tiptap/core";
// local imports
import { ECustomImageStatus } from "@/extensions/custom-image/types";
import { EHtmlDocumentAttributeNames } from "./types";
import type { THtmlDocumentAttributes, THtmlDocumentFrameLayout } from "./types";

export const DEFAULT_HTML_DOCUMENT_ATTRIBUTES: THtmlDocumentAttributes = {
  [EHtmlDocumentAttributeNames.ID]: null,
  [EHtmlDocumentAttributeNames.SOURCE]: null,
  [EHtmlDocumentAttributeNames.STATUS]: ECustomImageStatus.PENDING,
  [EHtmlDocumentAttributeNames.TITLE]: null,
  [EHtmlDocumentAttributeNames.FRAME_LAYOUT]: "standard",
  [EHtmlDocumentAttributeNames.CUSTOM_MIN_HEIGHT]: null,
};

const FRAME_LAYOUT_VALUES = new Set<string>(["standard", "tall", "fullBleed"]);

export const parseFrameLayoutAttr = (value: string | null | undefined): THtmlDocumentFrameLayout => {
  if (value && FRAME_LAYOUT_VALUES.has(value)) return value as THtmlDocumentFrameLayout;
  return "standard";
};

/** Permite apenas comprimentos CSS simples no iframe (evita injeção em style). */
export const isSafeCssMinHeight = (v: string): boolean =>
  /^\d+(\.\d+)?\s*(px|vh|vw|rem|em|%)$/i.test(v.trim());

export const getHtmlDocumentFileMap = (editor: Editor) => editor.storage.htmlDocumentEmbed?.fileMap;

export const getHtmlDocumentBlockId = (id: string) => `editor-html-document-${id}`;

export const isLikelyHtmlFile = (file: File): boolean =>
  file.type === "text/html" ||
  file.type === "application/xhtml+xml" ||
  /\.html?$/i.test(file.name);

/** Some browsers send empty MIME for .html — API requires text/html. */
export const normalizeHtmlUploadFile = (file: File): File => {
  if (file.type === "text/html" || file.type === "application/xhtml+xml") return file;
  if (/\.html?$/i.test(file.name)) {
    return new File([file], file.name, { type: "text/html", lastModified: file.lastModified });
  }
  return file;
};
