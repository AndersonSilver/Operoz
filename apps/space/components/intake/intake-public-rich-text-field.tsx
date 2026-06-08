import { useMemo, useRef, useState } from "react";
import { MAX_FILE_SIZE } from "@operis/constants";
import { RichTextEditorWithRef } from "@operis/editor";
import type { EditorRefApi, TExtensions, TFileHandler } from "@operis/editor";
import type { TCustomComponentsMetaData } from "@operis/utils";
import { useTranslation } from "@operis/i18n";
import { isEditorEmpty } from "@operis/utils";
import { IntakePublicEditorToolbar } from "./intake-public-editor-toolbar";

const EMPTY_EDITOR_METADATA: TCustomComponentsMetaData = {
  file_assets: [],
  user_mentions: [],
};

const INTAKE_PUBLIC_DISABLED_EXTENSIONS: TExtensions[] = [
  "ai",
  "collaboration-cursor",
  "image",
  "issue-embed",
  "slash-commands",
];

type Props = {
  fieldId: string;
  value: string;
  onChange: (html: string) => void;
};

export function IntakePublicRichTextField(props: Props) {
  const { fieldId, value, onChange } = props;
  const { t } = useTranslation();
  const editorRef = useRef<EditorRefApi | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const fileHandler = useMemo<TFileHandler>(
    () => ({
      checkIfAssetExists: async () => false,
      assetsUploadStatus: {},
      getAssetDownloadSrc: async (src) => src,
      getAssetSrc: async (src) => src,
      upload: async () => "",
      delete: async () => undefined,
      cancel: () => undefined,
      restore: async () => undefined,
      duplicate: async (assetId) => assetId,
      validation: {
        maxFileSize: MAX_FILE_SIZE,
      },
    }),
    []
  );

  const initialValue = value?.trim() ? value : "<p></p>";

  return (
    <div className="intake-public-rich-text">
      <div className="intake-public-rich-text-toolbar border-b border-subtle bg-layer-1" data-prevent-outside-click>
        <IntakePublicEditorToolbar editorRef={editorRef} editorReady={isEditorReady} />
      </div>
      <RichTextEditorWithRef
        ref={editorRef}
        editable
        bubbleMenuEnabled={false}
        id={`intake-public-${fieldId}`}
        initialValue={initialValue}
        value={value || null}
        dragDropEnabled={false}
        disabledExtensions={INTAKE_PUBLIC_DISABLED_EXTENSIONS}
        flaggedExtensions={[]}
        extendedEditorProps={{}}
        fileHandler={fileHandler}
        getEditorMetaData={() => EMPTY_EDITOR_METADATA}
        mentionHandler={{
          searchCallback: async () => [],
          renderComponent: () => null,
        }}
        handleEditorReady={setIsEditorReady}
        onChange={(_json, descriptionHtml) => onChange(descriptionHtml)}
        placeholder={(isFocused, description) =>
          isFocused || !isEditorEmpty(description)
            ? t("issue_modal_description_placeholder_active")
            : t("issue_modal_description_placeholder")
        }
        containerClassName="intake-public-rich-text-editor min-h-[120px] px-3 pt-2 pb-3"
        editorClassName="min-h-[100px] text-13"
        displayConfig={{ fontSize: "large-font" }}
      />
    </div>
  );
}
