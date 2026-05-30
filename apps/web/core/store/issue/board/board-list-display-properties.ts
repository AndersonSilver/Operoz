import { ISSUE_DISPLAY_PROPERTIES_KEYS, SPREADSHEET_PROPERTY_LIST } from "@operis/constants";
import type { IIssueDisplayProperties } from "@operis/types";
import { getComputedDisplayProperties } from "@operis/utils";

/** Colunas visíveis por omissão na lista do board (evita tabela larga demais). */
const BOARD_LIST_DEFAULT_VISIBLE: Partial<IIssueDisplayProperties> = {
  key: true,
  state: true,
  priority: true,
  assignee: true,
  labels: true,
  modules: false,
  cycle: false,
  estimate: false,
  start_date: false,
  due_date: false,
  sub_issue_count: false,
  attachment_count: false,
  link: false,
  issue_type: false,
  created_on: false,
  updated_on: false,
};

/** Colunas visíveis na lista do board (`board_backlog.list`). */
export const resolveBoardListDisplayProperties = (
  displayProperties?: IIssueDisplayProperties
): IIssueDisplayProperties => {
  const boardDefaults = getComputedDisplayProperties({
    ...Object.fromEntries(
      (["key", ...ISSUE_DISPLAY_PROPERTIES_KEYS] as (keyof IIssueDisplayProperties)[]).map((key) => [key, false])
    ),
    ...BOARD_LIST_DEFAULT_VISIBLE,
  } as IIssueDisplayProperties);

  if (!displayProperties) return boardDefaults;

  const hasVisibleColumn = Object.values(displayProperties).some(Boolean);
  if (!hasVisibleColumn) return boardDefaults;

  return { ...boardDefaults, ...displayProperties };
};

/** Garante colunas mínimas na planilha quando todas as propriedades de tabela estão ocultas. */
export const resolveSpreadsheetDisplayProperties = (
  displayProperties?: IIssueDisplayProperties
): IIssueDisplayProperties => {
  const base = resolveBoardListDisplayProperties(displayProperties);
  const hasSpreadsheetColumn = SPREADSHEET_PROPERTY_LIST.some((key) => Boolean(base[key]));

  if (hasSpreadsheetColumn) return base;

  return {
    ...base,
    state: true,
    priority: true,
    assignee: true,
    labels: true,
    start_date: true,
    due_date: true,
  };
};
