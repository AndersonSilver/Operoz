import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Header } from "@operis/ui";
import { CreateBoardModal } from "@/components/board/create-board-modal";
import { useUserPermissions } from "@/hooks/store/user";

export const BoardsDirectoryHeader = observer(function BoardsDirectoryHeader() {
  const { workspaceSlug = "" } = useParams();
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canCreate = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);

  return (
    <>
      <CreateBoardModal workspaceSlug={workspaceSlug} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <Header>
        <Header.LeftItem>
          <h1 className="text-16 font-semibold text-primary">{t("boards.spaces_title")}</h1>
        </Header.LeftItem>
        {canCreate ? (
          <Header.RightItem>
            <Button variant="primary" size="lg" className="!rounded-sm px-3" onClick={() => setIsCreateOpen(true)}>
              {t("boards.spaces_create")}
            </Button>
          </Header.RightItem>
        ) : null}
      </Header>
    </>
  );
});
