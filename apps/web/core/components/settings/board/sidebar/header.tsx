/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowLeft } from "lucide-react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { IconButton } from "@plane/propel/icon-button";
import type { IBoard } from "@plane/types";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

export const BoardSettingsSidebarHeader = observer(function BoardSettingsSidebarHeader(props: Props) {
  const { workspaceSlug, board } = props;
  const router = useAppRouter();
  const { t } = useTranslation();

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-1 py-3 pr-5 pl-4 text-body-md-medium">
        <IconButton
          variant="ghost"
          size="base"
          icon={ArrowLeft}
          onClick={() => router.push(`/${workspaceSlug}/settings/boards`)}
        />
        <p>{t("boards.settings.title")}</p>
      </div>
      <div className="mt-1.5 flex items-center gap-2 truncate px-5 py-0.5">
        <div className="grid size-8 shrink-0 place-items-center rounded bg-layer-2">
          <Logo logo={board.logo_props} size={20} />
        </div>
        <div className="truncate">
          <p className="truncate text-body-sm-medium">{board.name}</p>
          <p className="truncate text-caption-md-regular text-tertiary">{t("boards.settings.board_subtitle")}</p>
        </div>
      </div>
    </div>
  );
});
