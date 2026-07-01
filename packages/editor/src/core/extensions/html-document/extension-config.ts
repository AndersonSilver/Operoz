/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Node, mergeAttributes } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { EHtmlDocumentAttributeNames } from "./types";
import type { HtmlDocumentEmbedExtensionStorage, InsertHtmlDocumentEmbedProps, THtmlDocumentAttributes } from "./types";
import { DEFAULT_HTML_DOCUMENT_ATTRIBUTES, parseFrameLayoutAttr } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.HTML_DOCUMENT_EMBED]: {
      insertHtmlDocumentEmbed: (props: InsertHtmlDocumentEmbedProps) => ReturnType;
    };
  }
  interface Storage {
    [CORE_EXTENSIONS.HTML_DOCUMENT_EMBED]: HtmlDocumentEmbedExtensionStorage;
  }
}

export const HtmlDocumentEmbedExtensionConfig = Node.create({
  name: CORE_EXTENSIONS.HTML_DOCUMENT_EMBED,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      ...Object.values(EHtmlDocumentAttributeNames).reduce(
        (acc, value) => {
          const spec: {
            default: THtmlDocumentAttributes[keyof THtmlDocumentAttributes];
            parseHTML?: (element: HTMLElement) => unknown;
            renderHTML?: (attributes: THtmlDocumentAttributes) => Record<string, string>;
          } = {
            default: DEFAULT_HTML_DOCUMENT_ATTRIBUTES[value],
          };
          if (value === EHtmlDocumentAttributeNames.FRAME_LAYOUT) {
            spec.parseHTML = (element) => parseFrameLayoutAttr(element.getAttribute("data-frame-layout"));
            spec.renderHTML = (attributes) => ({
              "data-frame-layout": attributes.frameLayout ?? "standard",
            });
          }
          if (value === EHtmlDocumentAttributeNames.CUSTOM_MIN_HEIGHT) {
            spec.parseHTML = (element) => element.getAttribute("data-custom-min-height");
            spec.renderHTML = (attributes): Record<string, string> =>
              attributes.customMinHeight ? { "data-custom-min-height": attributes.customMinHeight } : {};
          }
          acc[value] = spec;
          return acc;
        },
        {} as Record<EHtmlDocumentAttributeNames, { default: THtmlDocumentAttributes[EHtmlDocumentAttributeNames] }>
      ),
    };
  },

  parseHTML() {
    return [
      {
        tag: "html-document-embed",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["html-document-embed", mergeAttributes(HTMLAttributes)];
  },
});
