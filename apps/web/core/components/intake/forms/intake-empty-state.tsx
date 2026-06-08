import { FileText, Inbox, Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { cn } from "@operis/utils";
import "./intake-settings.css";

type Variant = "disabled" | "empty";

type Props = {
  variant: Variant;
  creating?: boolean;
  onCreate?: () => void;
};

export function IntakeEmptyState(props: Props) {
  const { variant, creating, onCreate } = props;
  const { t } = useTranslation();
  const isDisabled = variant === "disabled";

  return (
    <div className="intake-empty-state relative overflow-hidden rounded-xl border border-dashed border-subtle bg-surface-1/60 p-8">
      <div className="intake-hero-dot-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="relative text-center lg:text-left">
        <span
          className={cn(
            "mx-auto grid size-14 place-items-center rounded-2xl border lg:mx-0",
            isDisabled
              ? "border-subtle bg-layer-2 text-tertiary"
              : "border-accent-subtle/40 bg-accent-subtle/20 text-accent-primary"
          )}
        >
          {isDisabled ? (
            <Inbox className="size-6" strokeWidth={1.75} />
          ) : (
            <FileText className="size-6" strokeWidth={1.75} />
          )}
        </span>
        <h3 className="mt-5 text-18 font-semibold text-primary">
          {isDisabled
            ? t("project_settings.features.intake.forms.disabled_title")
            : t("project_settings.features.intake.forms.empty_title")}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-13 leading-relaxed text-secondary lg:mx-0">
          {isDisabled
            ? t("project_settings.features.intake.forms.enable_intake_first")
            : t("project_settings.features.intake.forms.empty")}
        </p>
        {!isDisabled && onCreate ? (
          <Button variant="primary" size="sm" className="mt-6 h-9" loading={creating} onClick={onCreate}>
            <Plus className="size-4" />
            {t("project_settings.features.intake.forms.create")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
