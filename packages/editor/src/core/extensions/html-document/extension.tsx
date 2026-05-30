import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// extensions
import { ECustomImageStatus } from "@/extensions/custom-image/types";
// types
import type { TFileHandler } from "@/types";
// local imports
import { HtmlDocumentNodeView } from "./components/node-view";
import { HtmlDocumentEmbedExtensionConfig } from "./extension-config";
import type { InsertHtmlDocumentEmbedProps } from "./types";
import { getHtmlDocumentFileMap, isLikelyHtmlFile } from "./utils";

type Props = {
  fileHandler: TFileHandler;
  isEditable: boolean;
};

export function HtmlDocumentEmbedExtension(props: Props) {
  const { fileHandler, isEditable } = props;
  const { getAssetSrc, restore } = fileHandler;

  return HtmlDocumentEmbedExtensionConfig.extend({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;
      const duplicateHtml = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;
      return {
        ...this.parent?.(),
        getHtmlSource: getAssetSrc,
        uploadHtml: upload,
        duplicateHtml,
        restoreHtml: restore,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        deletedHtmlDocumentSet: new Map<string, boolean>(),
        maxFileSize,
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertHtmlDocumentEmbed:
          (cmdProps: InsertHtmlDocumentEmbedProps) =>
          ({ commands }) => {
            if (cmdProps?.file && !isLikelyHtmlFile(cmdProps.file)) {
              window.alert("Tipo de arquivo inválido. Escolha um arquivo HTML (.html).");
              return false;
            }

            const fileId = uuidv4();
            const htmlDocumentFileMap = getHtmlDocumentFileMap(this.editor);

            if (htmlDocumentFileMap) {
              if (cmdProps?.event === "drop" && cmdProps.file) {
                htmlDocumentFileMap.set(fileId, { file: cmdProps.file, event: cmdProps.event });
              } else if (cmdProps.event === "insert") {
                htmlDocumentFileMap.set(fileId, { event: cmdProps.event, hasOpenedFileInputOnce: false });
              }
            }

            const attributes = {
              id: fileId,
              status: ECustomImageStatus.PENDING,
              src: null,
              title: cmdProps?.file?.name ?? null,
            };

            if (cmdProps.pos !== undefined && cmdProps.pos !== null) {
              return commands.insertContentAt(cmdProps.pos, {
                type: this.name,
                attrs: attributes,
              });
            }
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((nodeProps) => <HtmlDocumentNodeView {...nodeProps} />);
    },
  });
}
