import { useTranslation } from "@operoz/i18n";
import type { TClient360ConsultantHeatmap } from "@operoz/types";
import { cn } from "@operoz/utils";

type Props = {
  data: TClient360ConsultantHeatmap;
  embedded?: boolean;
};

function heatClass(hours: number): string {
  if (hours <= 0) return "bg-layer-2 text-tertiary";
  if (hours > 40) return "bg-danger-subtle text-danger-secondary";
  if (hours > 24) return "bg-warning-subtle text-warning-primary";
  return "bg-success-subtle/50 text-success-primary";
}

export function Client360ConsultantHeatmap({ data, embedded = false }: Props) {
  const { t } = useTranslation();

  if (!data.consultants.length || !data.projects.length) {
    return <p className="text-13 text-tertiary">{t("boards.client_360.finops_heatmap_empty")}</p>;
  }

  return (
    <div className={cn(!embedded && "mt-0")}>
      {!embedded ? (
        <h4 className="mb-2 text-13 font-semibold text-primary">{t("boards.client_360.finops_heatmap_title")}</h4>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-subtle/80">
        <table className="min-w-full text-left text-12">
          <thead>
            <tr className="border-b border-subtle bg-layer-2/40 text-11 tracking-wide text-tertiary uppercase">
              <th className="sticky left-0 z-[1] bg-layer-2/95 px-3 py-2.5 backdrop-blur-sm">
                {t("boards.client_360.finops_heatmap_consultant")}
              </th>
              {data.projects.map((p) => (
                <th key={p.id} className="px-3 py-2.5 text-center font-medium">
                  {p.identifier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {data.consultants.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-layer-2/30">
                <td className="sticky left-0 z-[1] bg-layer-1 px-3 py-2.5 font-medium whitespace-nowrap text-secondary">
                  {c.display_name}
                </td>
                {data.projects.map((p) => {
                  const hours = data.cells[c.id]?.[p.id] ?? 0;
                  return (
                    <td key={p.id} className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-flex min-w-[2.75rem] justify-center rounded-md px-2 py-1 text-11 font-semibold tabular-nums",
                          heatClass(hours)
                        )}
                        title={t("boards.client_360.finops_heatmap_hours", { hours })}
                      >
                        {hours > 0 ? hours : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
