import type { TClient360Client, TClient360Summary } from "@operis/types";

import { Client360PortfolioInsights } from "@/components/board/client-360/client-360-portfolio-insights";

type Props = {
  summary: TClient360Summary;
  clients: TClient360Client[];
};

/** Conteúdo do modal de resumo — reutiliza KPI strip e gráficos inline. */
export function Client360OverviewContent({ summary, clients }: Props) {
  return <Client360PortfolioInsights summary={summary} clients={clients} />;
}
