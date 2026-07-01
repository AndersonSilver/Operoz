import { Layers } from "lucide-react";
import type { IBoard } from "@operoz/types";
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { handlePowerKNavigate } from "@/components/power-k/utils/navigation";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";

export type TPowerKBoardNavigationCommandKeys = "open_board" | "open_board_backlog";

const baseWorkspaceConditions = (ctx: TPowerKContext) => Boolean(ctx.params.workspaceSlug?.toString());

export const usePowerKBoardNavigationCommands = (): TPowerKCommandConfig[] => {
  if (!ENABLE_WORKSPACE_BOARDS) return [];

  const commands: Record<TPowerKBoardNavigationCommandKeys, TPowerKCommandConfig> = {
    open_board: {
      id: "open_board",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_board",
      icon: Layers,
      keySequence: "ob",
      page: "open-board",
      onSelect: (data, ctx) => {
        const board = data as IBoard;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "boards", board.slug]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    open_board_backlog: {
      id: "open_board_backlog",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_board_backlog",
      icon: Layers,
      keySequence: "obb",
      page: "open-board",
      onSelect: (data, ctx) => {
        const board = data as IBoard;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "boards", board.slug, "backlog"]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
  };

  return [commands.open_board_backlog, commands.open_board];
};
