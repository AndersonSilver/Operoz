import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { IBoard } from "@operoz/types";
import { BoardAutomationTemplatesGallery } from "./automation/board-automation-templates-gallery";

export const BoardAutomationTemplatesSettings = observer(function BoardAutomationTemplatesSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-16 font-semibold text-primary">{t("boards.settings.automation.templates.title")}</h3>
      </div>
      <BoardAutomationTemplatesGallery workspaceSlug={props.workspaceSlug} board={props.board} />
    </div>
  );
});
