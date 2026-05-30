/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TClient360Client } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";
import {
  client360SortStatesEqual,
  getClient360SortOptionsForColumn,
  type Client360SortColumn,
  type Client360SortState,
} from "@/components/board/client-360/client-360-client-sort";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import {
  Client360ClientPeople,
  Client360MetaChip,
  Client360ReportProgress,
} from "@/components/board/client-360/client-360-ui";
import { reportCoverageLabelKey } from "@/components/board/client-360/client-360-utils";
import type { Client360ViewMode } from "@/components/board/client-360/client-360-view-toggle";

type Props = {
  view: Client360ViewMode;
  clients: TClient360Client[];
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
};

export function Client360ClientsView({ view, clients, basePath, sort, onSortChange }: Props) {
  const { t } = useTranslation();

  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {clients.map((client) => (
          <ClientGridCard
            key={client.project_id}
            client={client}
            href={`${basePath}/${client.project_id}`}
            t={t}
          />
        ))}
      </div>
    );
  }

  if (view === "table") {
    return <ClientsTable clients={clients} basePath={basePath} sort={sort} onSortChange={onSortChange} t={t} />;
  }

  return (
    <ul className="divide-y divide-subtle">
      {clients.map((client) => (
        <ClientListRow
          key={client.project_id}
          client={client}
          href={`${basePath}/${client.project_id}`}
          t={t}
        />
      ))}
    </ul>
  );
}

