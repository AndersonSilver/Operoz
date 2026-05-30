import { observer } from "mobx-react";
import { BoardSettingsSectionPage } from "@/components/settings/board/board-settings-section-page";
import { getBoardSettingsSection } from "@/constants/board-settings";
import type { Route } from "./+types/page";

const section = getBoardSettingsSection("automation")!;

function BoardAutomationSettingsPage({ params }: Route.ComponentProps) {
  return <BoardSettingsSectionPage workspaceSlug={params.workspaceSlug} section={section} />;
}

export default observer(BoardAutomationSettingsPage);
