import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import {
  dismissClient360Onboarding,
  isClient360OnboardingDismissed,
} from "@/components/board/client-360/client-360-empty-state.utils";

type Props = {
  workspaceSlug: string;
};

export function Client360OnboardingBanner({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isClient360OnboardingDismissed(workspaceSlug));
  }, [workspaceSlug]);

  if (!visible) return null;

  const handleDismiss = () => {
    dismissClient360Onboarding(workspaceSlug);
    setVisible(false);
  };

  return (
    <section className="relative mt-4 w-full rounded-lg border border-subtle bg-layer-2/70">
      <IconButton
        variant="ghost"
        size="sm"
        icon={X}
        aria-label={t("boards.client_360.onboarding_dismiss")}
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10"
      />
      <div className="flex w-full items-start gap-3 py-3 pr-10 pl-4 lg:items-center lg:py-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-subtle text-accent-primary">
          <Sparkles className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
          <h3 className="shrink-0 text-13 font-semibold text-primary">{t("boards.client_360.onboarding_title")}</h3>
          <p className="mt-1 text-13 leading-relaxed text-secondary lg:mt-0 lg:min-w-0 lg:flex-1">
            {t("boards.client_360.onboarding_body")}
          </p>
        </div>
      </div>
    </section>
  );
}