function ClientsTable({
  clients,
  basePath,
  sort,
  onSortChange,
  t,
}: {
  clients: TClient360Client[];
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed text-left text-13">
        <colgroup>
          <col className="w-[26%]" />
          <col className="w-[11%]" />
          <col className="w-[14%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="hidden lg:table-column lg:w-[13%]" />
          <col className="hidden lg:table-column lg:w-[13%]" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-subtle bg-layer-2 text-11 font-medium uppercase tracking-wide text-tertiary">
            <Client360SortableTh
              column="name"
              sort={sort}
              onSort={onSortChange}
              className="px-4 py-2.5"
              t={t}
            >
              {t("boards.client_360.col_client")}
            </Client360SortableTh>
            <Client360SortableTh column="health" sort={sort} onSort={onSortChange} className="px-3 py-2.5" t={t}>
              {t("boards.client_360.col_health")}
            </Client360SortableTh>
            <Client360SortableTh column="report" sort={sort} onSort={onSortChange} className="px-3 py-2.5" t={t}>
              {t("boards.client_360.col_report")}
            </Client360SortableTh>
            <Client360SortableTh
              column="overdue"
              sort={sort}
              onSort={onSortChange}
              className="px-3 py-2.5"
              align="center"
              t={t}
            >
              {t("boards.client_360.col_overdue")}
            </Client360SortableTh>
            <Client360SortableTh
              column="support"
              sort={sort}
              onSort={onSortChange}
              className="px-3 py-2.5"
              align="center"
              t={t}
            >
              {t("boards.client_360.col_support")}
            </Client360SortableTh>
            <Client360SortableTh
              column="stakeholder"
              sort={sort}
              onSort={onSortChange}
              className="hidden px-3 py-2.5 lg:table-cell"
              t={t}
            >
              {t("boards.client_360.col_stakeholder")}
            </Client360SortableTh>
            <Client360SortableTh
              column="responsible"
              sort={sort}
              onSort={onSortChange}
              className="hidden px-3 py-2.5 lg:table-cell"
              t={t}
            >
              {t("boards.client_360.col_responsible")}
            </Client360SortableTh>
            <th className="px-2 py-2.5" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {clients.map((client) => (
            <ClientTableRow
              key={client.project_id}
              client={client}
              href={`${basePath}/${client.project_id}`}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Client360SortableTh({
  column,
  sort,
  onSort,
  children,
  className,
  align = "left",
  t,
}: {
  column: Client360SortColumn;
  sort: Client360SortState;
  onSort: (sort: Client360SortState) => void;
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const active = sort.column === column;
  const SortIcon = sort.direction === "asc" ? ArrowUp : ArrowDown;
  const options = getClient360SortOptionsForColumn(column);

  return (
    <th className={className}>
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-0.5",
          align === "right" && "ml-auto",
          align === "center" && "mx-auto"
        )}
      >
        <span className={cn("truncate", active ? "text-primary" : "text-tertiary")}>{children}</span>
        <CustomMenu
          placement="bottom-start"
          closeOnSelect
          menuItemsClassName="min-w-[200px]"
          customButton={
            <button
              type="button"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-xs transition-colors hover:bg-layer-transparent-hover hover:text-secondary",
                active ? "text-primary" : "text-tertiary"
              )}
              aria-label={t("boards.client_360.sort_menu_label")}
            >
              {active ? (
                <SortIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              )}
            </button>
          }
        >
          {options.map((option) => {
            const selected = client360SortStatesEqual(sort, option.state);
            return (
              <CustomMenu.MenuItem
                key={`${option.state.direction}-${option.state.mode ?? "default"}`}
                className="flex items-center gap-2 text-13 normal-case tracking-normal"
                onClick={() => onSort(option.state)}
              >
                <span className={cn("min-w-0 flex-1", selected && "font-medium text-primary")}>
                  {t(option.labelKey)}
                </span>
                {selected ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
              </CustomMenu.MenuItem>
            );
          })}
        </CustomMenu>
      </div>
    </th>
  );
}

function ClientTableRow({
  client,
  href,
  t,
}: {
  client: TClient360Client;
  href: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const navigate = useBoardHubNavigate();
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-layer-transparent-hover"
      onClick={() => navigate(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(href);
        }
      }}
      tabIndex={0}
      role="link"
    >
      <td className="px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2">
            <Logo logo={client.logo_props} size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-primary">{client.name}</p>
            <p className="truncate font-mono text-11 text-tertiary">{client.identifier}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <Client360HealthBadge health={client.health} />
      </td>
      <td className="px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-12 text-secondary">{t(reportKey)}</p>
          {modules_total > 0 ? (
            <p className="mt-0.5 font-mono text-11 text-tertiary">
              {modules_published}/{modules_total}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums">
        {client.issues.overdue > 0 ? (
          <span className="inline-flex items-center justify-center gap-1 text-danger-primary">
            <Clock className="size-3.5" strokeWidth={1.75} />
            {client.issues.overdue}
          </span>
        ) : (
          <span className="text-tertiary">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums">
        {client.support.open_count > 0 ? (
          <span className="inline-flex items-center justify-center gap-1 text-accent-primary">
            <Headphones className="size-3.5" strokeWidth={1.75} />
            {client.support.open_count}
          </span>
        ) : (
          <span className="text-tertiary">—</span>
        )}
      </td>
      <td className="hidden truncate px-3 py-2.5 text-12 text-secondary lg:table-cell">
        {client.responsible_stakeholder || "—"}
      </td>
      <td className="hidden truncate px-3 py-2.5 text-12 text-secondary lg:table-cell">
        {client.project_lead?.display_name || "—"}
      </td>
      <td className="px-2 py-2.5">
        <ChevronRight className="size-4 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
      </td>
    </tr>
  );
}

function ClientGridCard({
  client,
  href,
  t,
}: {
  client: TClient360Client;
  href: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;

  return (
    <BoardHubNavLink
      to={href}
      className="group flex h-full flex-col rounded-md border border-subtle bg-layer-1 p-3 text-left transition-colors hover:border-strong hover:bg-layer-transparent-hover"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2">
          <Logo logo={client.logo_props} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-13 font-semibold leading-snug text-primary">{client.name}</p>
          <p className="mt-0.5 truncate font-mono text-10 text-tertiary">{client.identifier}</p>
        </div>
      </div>
      <div className="mt-2.5">
        <Client360HealthBadge health={client.health} />
      </div>
      {modules_total > 0 && (
        <div className="mt-3">
          <Client360ReportProgress
            published={modules_published}
            total={modules_total}
            label={t(reportKey)}
          />
        </div>
      )}
      <Client360ClientPeople
        className="mt-2.5"
        compact
        stakeholder={client.responsible_stakeholder}
        responsibleName={client.project_lead?.display_name}
        stakeholderLabel={t("boards.client_360.stakeholder")}
        responsibleLabel={t("boards.client_360.responsible")}
      />
      <div className="mt-3 flex flex-wrap gap-2 border-t border-subtle pt-2.5">
        {modules_total === 0 && (
          <Client360MetaChip icon={FileText} tone="info">
            {t(reportKey)}
          </Client360MetaChip>
        )}
        {client.issues.overdue > 0 && (
          <Client360MetaChip icon={Clock} tone="danger">
            {client.issues.overdue}
          </Client360MetaChip>
        )}
        {client.support.open_count > 0 && (
          <Client360MetaChip icon={Headphones} tone="info">
            {client.support.open_count}
          </Client360MetaChip>
        )}
      </div>
    </BoardHubNavLink>
  );
}

function ClientListRow({
  client,
  href,
  t,
}: {
  client: TClient360Client;
  href: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;

  return (
    <li>
      <BoardHubNavLink
        to={href}
        className="group flex items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-layer-transparent-hover"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2">
          <Logo logo={client.logo_props} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-13 font-semibold text-primary">{client.name}</p>
            <Client360HealthBadge health={client.health} />
          </div>
          <p className="mt-0.5 font-mono text-11 text-tertiary">{client.identifier}</p>
          <Client360ClientPeople
            className="mt-1.5"
            compact
            stakeholder={client.responsible_stakeholder}
            responsibleName={client.project_lead?.display_name}
            stakeholderLabel={t("boards.client_360.stakeholder")}
            responsibleLabel={t("boards.client_360.responsible")}
          />
          {modules_total > 0 && (
            <Client360ReportProgress
              published={modules_published}
              total={modules_total}
              label={t(reportKey)}
            />
          )}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {modules_total === 0 && (
              <Client360MetaChip icon={FileText} tone="info">
                {t(reportKey)}
              </Client360MetaChip>
            )}
            {client.issues.overdue > 0 && (
              <Client360MetaChip icon={Clock} tone="danger">
                {t("boards.client_360.overdue_count", { count: client.issues.overdue })}
              </Client360MetaChip>
            )}
            {client.support.open_count > 0 && (
              <Client360MetaChip icon={Headphones} tone="info">
                {t("boards.client_360.support_count", { count: client.support.open_count })}
              </Client360MetaChip>
            )}
          </div>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-tertiary group-hover:text-secondary" strokeWidth={1.75} />
      </BoardHubNavLink>
    </li>
  );
}
