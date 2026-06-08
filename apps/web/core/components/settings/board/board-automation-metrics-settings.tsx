import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, TAutomationMetricsResponse } from "@operis/types";
import { Loader } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationMetricsPanel } from "./automation/automation-metrics-panel";

const boardService = new BoardService();

export const BoardAutomationMetricsSettings = observer(function BoardAutomationMetricsSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [data, setData] = useState<TAutomationMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const metrics = await boardService.getAutomationMetrics(workspaceSlug, board.slug);
    setData(metrics);
    return metrics;
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (cancelled) return;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("something_went_wrong"),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carregar só ao mudar board/workspace
  }, [workspaceSlug, board.slug]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  return <AutomationMetricsPanel data={data} refreshing={refreshing} onRefresh={handleRefresh} />;
});
