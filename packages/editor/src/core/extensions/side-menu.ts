import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// plugins
import { AIHandlePlugin } from "@/plugins/ai-handle";
import { BLOCK_DRAG_HANDLE_SELECTORS, DragHandlePlugin, nodeDOMAtCoords } from "@/plugins/drag-handle";

type Props = {
  aiEnabled: boolean;
  dragDropEnabled: boolean;
};

export type SideMenuPluginProps = {
  dragHandleWidth: number;
  handlesConfig: {
    ai: boolean;
    dragDrop: boolean;
  };
  scrollThreshold: {
    up: number;
    down: number;
  };
};

export type SideMenuHandleOptions = {
  view: (view: EditorView, sideMenu: HTMLDivElement | null) => void;
  domEvents?: {
    [key: string]: (...args: any) => void;
  };
};

export const SideMenuExtension = (props: Props) => {
  const { aiEnabled, dragDropEnabled } = props;

  return Extension.create({
    name: CORE_EXTENSIONS.SIDE_MENU,
    addProseMirrorPlugins() {
      return [
        SideMenu({
          dragHandleWidth: 24,
          handlesConfig: {
            ai: aiEnabled,
            dragDrop: dragDropEnabled,
          },
          scrollThreshold: { up: 200, down: 150 },
        }),
      ];
    },
  });
};

const absoluteRect = (node: Element) => {
  const data = node.getBoundingClientRect();

  return {
    top: data.top,
    left: data.left,
    width: data.width,
    height: data.height,
  };
};

const BLOCK_DRAG_HANDLE_TOP_OFFSET = 12;

/** Ancora o handle no cartão interno (HTML, imagem, etc.), não no centro do bloco. */
const getBlockDragHandleRect = (node: Element) => {
  const dragAnchor = node.querySelector("[data-drag-handle]");
  if (dragAnchor instanceof Element) {
    const anchorRect = absoluteRect(dragAnchor);
    return {
      top: anchorRect.top + Math.max(0, (anchorRect.height - 20) / 2),
      left: anchorRect.left,
      width: anchorRect.width,
    };
  }

  if (node.matches(".html-document-embed-root")) {
    const card = node.firstElementChild;
    if (card instanceof Element) {
      const cardRect = absoluteRect(card);
      return {
        top: cardRect.top + BLOCK_DRAG_HANDLE_TOP_OFFSET,
        left: cardRect.left,
        width: cardRect.width,
      };
    }
  }

  const rect = absoluteRect(node);
  return {
    top: rect.top + BLOCK_DRAG_HANDLE_TOP_OFFSET,
    left: rect.left,
    width: rect.width,
  };
};

const SideMenu = (options: SideMenuPluginProps) => {
  const { handlesConfig } = options;
  const editorSideMenu: HTMLDivElement | null = document.createElement("div");
  editorSideMenu.id = "editor-side-menu";
  // side menu view actions
  const hideSideMenu = () => {
    if (!editorSideMenu?.classList.contains("side-menu-hidden")) editorSideMenu?.classList.add("side-menu-hidden");
  };
  const showSideMenu = () => editorSideMenu?.classList.remove("side-menu-hidden");
  // side menu elements
  const { view: dragHandleView, domEvents: dragHandleDOMEvents } = DragHandlePlugin(options);
  const { view: aiHandleView, domEvents: aiHandleDOMEvents } = AIHandlePlugin(options);

  return new Plugin({
    key: new PluginKey("sideMenu"),
    view: (view) => {
      hideSideMenu();
      // Fora de ancestrais com backdrop-filter/transform (ex.: cartão vidro do hub),
      // para position:fixed alinhar com getBoundingClientRect().
      if (!editorSideMenu.isConnected) {
        document.body.appendChild(editorSideMenu);
      }
      // side menu elements' initialization
      if (handlesConfig.ai && !editorSideMenu.querySelector("#ai-handle")) {
        aiHandleView(view, editorSideMenu);
      }

      if (handlesConfig.dragDrop && !editorSideMenu.querySelector("#drag-handle")) {
        dragHandleView(view, editorSideMenu);
      }

      return {
        destroy: () => {
          hideSideMenu();
          editorSideMenu.remove();
        },
      };
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) return;

          const node = nodeDOMAtCoords({
            x: event.clientX + 50 + options.dragHandleWidth,
            y: event.clientY,
          });

          if (!(node instanceof Element) || node.matches("ul, ol")) {
            hideSideMenu();
            return;
          }

          const isBlockWidget = node.matches(BLOCK_DRAG_HANDLE_SELECTORS);
          const rect = isBlockWidget ? getBlockDragHandleRect(node) : absoluteRect(node);

          if (!isBlockWidget) {
            const compStyle = window.getComputedStyle(node);
            const lineHeight = parseInt(compStyle.lineHeight, 10);
            const paddingTop = parseInt(compStyle.paddingTop, 10);

            if (!Number.isNaN(lineHeight)) {
              rect.top += (lineHeight - 20) / 2;
            }
            if (!Number.isNaN(paddingTop)) {
              rect.top += paddingTop;
            }
          }

          if (handlesConfig.ai) {
            rect.left -= 20;
          }

          if (node.parentElement?.parentElement?.matches("td") || node.parentElement?.parentElement?.matches("th")) {
            if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
              rect.left -= 5;
            }
          } else {
            // Li markers
            if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
              rect.left -= 18;
            }
          }

          if (node.matches("table")) {
            rect.top += 8;
            rect.left -= 8;
          }

          rect.width = options.dragHandleWidth;

          if (!editorSideMenu) return;

          editorSideMenu.style.left = `${rect.left - rect.width}px`;
          editorSideMenu.style.top = `${rect.top}px`;
          showSideMenu();
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.mousemove();
          }
          if (handlesConfig.ai) {
            aiHandleDOMEvents?.mousemove?.();
          }
        },
        // keydown: () => hideSideMenu(),
        mousewheel: () => hideSideMenu(),
        dragenter: (view) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.dragenter?.(view);
          }
        },
        drop: (view, event) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.drop?.(view, event);
          }
        },
        dragend: (view) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.dragend?.(view);
          }
        },
      },
    },
  });
};
