import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardAutomationDeadLetter, IBoardAutomationRule } from "@operoz/types";
import { Loader } from "@operoz/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationDeadLetterPanel } from "./automation/automation-dead-letter-panel";

const boardService = new BoardService();

export const BoardAutomationDeadLettersSettings = observer(function BoardAutomationDeadLettersSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [rules, setRules] = useState<IBoardAutomationRule[]>([]);
  const [entries, setEntries] = useState<IBoardAutomationDeadLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [rulesData, dlqData] = await Promise.all([
      boardService.getAutomationRules(workspaceSlug, board.slug),
      boardService.getAutomationDeadLetters(workspaceSlug, board.slug),
    ]);
    setRules(rulesData);
    setEntries(dlqData);
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

  return (
    <AutomationDeadLetterPanel entries={entries} rules={rules} refreshing={refreshing} onRefresh={handleRefresh} />
  );
});
