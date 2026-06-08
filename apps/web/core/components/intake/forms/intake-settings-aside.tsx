import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  Inbox,
  Link2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { IntakeSetupPanel } from "./intake-setup-panel";
import "./intake-settings.css";

type Props = {
  workspaceSlug: string;
  projectId: string;
  intakeEnabled: boolean;
  formCount: number;
  publishedCount: number;
  showSetupSteps: boolean;
  onToggle: () => void;
};

export function IntakeSettingsAside(props: Props) {
  const {
    workspaceSlug,
    projectId,
    intakeEnabled,
    formCount,
    publishedCount,
    showSetupSteps,
    onToggle,
  } = props;
  const { t } = useTranslation();
  const intakePath = `/${workspaceSlug}/projects/${projectId}/intake`;

  const flowSteps = [
    { icon: Link2, textKey: "overview_1" },
    { icon: Inbox, textKey: "overview_2" },
    { icon: GitBranch, textKey: "overview_3" },
    { icon: Zap, textKey: "overview_4" },
  ] as const;

  const tips = [
    { icon: Sparkles, textKey: "tip_fields" },
    { icon: Shield, textKey: "tip_auth" },
    { icon: GitBranch, textKey: "tip_module" },
  ] as const;

  return (
    <aside className="intake-aside-panel">
      <section className="intake-aside-section">
        <h2 className="intake-aside-heading">{t("project_settings.features.intake.aside.stats_title")}</h2>
        <dl className="intake-aside-stats">
          <div className="intake-aside-stat">
            <dt>{t("project_settings.features.intake.aside.stat_forms_label")}</dt>
            <dd>{formCount}</dd>
          </div>
          <div className="intake-aside-stat">
            <dt>{t("project_settings.features.intake.aside.stat_published_label")}</dt>
            <dd className={publishedCount > 0 ? "is-success" : undefined}>{publishedCount}</dd>
          </div>
        </dl>
        <p className="intake-aside-status">
          <span className={cn("intake-aside-status-dot", intakeEnabled && "is-active")} />
          {intakeEnabled
            ? t("project_settings.features.intake.hero.intake_active")
            : t("project_settings.features.intake.hero.intake_inactive")}
        </p>
      </section>

      <div className="intake-aside-divider" />

      <section className="intake-aside-section">
        <h2 className="intake-aside-heading">{t("project_settings.features.intake.aside.overview_title")}</h2>
        <ol className="intake-flow-list">
          {flowSteps.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.textKey} className="intake-flow-item">
                <span className="intake-flow-marker">
                  <span className="intake-flow-index">{index + 1}</span>
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </span>
                <p className="text-12 leading-relaxed text-secondary">
                  {t(`project_settings.features.intake.aside.${item.textKey}`)}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="intake-aside-divider" />

      <section className="intake-aside-section">
        <h2 className="intake-aside-heading">{t("project_settings.features.intake.aside.tips_title")}</h2>
        <ul className="intake-tips-list">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <li key={tip.textKey} className="intake-tip-item">
                <Icon className="size-3.5 shrink-0 text-accent-primary" strokeWidth={1.75} />
                <span>{t(`project_settings.features.intake.aside.${tip.textKey}`)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {intakeEnabled ? (
        <>
          <div className="intake-aside-divider" />
          <Link to={intakePath} className="intake-aside-link group">
            <span className="intake-aside-link-icon">
              <ExternalLink className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-13 font-medium text-primary group-hover:text-accent-primary">
                {t("project_settings.features.intake.aside.open_intake")}
              </span>
              <span className="mt-0.5 block text-11 text-tertiary">
                {t("project_settings.features.intake.aside.open_intake_hint")}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-accent-primary" />
          </Link>
        </>
      ) : null}

      <div className="intake-aside-divider" />

      <section className="intake-aside-section intake-aside-section-config">
        <h2 className="intake-aside-heading">{t("project_settings.features.intake.setup.panel_title")}</h2>
        <IntakeSetupPanel
          layout="sidebar"
          showSteps={showSetupSteps}
          intakeEnabled={intakeEnabled}
          formCount={formCount}
          publishedCount={publishedCount}
          onToggle={onToggle}
        />
      </section>
    </aside>
  );
}
