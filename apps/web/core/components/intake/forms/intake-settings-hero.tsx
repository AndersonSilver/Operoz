import { Inbox, Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import "./intake-settings.css";

type Props = {
  intakeEnabled: boolean;
  creating?: boolean;
  onCreate: () => void;
};

export function IntakeSettingsHero(props: Props) {
  const { intakeEnabled, creating, onCreate } = props;
  const { t } = useTranslation();

  return (
    <header className="intake-page-hero">
      <div className="intake-page-hero-inner">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="intake-page-hero-icon">
            <Inbox className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-11 font-semibold uppercase tracking-[0.12em] text-tertiary">Operoz</p>
            <h1 className="mt-0.5 text-20 font-semibold tracking-tight text-primary">
              {t("project_settings.features.intake.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-13 leading-relaxed text-secondary">
              {t("project_settings.features.intake.hero.tagline")}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="h-9 shrink-0 shadow-sm"
          disabled={!intakeEnabled}
          loading={creating}
          onClick={onCreate}
        >
          <Plus className="size-4" />
          {t("project_settings.features.intake.forms.create")}
        </Button>
      </div>
    </header>
  );
}
