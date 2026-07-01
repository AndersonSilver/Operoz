import { useMemo } from "react";
import { useTranslation } from "@operoz/i18n";
import type { IBoardClient360HealthSettings } from "@operoz/types";
import type { TClient360Client } from "@operoz/types";
import { cn } from "@operoz/utils";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import {
  simulateBoardHealthScores,
  weightsEqual,
  type Client360HealthSimulationRow,
} from "@/components/settings/board/client-360-health-simulation.utils";

type Props = {
  clients: TClient360Client[];
  baseline: IBoardClient360HealthSettings;
  draft: IBoardClient360HealthSettings;
  weightsValid: boolean;
};

function DeltaCell({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-tertiary">—</span>;
  const tone = delta > 0 ? "text-success-primary" : "text-danger-primary";
  const prefix = delta > 0 ? "+" : "";
  return (
    <span className={cn("font-mono text-12 font-semibold tabular-nums", tone)}>
      {prefix}
      {delta}
    </span>
  );
}

function SimulationRow({ row }: { row: Client360HealthSimulationRow }) {
  return (
    <tr className="border-t border-subtle">
      <td className="px-3 py-2.5">
        <p className="truncate text-13 font-medium text-primary">{row.name}</p>
        <p className="font-mono text-11 text-tertiary">{row.identifier}</p>
      </td>
      <td className="font-mono px-3 py-2.5 text-center text-12 text-secondary tabular-nums">{row.currentScore}</td>
      <td className="font-mono px-3 py-2.5 text-center text-12 text-primary tabular-nums">{row.simulatedScore}</td>
      <td className="px-3 py-2.5 text-center">
        <DeltaCell delta={row.delta} />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Client360HealthBadge health={row.currentHealth} />
          <span className="text-11 text-tertiary">→</span>
          <Client360HealthBadge health={row.simulatedHealth} />
        </div>
      </td>
    </tr>
  );
}

export function BoardClient360HealthPreviewPanel({ clients, baseline, draft, weightsValid }: Props) {
  const { t } = useTranslation();

  const hasWeightChanges = !weightsEqual(baseline.weights, draft.weights);
  const rows = useMemo(() => {
    if (!weightsValid || !hasWeightChanges || clients.length === 0) return [];
    return simulateBoardHealthScores(clients, draft.weights, draft.thresholds);
  }, [clients, draft.thresholds, draft.weights, hasWeightChanges, weightsValid]);

  const changedCount = rows.filter((row) => row.delta !== 0).length;
  const ragChangedCount = rows.filter((row) => row.healthChanged).length;

  return (
    <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
      <div>
        <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.preview_title")}</h3>
        <p className="mt-1 text-12 text-secondary">{t("boards.settings.client_360_health.preview_hint")}</p>
      </div>

      {!weightsValid ? (
        <p className="text-12 text-tertiary">{t("boards.settings.client_360_health.preview_weights_invalid")}</p>
      ) : !hasWeightChanges ? (
        <p className="text-12 text-tertiary">{t("boards.settings.client_360_health.preview_no_changes")}</p>
      ) : clients.length === 0 ? (
        <p className="text-12 text-tertiary">{t("boards.settings.client_360_health.preview_no_clients")}</p>
      ) : (
        <>
          <p className="text-12 text-secondary">
            {t("boards.settings.client_360_health.preview_summary", {
              changed: changedCount,
              total: rows.length,
              ragChanged: ragChangedCount,
            })}
          </p>
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-layer-2 text-11 font-medium tracking-wide text-tertiary uppercase">
                <tr>
                  <th className="px-3 py-2">{t("boards.settings.client_360_health.preview_col_client")}</th>
                  <th className="px-3 py-2 text-center">{t("boards.settings.client_360_health.preview_col_before")}</th>
                  <th className="px-3 py-2 text-center">{t("boards.settings.client_360_health.preview_col_after")}</th>
                  <th className="px-3 py-2 text-center">{t("boards.settings.client_360_health.preview_col_delta")}</th>
                  <th className="px-3 py-2 text-right">{t("boards.settings.client_360_health.preview_col_rag")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <SimulationRow key={row.projectId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
