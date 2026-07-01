import { ArrowRight, GitBranch, Link2, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import clsx from "clsx";
import { AUTOMATION_KIND_DEFAULT_ICON, AutomationCatalogIcon } from "./automation-catalog-icon";
import { AUTOMATION_KIND_THEME, type AutomationVisualKind } from "./automation-kind-theme";
import "./automation-inspector.css";

export type AutomationInspectorKind = AutomationVisualKind | "connection";

const CONNECTION_THEME = {
  accentBar: "bg-tertiary",
  iconWrap: "bg-layer-2",
  iconColor: "text-secondary",
  chip: "bg-layer-2 text-secondary",
} as const;

type Props = {
  kind: AutomationInspectorKind;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  onDelete?: () => void;
  deleteLabel?: string;
  showDeleteHint?: boolean;
};

export function AutomationInspectorShell(props: Props) {
  const { kind, title, subtitle, icon, children, onDelete, deleteLabel, showDeleteHint = true } = props;
  const { t } = useTranslation();

  const isConnection = kind === "connection";
  const theme = isConnection ? CONNECTION_THEME : AUTOMATION_KIND_THEME[kind];
  const iconName = icon ?? (isConnection ? "link" : AUTOMATION_KIND_DEFAULT_ICON[kind]);
  const kindLabel = isConnection
    ? t("boards.settings.automation.inspector.connection")
    : t(`boards.settings.automation.node_kind.${kind}`);

  return (
    <div className="automation-inspector-panel">
      <header className="automation-inspector-header">
        <span className={clsx("automation-inspector-header-accent", theme.accentBar)} aria-hidden />
        <div className="flex items-start gap-3 pl-2">
          <div className={clsx("flex size-9 shrink-0 items-center justify-center rounded-lg", theme.iconWrap)}>
            {isConnection ? (
              <Link2 className={clsx("size-4", theme.iconColor)} strokeWidth={1.75} />
            ) : kind === "decision" ? (
              <GitBranch className={clsx("size-4", theme.iconColor)} strokeWidth={1.75} />
            ) : (
              <AutomationCatalogIcon name={iconName} className={clsx("size-4", theme.iconColor)} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={clsx(
                "mb-1 inline-flex rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                theme.chip
              )}
            >
              {kindLabel}
            </span>
            <h2 className="truncate text-14 leading-tight font-semibold text-primary">{title}</h2>
            {subtitle && <p className="mt-0.5 text-11 leading-relaxed text-tertiary">{subtitle}</p>}
          </div>
        </div>
      </header>

      <div className="automation-inspector-body">{children}</div>

      {(showDeleteHint || onDelete) && (
        <footer className="automation-inspector-footer">
          {showDeleteHint && (
            <p className="mb-2.5 text-10 leading-relaxed text-placeholder">
              {t("boards.settings.automation.inspector.delete_hint")}
            </p>
          )}
          {onDelete && deleteLabel && (
            <Button
              variant="error-outline"
              size="sm"
              className="w-full"
              onClick={onDelete}
              prependIcon={<Trash2 className="size-3.5" strokeWidth={1.75} />}
            >
              {deleteLabel}
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}

export function ConfigSection(props: { title?: string; children: React.ReactNode }) {
  const { title, children } = props;
  return (
    <section className="automation-inspector-section">
      {title && <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">{title}</p>}
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function ConfigCallout(props: { children: React.ReactNode }) {
  return (
    <div className="automation-inspector-callout">
      <p className="text-11 leading-relaxed text-secondary">{props.children}</p>
    </div>
  );
}

export function ConfigLink(props: { to: string; children: React.ReactNode }) {
  const { to, children } = props;
  return (
    <Link
      to={to}
      className="mt-2 inline-flex items-center gap-1 text-11 font-medium text-accent-primary transition-colors hover:text-accent-primary/80"
    >
      {children}
      <ArrowRight className="size-3" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
