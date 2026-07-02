import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { DEFAULT_LOCALE, useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IWorkspaceMemberInvitation, TOnboardingStep, TOnboardingSteps, TUserProfile } from "@operoz/types";
import { EOnboardingSteps } from "@operoz/types";
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { OnboardingBrandPanel } from "./brand-panel";
import { OnboardingHeader } from "./header";
import { OnboardingProgressBar } from "./progress-bar";
import { OnboardingStepRoot } from "./steps";

type Props = {
  invitations?: IWorkspaceMemberInvitation[];
};

export const OnboardingRoot = observer(function OnboardingRoot({ invitations = [] }: Props) {
  const [currentStep, setCurrentStep] = useState<TOnboardingStep>(EOnboardingSteps.PROFILE_SETUP);
  const { changeLanguage } = useTranslation();
  const { data: user } = useUser();
  const { data: userProfile, updateUserProfile, finishUserOnboarding } = useUserProfile();
  const { workspaces } = useWorkspace();
  const { config: instanceConfig } = useInstance();

  const workspacesList = Object.values(workspaces ?? {});
  const isSelfManaged = instanceConfig?.is_self_managed;
  const hasInvitations = invitations.length > 0;

  const stepOrder: TOnboardingStep[] = useMemo(() => {
    const showInviteStep = !hasInvitations || currentStep === EOnboardingSteps.INVITE_MEMBERS;
    return [
      EOnboardingSteps.PROFILE_SETUP,
      ...(isSelfManaged ? [] : [EOnboardingSteps.ROLE_SETUP, EOnboardingSteps.USE_CASE_SETUP]),
      EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN,
      ...(showInviteStep ? [EOnboardingSteps.INVITE_MEMBERS] : []),
    ];
  }, [currentStep, hasInvitations, isSelfManaged]);

  const currentStepNumber = stepOrder.indexOf(currentStep) + 1;
  const totalSteps = stepOrder.length;

  useEffect(() => {
    if (!user?.id) return;

    const profileLanguage = userProfile?.language;
    if (!profileLanguage) {
      changeLanguage(DEFAULT_LOCALE);
      void updateUserProfile({ language: DEFAULT_LOCALE });
    }
  }, [user?.id, userProfile?.language, changeLanguage, updateUserProfile]);

  const finishOnboarding = useCallback(async () => {
    if (!user) return;
    try {
      await finishUserOnboarding();
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed",
        message: "Failed to finish onboarding, Please try again later.",
      });
    }
  }, [user, finishUserOnboarding]);

  const stepChange = useCallback(
    async (steps: Partial<TOnboardingSteps>) => {
      if (!user) return;

      const payload: Partial<TUserProfile> = {
        onboarding_step: {
          ...userProfile.onboarding_step,
          ...steps,
        },
      };

      await updateUserProfile(payload);
    },
    [user, userProfile, updateUserProfile]
  );

  const handleStepChange = useCallback(
    (step: EOnboardingSteps, skipInvites?: boolean) => {
      switch (step) {
        case EOnboardingSteps.PROFILE_SETUP:
          if (isSelfManaged) {
            stepChange({ profile_complete: true });
            if (workspacesList.length > 0) finishOnboarding();
            else setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
          } else {
            setCurrentStep(EOnboardingSteps.ROLE_SETUP);
          }
          break;
        case EOnboardingSteps.ROLE_SETUP:
          setCurrentStep(EOnboardingSteps.USE_CASE_SETUP);
          break;
        case EOnboardingSteps.USE_CASE_SETUP:
          stepChange({ profile_complete: true });
          if (workspacesList.length > 0) finishOnboarding();
          else setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
          break;
        case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
          if (skipInvites) finishOnboarding();
          else {
            setCurrentStep(EOnboardingSteps.INVITE_MEMBERS);
            stepChange({ workspace_create: true });
          }
          break;
        case EOnboardingSteps.INVITE_MEMBERS:
          stepChange({ workspace_invite: true });
          finishOnboarding();
          break;
      }
    },
    [stepChange, finishOnboarding, workspacesList, isSelfManaged]
  );

  const updateCurrentStep = (step: EOnboardingSteps) => setCurrentStep(step);

  useEffect(() => {
    const handleInitialStep = () => {
      if (
        userProfile?.onboarding_step?.profile_complete &&
        !userProfile?.onboarding_step?.workspace_create &&
        !userProfile?.onboarding_step?.workspace_join
      ) {
        setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
      }
      if (
        userProfile?.onboarding_step?.profile_complete &&
        userProfile?.onboarding_step?.workspace_create &&
        !userProfile?.onboarding_step?.workspace_invite
      ) {
        setCurrentStep(EOnboardingSteps.INVITE_MEMBERS);
      }
    };

    handleInitialStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface-1">
      <OnboardingProgressBar currentStepNumber={currentStepNumber} totalSteps={totalSteps} />

      <div className="flex min-h-0 flex-1">
        <OnboardingBrandPanel
          stepOrder={stepOrder}
          currentStep={currentStep}
          currentStepNumber={currentStepNumber}
          totalSteps={totalSteps}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-surface-1 via-surface-1 to-layer-1/40">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1] dark:opacity-[0.06]"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-color-subtle) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            className="pointer-events-none absolute top-[12%] right-[8%] h-[min(45vh,380px)] w-[min(50vw,420px)] rounded-full bg-accent-primary/[0.07] blur-[100px] dark:bg-accent-primary/[0.11]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <OnboardingHeader
              currentStep={currentStep}
              updateCurrentStep={updateCurrentStep}
              isSelfManaged={!!isSelfManaged}
              currentStepNumber={currentStepNumber}
              totalSteps={totalSteps}
            />
            <OnboardingStepRoot
              currentStep={currentStep}
              invitations={invitations}
              handleStepChange={handleStepChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
