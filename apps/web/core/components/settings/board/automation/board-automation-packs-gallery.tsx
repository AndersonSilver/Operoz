import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Package } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, TAutomationPackSummary } from "@operis/types";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

export const BoardAutomationPacksGallery = observer(function BoardAutomationPacksGallery(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [available, setAvailable] = useState<TAutomationPackSummary[]>([]);
  const [installed, setInstalled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getAutomationPacks(workspaceSlug, board.slug);
      setAvailable(data.available ?? []);
      setInstalled((data.installed ?? []).map((row) => row.pack_name));
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const install = async (packName: string) => {
    setInstalling(packName);
    try {
      await boardService.installAutomationPack(workspaceSlug, board.slug, packName, { create_rules: true });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.packs.installed"),
      });
      await load();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.packs.install_failed"),
      });
    } finally {
      setInstalling(null);
    }
  };

  const uninstall = async (packName: string) => {
    setInstalling(packName);
    try {
      await boardService.uninstallAutomationPack(workspaceSlug, board.slug, packName);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.packs.uninstalled"),
      });
      await load();
    } finally {
      setInstalling(null);
    }
  };

  if (loading) {
    return <p className="text-13 text-tertiary">{t("common.loading")}</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {available.map((pack) => {
        const isInstalled = installed.includes(pack.name);
        return (
          <article key={pack.name} className="rounded-lg border border-subtle bg-surface-1 p-4">
            <div className="mb-2 flex items-start gap-2">
              <Package className="mt-0.5 size-4 text-accent-primary" />
              <div>
                <h3 className="text-13 font-medium text-primary">{pack.name}</h3>
                <p className="text-11 text-tertiary">v{pack.version}</p>
              </div>
            </div>
            <p className="text-12 text-secondary">{pack.description}</p>
            <p className="mt-2 text-11 text-tertiary">
              {t("boards.settings.automation.packs.meta", {
                rules: pack.rules_count,
                hooks: pack.has_hooks ? 1 : 0,
              })}
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant={isInstalled ? "secondary" : "primary"}
              loading={installing === pack.name}
              onClick={() => void (isInstalled ? uninstall(pack.name) : install(pack.name))}
            >
              {isInstalled
                ? t("boards.settings.automation.packs.uninstall")
                : t("boards.settings.automation.packs.install")}
            </Button>
          </article>
        );
      })}
    </div>
  );
});
