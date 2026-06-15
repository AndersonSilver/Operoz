import { observer } from "mobx-react";
import { PlaneLockup, ChevronLeftIcon } from "@operis/propel/icons";
import { EOnboardingSteps } from "@operis/types";
import { cn } from "@operis/utils";
import { useUser } from "@/hooks/store/user";
import { SwitchAccountDropdown } from "./switch-account-dropdown";

type OnboardingHeaderProps = {
  currentStep: EOnboardingSteps;
  updateCurrentStep: (step: EOnboardingSteps) => void;
  isSelfManaged: boolean;
  currentStepNumber: number;
  totalSteps: number;
};

export const OnboardingHeader = observer(function OnboardingHeader(props: OnboardingHeaderProps) {
  const { currentStep, updateCurrentStep, isSelfManaged, currentStepNumber, totalSteps } = props;
  const { data: user } = useUser();

  const handleStepBack = () => {
    switch (currentStep) {
      case EOnboardingSteps.ROLE_SETUP:
        updateCurrentStep(EOnboardingSteps.PROFILE_SETUP);
        break;
      case EOnboardingSteps.USE_CASE_SETUP:
        updateCurrentStep(EOnboardingSteps.ROLE_SETUP);
        break;
      case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
        updateCurrentStep(isSelfManaged ? EOnboardingSteps.PROFILE_SETUP : EOnboardingSteps.USE_CASE_SETUP);
        break;
    }
  };

  const canGoBack = ![EOnboardingSteps.PROFILE_SETUP, EOnboardingSteps.INVITE_MEMBERS].includes(currentStep);

  const userName = user?.display_name
    ? user?.display_name
    : user?.first_name
      ? `${user?.first_name} ${user?.last_name ?? ""}`
      : user?.email;

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-subtle/50 bg-surface-1/80 backdrop-blur-sm">
      <div className={cn("flex w-full items-center justify-between gap-6 px-6 py-4", canGoBack && "pl-4")}>
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button onClick={handleStepBack} className="cursor-pointer" type="button" disabled={!canGoBack}>
              <ChevronLeftIcon className="size-6 text-placeholder" />
            </button>
          )}
          <div className="flex flex-col gap-0.5 lg:hidden">
            <PlaneLockup height={28} className="w-auto text-primary" />
            <span className="text-12 text-tertiary">
              Passo {currentStepNumber} de {totalSteps}
            </span>
          </div>
        </div>
        <SwitchAccountDropdown fullName={userName} />
      </div>
    </div>
  );
});
