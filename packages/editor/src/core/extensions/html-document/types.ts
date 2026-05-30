// local imports
import type { ECustomImageStatus } from "@/extensions/custom-image/types";

export enum EHtmlDocumentAttributeNames {
  ID = "id",
  SOURCE = "src",
  STATUS = "status",
  TITLE = "title",
  /** standard = ~480px min height; tall = ~70vh; fullBleed = largura do viewport + altura grande */
  FRAME_LAYOUT = "frameLayout",
  /** CSS length, ex.: 600px ou 75vh — sobrepõe a altura mínima do preset quando preenchido */
  CUSTOM_MIN_HEIGHT = "customMinHeight",
}

export type THtmlDocumentFrameLayout = "standard" | "tall" | "fullBleed";

export type THtmlDocumentAttributes = {
  [EHtmlDocumentAttributeNames.ID]: string | null;
  [EHtmlDocumentAttributeNames.SOURCE]: string | null;
  [EHtmlDocumentAttributeNames.STATUS]: ECustomImageStatus;
  [EHtmlDocumentAttributeNames.TITLE]: string | null;
  [EHtmlDocumentAttributeNames.FRAME_LAYOUT]: THtmlDocumentFrameLayout;
  [EHtmlDocumentAttributeNames.CUSTOM_MIN_HEIGHT]: string | null;
};

export type InsertHtmlDocumentEmbedProps = {
  file?: File;
  pos?: number | null;
  event: "insert" | "drop";
};

export type HtmlDocumentEmbedExtensionOptions = {
  getHtmlSource: (path: string) => Promise<string>;
  uploadHtml: (blockId: string, file: File) => Promise<string>;
  duplicateHtml?: (assetId: string) => Promise<string>;
  restoreHtml: (assetSrc: string) => Promise<void>;
};

export type HtmlDocumentEmbedExtensionStorage = {
  fileMap: Map<
    string,
    | {
        file: File;
        event: "drop";
      }
    | {
        event: "insert";
        hasOpenedFileInputOnce: boolean;
      }
  >;
  deletedHtmlDocumentSet: Map<string, boolean>;
  maxFileSize: number;
  markdown: { serialize: () => void };
};
