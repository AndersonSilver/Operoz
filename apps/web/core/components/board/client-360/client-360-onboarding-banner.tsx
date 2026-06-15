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
    <section className="rounded-md border border-accent-subtle bg-accent-subtle/20 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm border border-accent-subtle bg-layer-1">
          <Sparkles className="size-4 text-accent-primary" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-13 font-semibold text-primary">{t("boards.client_360.onboarding_title")}</h3>
          <p className="mt-1 text-13 leading-relaxed text-secondary">{t("boards.client_360.onboarding_body")}</p>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          icon={X}
          aria-label={t("boards.client_360.onboarding_dismiss")}
          onClick={handleDismiss}
          className="shrink-0"
        />
      </div>
    </section>
  );
}
