/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ExternalLink, FileCode2, SlidersHorizontal } from "lucide-react";
import type { ChangeEvent, CSSProperties, MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_HTML_DOCUMENT_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { ECustomImageStatus } from "@/extensions/custom-image/types";
import { hasImageDuplicationFailed } from "@/extensions/custom-image/utils";
import { useUploader } from "@/hooks/use-file-upload";
// types
import type { HtmlDocumentEmbedExtensionOptions, THtmlDocumentFrameLayout } from "../types";
import { getHtmlDocumentFileMap, isLikelyHtmlFile, isSafeCssMinHeight, parseFrameLayoutAttr } from "../utils";

const HTML_DOCUMENT_FRAME_LAYOUT_OPTIONS: Array<{ value: THtmlDocumentFrameLayout; label: string }> = [
  { value: "standard", label: "Padrão" },
  { value: "tall", label: "Alto (70% altura)" },
  { value: "fullBleed", label: "Largura total" },
];

type HtmlDocumentEmbedLayoutPopoverProps = {
  frameLayout: THtmlDocumentFrameLayout;
  customMinHeightStored: string | null;
  updateAttributes: NodeViewProps["updateAttributes"];
};

function HtmlDocumentEmbedLayoutPopover(props: HtmlDocumentEmbedLayoutPopoverProps) {
  const { frameLayout, customMinHeightStored, updateAttributes } = props;
  const [open, setOpen] = useState(false);
  const layoutFieldId = useId();
  const heightFieldId = useId();

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ["top-end", "bottom-start", "top-start"],
      }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const stopPropagation: React.MouseEventHandler = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-12 text-secondary hover:bg-layer-transparent-hover hover:text-primary",
          open && "bg-layer-transparent-hover text-primary"
        )}
        {...getReferenceProps({
          onMouseDown: stopPropagation,
        })}
      >
        <SlidersHorizontal className="size-3.5" />
        <span>Área e altura</span>
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              "z-[10001] w-[min(100vw-2rem,18rem)] rounded-md border border-subtle-1 bg-layer-1 p-3 text-left shadow-custom-shadow-rg"
            )}
            {...getFloatingProps({
              onMouseDown: stopPropagation,
              onPointerDown: stopPropagation,
            })}
          >
            <div className="flex flex-col gap-3 text-12">
              <div className="flex flex-col gap-1.5">
                <span id={layoutFieldId} className="text-11 text-secondary">
                  Área
                </span>
                <div
                  className="flex flex-col gap-1"
                  role="radiogroup"
                  aria-labelledby={layoutFieldId}
                >
                  {HTML_DOCUMENT_FRAME_LAYOUT_OPTIONS.map((opt) => {
                    const selected = frameLayout === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          "w-full rounded border px-2 py-1.5 text-left text-12 transition-colors",
                          selected
                            ? "border-primary bg-layer-1 font-medium text-primary"
                            : "border-subtle-1 bg-layer-1 text-primary hover:bg-layer-transparent-hover"
                        )}
                        onMouseDown={stopPropagation}
                        onPointerDown={stopPropagation}
                        onClick={() => updateAttributes({ frameLayout: opt.value })}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={heightFieldId} className="text-11 text-secondary">
                  Altura (opcional)
                </label>
                <input
                  id={heightFieldId}
                  type="text"
                  className="w-full rounded border border-subtle-1 bg-layer-1 px-2 py-1.5 text-12 text-primary placeholder:text-tertiary"
                  placeholder="720px"
                  title="Sobrepõe o preset (ex.: 600px, 75vh)"
                  value={customMinHeightStored ?? ""}
                  onMouseDown={stopPropagation}
                  onPointerDown={stopPropagation}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateAttributes({ customMinHeight: v === "" ? null : v });
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value;
                    const trimmed = raw.trim();
                    if (trimmed === "") {
                      updateAttributes({ customMinHeight: null });
                    } else if (trimmed !== raw) {
                      updateAttributes({ customMinHeight: trimmed });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export function HtmlDocumentNodeView(props: NodeViewProps) {
  const { editor, extension, node, updateAttributes, getPos, selected } = props;
  const opts = extension.options as HtmlDocumentEmbedExtensionOptions;

  const assetId = node.attrs.src as string | null;
  const status = node.attrs.status as ECustomImageStatus;
  const blockId = node.attrs.id as string | null;
  const title = (node.attrs.title as string | null) ?? "HTML";
  const frameLayout = parseFrameLayoutAttr(node.attrs.frameLayout as string | undefined);
  const customMinHeightStored = (node.attrs.customMinHeight as string | null) ?? null;
  const customMinHeightEffective =
    customMinHeightStored && isSafeCssMinHeight(customMinHeightStored) ? customMinHeightStored.trim() : null;

  const iframeMinHeightClass =
    customMinHeightEffective !== null
      ? undefined
      : frameLayout === "standard"
        ? "min-h-[480px]"
        : frameLayout === "tall"
          ? "min-h-[70vh]"
          : "min-h-[85vh]";

  const iframeMinHeightStyle: CSSProperties | undefined =
    customMinHeightEffective !== null ? { minHeight: customMinHeightEffective } : undefined;

  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const hasTriedUploadingOnMountRef = useRef(false);
  const isDuplicatingRef = useRef(false);
  const hasRetriedOnMount = useRef(false);

  const htmlDocumentFileMap = getHtmlDocumentFileMap(editor);
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;
  const maxFileSize = (editor.storage.htmlDocumentEmbed?.maxFileSize as number | undefined) ?? 0;

  useEffect(() => {
    if (!assetId) {
      setResolvedSrc(undefined);
      return;
    }
    setResolvedSrc(undefined);
    void (async () => {
      try {
        const url = await opts.getHtmlSource(assetId);
        setResolvedSrc(url);
      } catch (e) {
        console.error("Failed to resolve HTML document asset URL:", e);
      }
    })();
  }, [assetId, opts]);

  useEffect(() => {
    const handleDuplication = async () => {
      if (status !== ECustomImageStatus.DUPLICATING || !opts.duplicateHtml || !assetId) return;
      if (isDuplicatingRef.current) return;
      isDuplicatingRef.current = true;
      try {
        hasRetriedOnMount.current = true;
        const newAssetId = await opts.duplicateHtml(assetId);
        if (!newAssetId) throw new Error("Duplication returned invalid asset ID");
        updateAttributes({ src: newAssetId, status: ECustomImageStatus.UPLOADED });
      } catch (error: unknown) {
        console.error("Failed to duplicate HTML asset:", error);
        updateAttributes({ status: ECustomImageStatus.DUPLICATION_FAILED });
      } finally {
        isDuplicatingRef.current = false;
      }
    };
    void handleDuplication();
  }, [assetId, opts, status, updateAttributes]);

  useEffect(() => {
    if (hasImageDuplicationFailed(status) && !hasRetriedOnMount.current && assetId) {
      hasRetriedOnMount.current = true;
      updateAttributes({ status: ECustomImageStatus.DUPLICATING });
    }
  }, [assetId, status, updateAttributes]);

  const handleUploadedUrl = useCallback(
    (url: string) => {
      if (!url || !blockId) return;
      htmlDocumentFileMap?.delete(blockId);
      updateAttributes({
        src: url,
        status: ECustomImageStatus.UPLOADED,
      });
      const pos = getPos();
      const sel = editor.state.selection;
      const currentNode = editor.state.doc.nodeAt(sel.from);
      if (currentNode && currentNode.type.name === node.type.name && currentNode.attrs.src === url && pos !== undefined) {
        const nextNode = editor.state.doc.nodeAt(pos + 1);
        if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
          editor.commands.setTextSelection(pos + 1);
        } else {
          editor.commands.createParagraphNear();
        }
      }
    },
    [blockId, editor, getPos, htmlDocumentFileMap, node.type.name, updateAttributes]
  );

  const uploadCommand = useCallback(
    async (file: File) => {
      updateAttributes({ status: ECustomImageStatus.UPLOADING });
      return await opts.uploadHtml?.(blockId ?? "", file);
    },
    [blockId, opts, updateAttributes]
  );

  const handleProgressStatus = useCallback(
    (uploading: boolean) => {
      editor.storage.utility.uploadInProgress = uploading;
    },
    [editor]
  );

  const handleInvalidFile = useCallback((_error: unknown, _file: File, message: string) => {
    window.alert(message);
  }, []);

  const { isUploading, uploadFile } = useUploader({
    acceptedMimeTypes: ACCEPTED_HTML_DOCUMENT_MIME_TYPES,
    editorCommand: uploadCommand,
    handleProgressStatus,
    maxFileSize,
    onInvalidFile: handleInvalidFile,
    onUpload: (url, _file) => handleUploadedUrl(url),
  });

  useEffect(() => {
    if (hasTriedUploadingOnMountRef.current || !htmlDocumentFileMap || !blockId) return;
    const meta = htmlDocumentFileMap.get(blockId);
    if (!meta) return;
    if (meta.event === "drop" && "file" in meta) {
      hasTriedUploadingOnMountRef.current = true;
      void uploadFile(meta.file);
    } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
      if (meta.hasOpenedFileInputOnce) return;
      if (!isTouchDevice) {
        fileInputRef.current.click();
      }
      hasTriggeredFilePickerRef.current = true;
      htmlDocumentFileMap.set(blockId, { event: "insert", hasOpenedFileInputOnce: true });
    }
  }, [blockId, htmlDocumentFileMap, isTouchDevice, uploadFile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !isLikelyHtmlFile(file)) {
      window.alert("Tipo de arquivo inválido. Escolha um arquivo HTML (.html).");
      return;
    }
    void uploadFile(file);
  };

  const openInNewTab = () => {
    if (!resolvedSrc) return;
    window.open(resolvedSrc, "_blank", "noopener,noreferrer");
  };

  /** Impede que o editor capture o evento (ex.: clique no texto "Área" em vez do select). */
  const stopPointerForFormControls = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation();
  };

  const showPreview = assetId && resolvedSrc && status === ECustomImageStatus.UPLOADED;
  const showFailure = hasImageDuplicationFailed(status);

  return (
    <NodeViewWrapper
      className={cn(
        "html-document-embed-root",
        frameLayout === "fullBleed" && "editor-full-width-block horizontal-scrollbar scrollbar-sm"
      )}
    >
      <div className={cn("relative mx-0 my-3 w-full rounded-md border border-subtle-1 bg-layer-1", selected && "ring-1 ring-subtle-2")}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html,application/xhtml+xml"
          className="hidden"
          onChange={handleFileChange}
        />

        {showPreview ? (
          <div className="flex flex-col gap-2 p-2">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-1">
              <div
                className="flex min-w-0 cursor-grab items-center gap-2 text-13 text-secondary active:cursor-grabbing"
                data-drag-handle
              >
                <FileCode2 className="size-4 shrink-0" />
                <span className="truncate font-medium text-primary">{title}</span>
              </div>
              <div
                className="relative z-20 flex shrink-0 flex-wrap items-center gap-2"
                onMouseDown={stopPointerForFormControls}
                onPointerDown={stopPointerForFormControls}
              >
                {editor.isEditable && (
                  <HtmlDocumentEmbedLayoutPopover
                    frameLayout={frameLayout}
                    customMinHeightStored={customMinHeightStored}
                    updateAttributes={updateAttributes}
                  />
                )}
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-12 text-secondary hover:bg-layer-transparent-hover hover:text-primary"
                  onMouseDown={stopPointerForFormControls}
                  onPointerDown={stopPointerForFormControls}
                  onClick={openInNewTab}
                >
                  <ExternalLink className="size-3.5" />
                  <span>Abrir em nova aba</span>
                </button>
              </div>
            </div>
            {/* fullBleed: classe no wrapper React; variables.css aplica o layout no .node-htmlDocumentEmbed (:has). */}
            {frameLayout === "fullBleed" ? (
              <div className="min-w-0 overflow-x-auto">
                <iframe
                  title={title}
                  src={resolvedSrc}
                  className={cn(
                    "block w-full max-w-none rounded-sm border border-subtle-1 bg-white",
                    iframeMinHeightClass
                  )}
                  style={iframeMinHeightStyle}
                  sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <iframe
                title={title}
                src={resolvedSrc}
                className={cn("w-full rounded-sm border border-subtle-1 bg-white", iframeMinHeightClass)}
                style={iframeMinHeightStyle}
                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-10">
            {showFailure ? (
              <p className="text-13 text-danger">Não foi possível carregar o HTML.</p>
            ) : (
              <>
                <FileCode2 className="size-8 text-tertiary" />
                <p className="text-center text-13 text-secondary">
                  {isUploading ? "Enviando HTML…" : "Envie um arquivo HTML para exibir aqui"}
                </p>
                {!isUploading && editor.isEditable && (
                  <button
                    type="button"
                    className="rounded-sm bg-primary px-3 py-1.5 text-12 font-medium text-white hover:opacity-90"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Escolher arquivo
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
