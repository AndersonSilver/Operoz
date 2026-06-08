import { CheckCircle2, Circle, Power, Share2, Wand2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { ToggleSwitch } from "@operis/ui";
import { cn } from "@operis/utils";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";

type Props = {
  intakeEnabled: boolean;
  formCount: number;
  publishedCount: number;
  onToggle: () => void;
  layout?: "wide" | "sidebar";
  showSteps?: boolean;
};

const STEPS = [
  { key: "step_enable", icon: Power, isDone: (p: Props) => p.intakeEnabled },
  { key: "step_build", icon: Wand2, isDone: (p: Props) => p.formCount > 0 },
  { key: "step_share", icon: Share2, isDone: (p: Props) => p.publishedCount > 0 },
] as const;

export function IntakeSetupPanel(props: Props) {
  const { intakeEnabled, onToggle, layout = "wide", showSteps = true } = props;
  const { t } = useTranslation();

  const isSidebar = layout === "sidebar";

  const toggleCard = (
    <SettingsBoxedControlItem
      className={cn(
        "w-full transition-colors",
        isSidebar
          ? cn(
              "intake-setup-toggle-sidebar rounded-lg border-0 bg-surface-1 p-3",
              intakeEnabled && "bg-success-subtle/10"
            )
          : cn(
              "rounded-xl border-subtle p-4",
              intakeEnabled && "border-success-subtle/40 bg-success-subtle/5"
            )
      )}
      stacked
      title={
        <span className="flex items-center gap-2 text-13">
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              intakeEnabled ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
            )}
          >
            <Power className="size-4" strokeWidth={1.75} />
          </span>
          {t("project_settings.features.intake.toggle_title")}
        </span>
      }
      description={t("project_settings.features.intake.toggle_description")}
      control={<ToggleSwitch value={intakeEnabled} onChange={onToggle} size="sm" />}
    />
  );

  const stepsCard = showSteps ? (
    <aside
      className={cn(
        "w-full",
        isSidebar ? "intake-setup-steps-sidebar mt-3" : "rounded-xl border border-subtle bg-surface-1 p-4"
      )}
    >
      {!isSidebar ? (
        <>
          <h2 className="text-13 font-semibold text-primary">
            {t("project_settings.features.intake.setup.title")}
          </h2>
          <p className="mt-1 text-12 leading-relaxed text-tertiary">
            {t("project_settings.features.intake.setup.subtitle")}
          </p>
        </>
      ) : null}
      <ol className={cn(isSidebar ? "intake-setup-steps-list" : "mt-4 space-y-3")}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isDone = step.isDone(props);
          const StatusIcon = isDone ? CheckCircle2 : Circle;
          return (
            <li key={step.key} className={cn("flex items-start gap-3", isSidebar && "intake-setup-step")}>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg border border-subtle",
                  isDone ? "bg-success-subtle/40 text-success-primary" : "bg-layer-1 text-tertiary"
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-12 font-medium text-primary">
                  <StatusIcon
                    className={cn("size-3.5", isDone ? "text-success-primary" : "text-tertiary")}
                    strokeWidth={2}
                  />
                  {t(`project_settings.features.intake.setup.${step.key}_title`)}
                </p>
                <p className="mt-0.5 text-11 leading-relaxed text-tertiary">
                  {t(`project_settings.features.intake.setup.${step.key}_description`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  ) : null;

  if (isSidebar) {
    return (
      <div className="intake-setup-sidebar">
        {toggleCard}
        {stepsCard}
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4 lg:grid-cols-2">
      {toggleCard}
      {stepsCard}
    </div>
  );
}
