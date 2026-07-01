import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import type { TTourSteps } from "./tour-steps";
import { TOUR_STEPS } from "./tour-steps";

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
  currentStepIndex: number;
  totalSteps: number;
};

export function TourSidebar({ step, setStep, currentStepIndex, totalSteps }: Props) {
  const { t } = useTranslation();

  return (
    <div className="hidden flex-col border-b border-subtle/60 bg-layer-1/40 p-5 lg:flex lg:border-r lg:border-b-0">
      <div className="space-y-1 px-1">
        <h3 className="text-14 font-semibold text-primary">{t("product_tour.sidebar.title")}</h3>
        <p className="text-12 leading-relaxed text-tertiary">{t("product_tour.sidebar.subtitle")}</p>
      </div>

      <nav className="mt-5 flex-1 space-y-0.5">
        {TOUR_STEPS.map((option, index) => {
          const isActive = step === option.key;
          const isComplete = index < currentStepIndex;
          const Icon = option.Icon;

          return (
            <button
              key={option.key}
              type="button"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-13 font-medium transition-colors",
                isActive && "bg-accent-primary/10 text-accent-primary",
                !isActive && isComplete && "text-secondary hover:bg-layer-1-hover",
                !isActive && !isComplete && "text-tertiary hover:bg-layer-1-hover hover:text-secondary"
              )}
              onClick={() => setStep(option.key)}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-10 font-semibold",
                  isActive && "bg-accent-primary text-on-color",
                  !isActive && isComplete && "bg-accent-primary/20 text-accent-primary",
                  !isActive && !isComplete && "bg-layer-2 text-placeholder"
                )}
              >
                {index + 1}
              </span>
              <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
              <span className="truncate">{t(`product_tour.nav.${option.translationKey}`)}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 px-1">
        <div className="flex justify-between text-11 text-tertiary">
          <span>{t("product_tour.welcome.progress")}</span>
          <span>
            {currentStepIndex + 1}/{totalSteps}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-layer-2">
          <div
            className="h-full rounded-full bg-accent-primary transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
