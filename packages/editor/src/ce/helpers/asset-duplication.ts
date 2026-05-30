import { v4 as uuidv4 } from "uuid";
import { ECustomImageAttributeNames, ECustomImageStatus } from "@/extensions/custom-image/types";
import { EHtmlDocumentAttributeNames } from "@/extensions/html-document/types";

export type AssetDuplicationContext = {
  element: Element;
  originalHtml: string;
};

export type AssetDuplicationResult = {
  modifiedHtml: string;
  shouldProcess: boolean;
};

export type AssetDuplicationHandler = (context: AssetDuplicationContext) => AssetDuplicationResult;

const imageComponentHandler: AssetDuplicationHandler = ({ element, originalHtml }) => {
  const src = element.getAttribute("src");

  if (!src || src.startsWith("http")) {
    return { modifiedHtml: originalHtml, shouldProcess: false };
  }

  // Capture the original HTML BEFORE making any modifications
  const originalTag = element.outerHTML;

  // Use setAttribute to update attributes
  const newId = uuidv4();
  element.setAttribute(ECustomImageAttributeNames.STATUS, ECustomImageStatus.DUPLICATING);
  element.setAttribute(ECustomImageAttributeNames.ID, newId);

  // Get the modified HTML AFTER the changes
  const modifiedTag = element.outerHTML;
  const modifiedHtml = originalHtml.replaceAll(originalTag, modifiedTag);

  return { modifiedHtml, shouldProcess: true };
};

const htmlDocumentEmbedHandler: AssetDuplicationHandler = ({ element, originalHtml }) => {
  const src = element.getAttribute("src");

  if (!src || src.startsWith("http")) {
    return { modifiedHtml: originalHtml, shouldProcess: false };
  }

  const originalTag = element.outerHTML;

  const newId = uuidv4();
  element.setAttribute(EHtmlDocumentAttributeNames.STATUS, ECustomImageStatus.DUPLICATING);
  element.setAttribute(EHtmlDocumentAttributeNames.ID, newId);

  const modifiedTag = element.outerHTML;
  const modifiedHtml = originalHtml.replaceAll(originalTag, modifiedTag);

  return { modifiedHtml, shouldProcess: true };
};

export const assetDuplicationHandlers: Record<string, AssetDuplicationHandler> = {
  "image-component": imageComponentHandler,
  "html-document-embed": htmlDocumentEmbedHandler,
};
