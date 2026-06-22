export type ParsedQbrMetric = {
  label: string;
  value: string;
  emphasize?: boolean;
  /** When value is "40 (critical)" from health score line */
  score?: number;
  healthStatus?: string;
};

export type ParsedQbrTrend = {
  period: string;
  score: number;
  health: string;
};

export type ParsedQbrDraft = {
  clientName: string;
  quarter: string;
  wins: string;
  risks: string;
  metrics: ParsedQbrMetric[];
  trend: ParsedQbrTrend[];
  footer: string;
};

function stripMdEmphasis(value: string): string {
  return value.replace(/\*\*/g, "").replace(/_/g, "").trim();
}

function parseTitle(line: string): { clientName: string; quarter: string } | null {
  const match = line.match(/^#\s+QBR Draft\s+—\s+(.+?)\s+\(([^)]+)\)\s*$/i);
  if (!match) return null;
  return { clientName: match[1].trim(), quarter: match[2].trim() };
}

function parseMetricLine(line: string): ParsedQbrMetric | null {
  const match = line.match(/^-\s+([^:]+):\s*(.+)$/);
  if (!match) return null;
  const label = match[1].trim();
  const rawValue = match[2].trim();
  const value = stripMdEmphasis(rawValue);
  const healthMatch = value.match(/^(\d+)\s+\(([^)]+)\)$/i);
  const isHealth = /score|saúde|saude|health/i.test(label);

  if (isHealth && healthMatch) {
    return {
      label,
      value: healthMatch[1],
      score: Number(healthMatch[1]),
      healthStatus: healthMatch[2].trim(),
      emphasize: true,
    };
  }

  return {
    label,
    value,
    emphasize: rawValue.includes("**"),
  };
}

function parseTrendLine(line: string): ParsedQbrTrend | null {
  const match = line.match(/^-\s+(\d{4}-\d{2}-\d{2}):\s+score\s+(\d+)\s+\(([^)]+)\)/i);
  if (!match) return null;
  return {
    period: match[1],
    score: Number(match[2]),
    health: match[3].trim(),
  };
}

export function parseClient360QbrDraftMarkdown(md: string): ParsedQbrDraft | null {
  const lines = (md || "").split("\n");
  let clientName = "Cliente";
  let quarter = "";
  let section: "none" | "wins" | "risks" | "metrics" | "trend" = "none";
  const wins: string[] = [];
  const risks: string[] = [];
  const metrics: ParsedQbrMetric[] = [];
  const trend: ParsedQbrTrend[] = [];
  let footer = "";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      if (section === "wins" && wins.length && wins[wins.length - 1] !== "") wins.push("");
      if (section === "risks" && risks.length && risks[risks.length - 1] !== "") risks.push("");
      continue;
    }

    if (trimmed.startsWith("# ")) {
      const title = parseTitle(trimmed);
      if (title) {
        clientName = title.clientName;
        quarter = title.quarter;
      }
      section = "none";
      continue;
    }

    if (trimmed === "## Wins") {
      section = "wins";
      continue;
    }
    if (trimmed === "## Riscos") {
      section = "risks";
      continue;
    }
    if (trimmed === "## Métricas") {
      section = "metrics";
      continue;
    }
    if (trimmed.startsWith("## Tendência")) {
      section = "trend";
      continue;
    }

    if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
      footer = trimmed.slice(1, -1).trim();
      section = "none";
      continue;
    }

    if (section === "wins") wins.push(line);
    else if (section === "risks") risks.push(line);
    else if (section === "metrics") {
      const metric = parseMetricLine(trimmed);
      if (metric) metrics.push(metric);
    } else if (section === "trend") {
      const row = parseTrendLine(trimmed);
      if (row) trend.push(row);
    }
  }

  const winsText = wins.join("\n").trim();
  const risksText = risks.join("\n").trim();

  if (!quarter && !winsText && !risksText && metrics.length === 0) return null;

  return {
    clientName,
    quarter,
    wins: winsText,
    risks: risksText,
    metrics,
    trend,
    footer: footer || "Draft gerado a partir de dados Cliente 360 — versão humana prevalece na exportação.",
  };
}

export function buildClient360QbrDraftMarkdown(parsed: ParsedQbrDraft): string {
  const lines = [
    `# QBR Draft — ${parsed.clientName} (${parsed.quarter})`,
    "",
    "## Wins",
    parsed.wins.trim() || "_Sem wins registados — preencher após revisão._",
    "",
    "## Riscos",
    parsed.risks.trim() || "_Sem riscos registados — validar com dados 360._",
    "",
    "## Métricas",
  ];

  for (const metric of parsed.metrics) {
    if (metric.score != null && metric.healthStatus) {
      lines.push(`- ${metric.label}: **${metric.score}** (${metric.healthStatus})`);
    } else {
      const value = metric.emphasize ? `**${metric.value}**` : metric.value;
      lines.push(`- ${metric.label}: ${value}`);
    }
  }

  if (parsed.trend.length > 0) {
    lines.push("", "## Tendência saúde (últimas semanas)", "");
    for (const row of parsed.trend) {
      lines.push(`- ${row.period}: score ${row.score} (${row.health})`);
    }
  }

  lines.push("", `_${parsed.footer}_`);
  return lines.join("\n");
}
