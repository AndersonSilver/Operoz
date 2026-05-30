/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { BoardSettingsSectionPage } from "@/components/settings/board/board-settings-section-page";
import { getBoardSettingsSection } from "@/constants/board-settings";
import type { Route } from "./+types/page";

const section = getBoardSettingsSection("board_view")!;

function BoardViewSettingsPage({ params }: Route.ComponentProps) {
  return <BoardSettingsSectionPage workspaceSlug={params.workspaceSlug} section={section} />;
}

export default observer(BoardViewSettingsPage);
