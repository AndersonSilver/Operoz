// constants
import type { CORE_EXTENSIONS } from "@/constants/extension";
// plane editor imports
import type { TAdditionalEditorAsset } from "@/plane-editor/types/asset";

export type TEditorImageAsset = {
  href: string;
  id: string;
  name: string;
  src: string;
  type: CORE_EXTENSIONS.IMAGE | CORE_EXTENSIONS.CUSTOM_IMAGE | CORE_EXTENSIONS.HTML_DOCUMENT_EMBED;
};

export type TEditorAsset = TEditorImageAsset | TAdditionalEditorAsset;
