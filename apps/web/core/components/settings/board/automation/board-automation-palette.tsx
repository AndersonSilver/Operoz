import { useTranslation } from "@operoz/i18n";
import type { TAutomationCatalog, TAutomationCatalogItem } from "@operoz/types";
import clsx from "clsx";
import { AutomationCatalogIcon } from "./automation-catalog-icon";
import { AUTOMATION_KIND_THEME, type AutomationVisualKind } from "./automation-kind-theme";

type Props = {
  catalog: TAutomationCatalog;
  onAdd: (item: TAutomationCatalogItem, kind: "trigger" | "filter" | "action") => void;
  onAddDecision: (catalogKey?: string) => void;
  onAddParallel: (item: TAutomationCatalogItem) => void;
};

function PaletteItem(props: { item: TAutomationCatalogItem; kind: AutomationVisualKind; onClick: () => void }) {
  const { item, kind, onClick } = props;
  const theme = AUTOMATION_KIND_THEME[kind];

  return (
    <button
      type="button"
      className={clsx(
        "group flex w-full items-start gap-2.5 rounded-lg border border-subtle bg-layer-1 px-2.5 py-2 text-left transition-colors",
        "hover:border-strong hover:bg-layer-1-hover"
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          theme.iconWrap,
          "group-hover:brightness-105"
        )}
      >
        <AutomationCatalogIcon name={item.icon} className={clsx("size-4", theme.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-13 leading-tight font-medium text-primary">{item.label}</p>
        <p className="mt-0.5 line-clamp-2 text-11 leading-snug text-tertiary">{item.description}</p>
      </div>
    </button>
  );
}

function PaletteGroup(props: {
  title: string;
  kind: "trigger" | "filter" | "action";
  items: TAutomationCatalogItem[];
  onAdd: Props["onAdd"];
}) {
  const { title, kind, items, onAdd } = props;
  const theme = AUTOMATION_KIND_THEME[kind];
  if (!items.length) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <span className={clsx("size-1.5 shrink-0 rounded-full", theme.dot)} aria-hidden />
        <p className="text-11 font-semibold text-secondary">{title}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <PaletteItem key={item.key} item={item} kind={kind} onClick={() => onAdd(item, kind)} />
        ))}
      </div>
    </section>
  );
}

export function BoardAutomationPalette(props: Props) {
  const { catalog, onAdd, onAddDecision, onAddParallel } = props;
  const { t } = useTranslation();
  const decisionItems = catalog.decisions ?? [];
  const decisionTheme = AUTOMATION_KIND_THEME.decision;

  return (
    <div className="h-full min-h-0 overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
      <PaletteGroup
        title={t("boards.settings.automation.palette.triggers")}
        kind="trigger"
        items={catalog.triggers ?? []}
        onAdd={onAdd}
      />
      <PaletteGroup
        title={t("boards.settings.automation.palette.filters")}
        kind="filter"
        items={catalog.filters ?? []}
        onAdd={onAdd}
      />
      <section className="mb-5">
        <div className="mb-2 flex items-center gap-1.5 px-0.5">
          <span className={clsx("size-1.5 shrink-0 rounded-full", decisionTheme.dot)} aria-hidden />
          <p className="text-11 font-semibold text-secondary">
            {t("boards.settings.automation.decision.palette_title")}
          </p>
        </div>
        {(decisionItems.length
          ? decisionItems
          : [
              {
                key: "decision.switch",
                label: t("boards.settings.automation.decision.title"),
                description: t("boards.settings.automation.decision.lead"),
                icon: "git-branch",
                config_schema: {},
                output_schema: {},
              },
            ]
        ).map((item) => (
          <PaletteItem key={item.key} item={item} kind="decision" onClick={() => onAddDecision(item.key)} />
        ))}
      </section>
      <section className="mb-5">
        <div className="mb-2 flex items-center gap-1.5 px-0.5">
          <span className="size-1.5 shrink-0 rounded-full bg-[var(--extended-color-cyan-500)]" aria-hidden />
          <p className="text-11 font-semibold text-secondary">
            {t("boards.settings.automation.parallel.palette_title")}
          </p>
        </div>
        {(catalog.parallel ?? []).map((item) => (
          <PaletteItem key={item.key} item={item} kind="action" onClick={() => onAddParallel(item)} />
        ))}
      </section>
      <PaletteGroup
        title={t("boards.settings.automation.palette.actions")}
        kind="action"
        items={catalog.actions ?? []}
        onAdd={onAdd}
      />
    </div>
  );
}
