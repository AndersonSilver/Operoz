import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360Client, TClient360Summary, TClient360SummaryDelta } from "@operoz/types";
import { Client360AttentionPanel } from "@/components/board/client-360/client-360-attention-panel";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import { Client360PortfolioInsights } from "@/components/board/client-360/client-360-portfolio-insights";
import { Client360Section } from "@/components/board/client-360/client-360-ui";

type Props = {
  summary: TClient360Summary;
  clients: TClient360Client[];
  basePath: string;
  onFilterChange?: (filter: Client360FilterKey) => void;
  showBoard?: boolean;
  summaryDelta?: TClient360SummaryDelta;
  showPeriodCompare?: boolean;
};

export function Client360CommandCenter({
  summary,
  clients,
  basePath,
  onFilterChange,
  showBoard,
  summaryDelta,
  showPeriodCompare = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <Client360Section
      icon={LayoutDashboard}
      iconTone="accent"
      title={t("boards.client_360.command_center_title")}
      description={t("boards.client_360.command_center_subtitle")}
      noPadding
    >
      <Client360PortfolioInsights
        summary={summary}
        clients={clients}
        onFilterChange={onFilterChange}
        summaryDelta={summaryDelta}
        showPeriodCompare={showPeriodCompare}
      />
      <Client360AttentionPanel
        clients={clients}
        basePath={basePath}
        onFilterChange={onFilterChange}
        showBoard={showBoard}
      />
    </Client360Section>
  );
}
