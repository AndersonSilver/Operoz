import { observer } from "mobx-react";
import type { IBoard } from "@operoz/types";
import { useTranslation } from "@operoz/i18n";
import { BoardAutomationPacksGallery } from "./automation/board-automation-packs-gallery";

export const BoardAutomationPacksSettings = observer(function BoardAutomationPacksSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-14 font-semibold text-primary">{t("boards.settings.automation.packs.title")}</h2>
        <p className="text-13 text-tertiary">{t("boards.settings.automation.packs.lead")}</p>
      </div>
      <BoardAutomationPacksGallery workspaceSlug={props.workspaceSlug} board={props.board} />
    </div>
  );
});
