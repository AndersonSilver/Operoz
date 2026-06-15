export type SchedulePreset = "daily" | "weekly" | "monthly" | "custom";

export type ScheduleCronConfig = {
  preset: SchedulePreset;
  time: string;
  weekdays: number[];
  day_of_month: number;
  cron: string;
  timezone: string;
};

const WEEKDAY_ISO_TO_CRON: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 0,
};

export const DEFAULT_SCHEDULE_CONFIG: ScheduleCronConfig = {
  preset: "daily",
  time: "09:00",
  weekdays: [0, 1, 2, 3, 4],
  day_of_month: 1,
  cron: "0 9 * * *",
  timezone: "America/Sao_Paulo",
};

export const SCHEDULE_TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/Lisbon", label: "Lisboa" },
  { value: "Europe/London", label: "Londres" },
  { value: "America/New_York", label: "Nova York" },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, labelKey: "mon" },
  { value: 1, labelKey: "tue" },
  { value: 2, labelKey: "wed" },
  { value: 3, labelKey: "thu" },
  { value: 4, labelKey: "fri" },
  { value: 5, labelKey: "sat" },
  { value: 6, labelKey: "sun" },
] as const;

function parseTimeHm(value: string): { hour: number; minute: number } | null {
  const parts = value.trim().split(":");
  if (parts.length !== 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function cronExpressionFromConfig(config: Partial<ScheduleCronConfig>): string {
  const preset = config.preset ?? "daily";
  if (preset === "custom") {
    return (config.cron ?? "").trim();
  }

  const parsed = parseTimeHm(config.time ?? "09:00");
  if (!parsed) return "";
  const { hour, minute } = parsed;

  if (preset === "daily") {
    return `${minute} ${hour} * * *`;
  }
  if (preset === "weekly") {
    const weekdays = config.weekdays ?? [0, 1, 2, 3, 4];
    const cronDays = [...new Set(weekdays)]
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_ISO_TO_CRON[d])
      .join(",");
    return `${minute} ${hour} * * ${cronDays}`;
  }
  if (preset === "monthly") {
    const dom = config.day_of_month ?? 1;
    return `${minute} ${hour} ${dom} * *`;
  }
  return "";
}

function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") return true;
  for (const part of field.split(",")) {
    if (part.includes("/")) {
      const [base, stepStr] = part.split("/");
      const step = Number(stepStr);
      if (!step) continue;
      const start = base === "*" ? min : Number(base);
      if ((value - start) % step === 0 && value >= start) return true;
      continue;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (value >= a && value <= b) return true;
      continue;
    }
    if (Number(part) === value) return true;
  }
  return false;
}

function cronMatches(expr: string, date: Date, tz: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return false;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    minute: "numeric",
    hour: "numeric",
    day: "numeric",
    month: "numeric",
    weekday: "short",
    hour12: false,
  });
  const bits = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  const minute = Number(bits.minute);
  const hour = Number(bits.hour);
  const day = Number(bits.day);
  const month = Number(bits.month);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[String(bits.weekday)] ?? 0;

  return (
    matchesCronField(parts[0], minute, 0, 59) &&
    matchesCronField(parts[1], hour, 0, 23) &&
    matchesCronField(parts[2], day, 1, 31) &&
    matchesCronField(parts[3], month, 1, 12) &&
    matchesCronField(parts[4], weekday, 0, 6)
  );
}

export function computeNextRun(config: Partial<ScheduleCronConfig>, from: Date = new Date()): Date | null {
  const expr = cronExpressionFromConfig(config);
  const tz = config.timezone ?? "UTC";
  if (!expr) return null;

  const probe = new Date(from.getTime());
  probe.setSeconds(0, 0);
  probe.setMinutes(probe.getMinutes() + 1);

  const limit = 366 * 24 * 60;
  for (let i = 0; i < limit; i += 1) {
    if (cronMatches(expr, probe, tz)) {
      return new Date(probe.getTime());
    }
    probe.setMinutes(probe.getMinutes() + 1);
  }
  return null;
}

type DescribeLabels = {
  daily: string;
  weekly: string;
  monthly: string;
  custom: string;
  weekdays: Record<string, string>;
  at: string;
  dayOfMonth: string;
};

export function describeSchedule(config: Partial<ScheduleCronConfig>, labels: DescribeLabels): string {
  const preset = config.preset ?? "daily";
  const time = config.time ?? "09:00";

  if (preset === "daily") {
    return `${labels.daily} ${labels.at} ${time}`;
  }
  if (preset === "weekly") {
    const days = (config.weekdays ?? [])
      .sort((a, b) => a - b)
      .map((d) => labels.weekdays[WEEKDAY_OPTIONS[d]?.labelKey ?? "mon"])
      .join(", ");
    return `${labels.weekly} ${days} ${labels.at} ${time}`;
  }
  if (preset === "monthly") {
    return `${labels.monthly} ${labels.dayOfMonth.replace("{day}", String(config.day_of_month ?? 1))} ${labels.at} ${time}`;
  }
  return `${labels.custom}: ${(config.cron ?? "").trim() || "—"}`;
}

export function formatNextRun(date: Date | null, locale: string, tz: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizeScheduleConfig(raw: Record<string, unknown>): ScheduleCronConfig {
  return {
    preset: (raw.preset as SchedulePreset) ?? DEFAULT_SCHEDULE_CONFIG.preset,
    time: String(raw.time ?? DEFAULT_SCHEDULE_CONFIG.time),
    weekdays: Array.isArray(raw.weekdays) ? (raw.weekdays as number[]) : [...DEFAULT_SCHEDULE_CONFIG.weekdays],
    day_of_month: Number(raw.day_of_month ?? DEFAULT_SCHEDULE_CONFIG.day_of_month),
    cron: String(raw.cron ?? DEFAULT_SCHEDULE_CONFIG.cron),
    timezone: String(raw.timezone ?? DEFAULT_SCHEDULE_CONFIG.timezone),
  };
}
