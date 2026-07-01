/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import type { IBoard, TLogoProps } from "@plane/types";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoard } from "@/hooks/store/use-board";
import { BoardLogoPropsField } from "./board-logo-props-field";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  board: IBoard;
};

export const BoardGanttIconsSettings = observer(function BoardGanttIconsSettings(props: Props) {
  const { workspaceSlug, boardSlug, board } = props;
  const { t } = useTranslation();
  const { updateBoard } = useBoard();

  const [projectLogo, setProjectLogo] = useState<TLogoProps | undefined>(board.gantt_project_logo_props);
  const [moduleLogo, setModuleLogo] = useState<TLogoProps | undefined>(board.gantt_module_logo_props);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProjectLogo(board.gantt_project_logo_props);
    setModuleLogo(board.gantt_module_logo_props);
  }, [board.gantt_module_logo_props, board.gantt_project_logo_props, board.id]);

  const issueTypesHref = `/${workspaceSlug}/settings/boards/${boardSlug}/tipos`;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBoard(workspaceSlug, boardSlug, {
        gantt_project_logo_props: projectLogo,
        gantt_module_logo_props: moduleLogo,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.gantt_icons.save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <SettingsHeading
        title={t("boards.settings.gantt_icons.heading")}
        description={t("boards.settings.gantt_icons.description")}
      />

      <div className="mt-6 space-y-4">
        <BoardLogoPropsField
          label={t("boards.settings.gantt_icons.project_label")}
          description={t("boards.settings.gantt_icons.project_description")}
          value={projectLogo}
          onChange={setProjectLogo}
        />
        <BoardLogoPropsField
          label={t("boards.settings.gantt_icons.module_label")}
          description={t("boards.settings.gantt_icons.module_description")}
          value={moduleLogo}
          onChange={setModuleLogo}
        />
      </div>

      <div className="mt-6 rounded-lg border border-subtle bg-layer-2/40 p-4">
        <p className="text-body-sm-medium text-primary">{t("boards.settings.gantt_icons.cards_heading")}</p>
        <p className="mt-1 text-13 text-tertiary">{t("boards.settings.gantt_icons.cards_description")}</p>
        <Link
          to={issueTypesHref}
          className="mt-3 inline-block text-13 font-medium text-accent-primary hover:underline"
        >
          {t("boards.settings.gantt_icons.cards_link")}
        </Link>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSave} loading={isSaving}>
          {t("save_changes")}
        </Button>
      </div>
    </div>
  );
});
