import { useState } from "react";
import { observer } from "mobx-react";
import { ArrowRight, BarChart3, Check, Clock, Layers } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { CloseIcon, OperozLockup } from "@operis/propel/icons";
import { cn, getFileURL } from "@operis/utils";
import { useUser } from "@/hooks/store/user";
import { TourSidebar } from "./sidebar";
import { getTourStepTips, TOUR_STEPS, type TTourSteps } from "./tour-steps";

export type TOnboardingTourProps = {
  onComplete: () => void;
};

const WELCOME_HIGHLIGHTS = [
  { icon: Layers, key: "unified" as const },
  { icon: Clock, key: "guided" as const },
  { icon: BarChart3, key: "flexible" as const },
];

function TourDecor({ variant = "light" }: { variant?: "brand" | "light" }) {
  const dotColor = variant === "brand" ? "rgba(255,255,255,0.35)" : "var(--border-color-subtle)";

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          variant === "brand" ? "opacity-25" : "opacity-[0.14] dark:opacity-[0.08]"
        )}
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-accent-primary/20 blur-[80px]"
        aria-hidden="true"
      />
    </>
  );
}

type WelcomeProps = {
  onComplete: () => void;
  onStart: () => void;
};

function TourWelcomeModal({ onComplete, onStart }: WelcomeProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const firstName = currentUser?.first_name?.trim() || currentUser?.display_name?.split(" ")[0] || "";
  const initial = (firstName[0] || currentUser?.email?.[0] || "O").toUpperCase();

  return (
    <div className="relative mx-4 w-full max-w-[52rem] overflow-hidden rounded-2xl border border-subtle bg-surface-1 shadow-overlay-200">
      <button
        type="button"
        className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full border border-subtle bg-surface-1/90 text-primary backdrop-blur-sm transition-colors hover:bg-layer-1-hover"
        onClick={onComplete}
        aria-label="Close"
      >
        <CloseIcon className="size-3.5" />
      </button>

      <div className="grid min-h-[min(88vh,520px)] grid-cols-1 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <aside className="relative flex flex-col justify-between overflow-hidden border-b border-subtle/60 bg-layer-1/70 p-8 md:border-r md:border-b-0 md:p-10">
          <TourDecor />

          <div className="relative z-10">
            <OperozLockup height={48} className="w-auto max-w-[240px]" />
          </div>

          <div className="relative z-10 space-y-6 py-8">
            <p className="max-w-xs text-[1.65rem] leading-[1.15] font-semibold tracking-tight text-primary">
              {t("product_tour.welcome.tagline")}
            </p>
            <ul className="space-y-3">
              {WELCOME_HIGHLIGHTS.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-center gap-3 text-13 text-secondary">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  {t(`product_tour.welcome.highlights.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 hidden text-12 text-tertiary md:block">© {new Date().getFullYear()} Operoz</div>
        </aside>

        <div className="relative flex flex-col justify-center p-8 md:p-10 lg:p-12">
          <div className="relative z-10 mx-auto w-full max-w-md space-y-8">
            <div className="flex items-center gap-4">
              <div className="border-accent-primary/25 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-layer-1 text-body-sm-semibold text-secondary">
                {currentUser?.avatar_url ? (
                  <img src={getFileURL(currentUser.avatar_url)} alt={firstName} className="size-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-12 font-semibold tracking-[0.14em] text-accent-primary uppercase">
                  {t("product_tour.welcome.eyebrow")}
                </p>
                <h2 className="truncate text-h4-semibold tracking-tight text-primary">
                  {t("product_tour.welcome.title", {
                    firstName: firstName || t("product_tour.welcome.title_fallback"),
                  })}
                </h2>
              </div>
            </div>

            <p className="text-body-md-regular leading-relaxed text-secondary">
              {t("product_tour.welcome.description")}
            </p>

            <div className="space-y-3">
              <Button variant="primary" size="xl" className="w-full gap-2" onClick={onStart}>
                {t("product_tour.welcome.start")}
                <ArrowRight className="size-4" />
              </Button>
              <button
                type="button"
                className="w-full py-1 text-center text-13 text-tertiary transition-colors hover:text-secondary"
                onClick={onComplete}
              >
                {t("product_tour.welcome.skip")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TourRoot = observer(function TourRoot(props: TOnboardingTourProps) {
  const { onComplete } = props;
  const { t } = useTranslation();
  const [step, setStep] = useState<TTourSteps>("welcome");

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  if (step === "welcome") {
    return <TourWelcomeModal onComplete={onComplete} onStart={() => setStep(TOUR_STEPS[0].key)} />;
  }

  if (!currentStep) return null;

  const StepIcon = currentStep.Icon;
  const tips = getTourStepTips(t, currentStep.translationKey, currentStep.tipCount);
  const prevStep = currentStepIndex > 0 ? TOUR_STEPS[currentStepIndex - 1].key : undefined;
  const nextStep = !isLastStep ? TOUR_STEPS[currentStepIndex + 1].key : undefined;

  return (
    <div className="relative mx-4 grid h-[min(88vh,640px)] w-full max-w-3xl grid-cols-1 overflow-hidden rounded-2xl border border-subtle bg-surface-1 shadow-overlay-200 lg:max-w-4xl lg:grid-cols-[240px_minmax(0,1fr)]">
      <button
        type="button"
        className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full border border-subtle bg-surface-1/90 text-primary backdrop-blur-sm transition-colors hover:bg-layer-1-hover"
        onClick={onComplete}
        aria-label="Close"
      >
        <CloseIcon className="size-3.5" />
      </button>

      <TourSidebar step={step} setStep={setStep} currentStepIndex={currentStepIndex} totalSteps={TOUR_STEPS.length} />

      <div className="flex min-h-0 flex-col overflow-y-auto p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-5">
          <div className="ring-accent-primary/20 relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 text-accent-primary ring-1">
            <TourDecor variant="brand" />
            <StepIcon className="relative z-10 size-7" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-2 pt-1">
            <span className="inline-flex rounded-full bg-accent-primary/10 px-2.5 py-0.5 text-11 font-semibold text-accent-primary">
              {currentStepIndex + 1} / {TOUR_STEPS.length}
            </span>
            <h3 className="text-h4-semibold tracking-tight text-primary">
              {t(`product_tour.steps.${currentStep.translationKey}.title`)}
            </h3>
            <p className="text-body-md-regular leading-relaxed text-secondary">
              {t(`product_tour.steps.${currentStep.translationKey}.description`)}
            </p>
          </div>
        </div>

        <ul className="mb-8 space-y-2.5 rounded-xl border border-subtle/80 bg-layer-1/40 p-4 sm:p-5">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-3 text-13 leading-relaxed text-secondary">
              <Check className="mt-0.5 size-4 shrink-0 text-accent-primary" strokeWidth={2.5} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-subtle/60 pt-6">
          {prevStep && (
            <Button variant="secondary" onClick={() => setStep(prevStep)}>
              {t("product_tour.actions.back")}
            </Button>
          )}
          {nextStep && (
            <Button variant="primary" className="gap-2" onClick={() => setStep(nextStep)}>
              {t("product_tour.actions.next")}
              <ArrowRight className="size-4" />
            </Button>
          )}
          {isLastStep && (
            <Button variant="primary" className="ml-auto gap-2" onClick={onComplete}>
              {t("product_tour.actions.finish")}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
