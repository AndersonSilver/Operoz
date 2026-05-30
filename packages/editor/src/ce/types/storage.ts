// extensions
import type { ImageExtensionStorage } from "@/extensions/image";
import type { HtmlDocumentEmbedExtensionStorage } from "@/extensions/html-document/types";

export type ExtensionFileSetStorageKey =
  | Extract<keyof ImageExtensionStorage, "deletedImageSet">
  | Extract<keyof HtmlDocumentEmbedExtensionStorage, "deletedHtmlDocumentSet">;
