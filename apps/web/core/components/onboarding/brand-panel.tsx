import { BarChart3, Check, Layers, Zap } from "lucide-react";
import { OperozLockup } from "@operis/propel/icons";
import type { TOnboardingStep } from "@operis/types";
import { EOnboardingSteps } from "@operis/types";
import { cn } from "@operis/utils";

const features = [
  {
    icon: Layers,
    title: "Projetos unificados",
    description: "Planeje, execute e acompanhe o trabalho em um único fluxo.",
  },
  {
    icon: Zap,
    title: "Automação inteligente",
    description: "Reduza tarefas repetitivas e ganhe velocidade nas entregas.",
  },
  {
    icon: BarChart3,
    title: "Visibilidade total",
    description: "Métricas e status em tempo real para decisões mais assertivas.",
  },
];

const STEP_LABELS: Partial<Record<TOnboardingStep, string>> = {
  [EOnboardingSteps.PROFILE_SETUP]: "Perfil",
  [EOnboardingSteps.ROLE_SETUP]: "Função",
  [EOnboardingSteps.USE_CASE_SETUP]: "Objetivo",
  [EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN]: "Workspace",
  [EOnboardingSteps.INVITE_MEMBERS]: "Equipe",
};

type Props = {
  stepOrder: TOnboardingStep[];
  currentStep: TOnboardingStep;
  currentStepNumber: number;
  totalSteps: number;
};

export function OnboardingBrandPanel({ stepOrder, currentStep, currentStepNumber, totalSteps }: Props) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <aside className="relative hidden min-h-0 w-[46%] max-w-[540px] shrink-0 flex-col justify-between overflow-hidden border-r border-subtle/50 bg-layer-1/70 p-10 lg:flex xl:p-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28] dark:opacity-[0.18]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-color-subtle) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-accent-primary/22 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-accent-primary/10 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent-primary/20 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <OperozLockup height={52} className="w-auto max-w-[300px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-10 py-8">
        <div className="space-y-3">
          <p className="text-12 font-semibold tracking-[0.2em] text-accent-primary uppercase">Operoz</p>
          <h1 className="max-w-md text-[1.9rem] leading-[1.12] font-semibold tracking-tight text-primary xl:text-[2.25rem]">
            Configure sua conta em poucos passos.
          </h1>
          <p className="text-15 max-w-sm leading-relaxed text-secondary">
            Personalize seu perfil e prepare o ambiente para sua equipe começar a trabalhar.
          </p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex gap-3.5 rounded-lg border border-subtle/40 bg-surface-1/40 px-3.5 py-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary">
                <feature.icon className="size-4" strokeWidth={1.75} />
              </span>
              <div className="space-y-0.5 pt-0.5">
                <p className="text-14 font-medium text-primary">{feature.title}</p>
                <p className="text-13 leading-relaxed text-tertiary">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 rounded-xl border border-subtle/60 bg-surface-1/50 p-4 backdrop-blur-sm">
        <p className="mb-3 text-12 font-semibold tracking-wide text-tertiary uppercase">
          Progresso · {currentStepNumber}/{totalSteps}
        </p>
        <ol className="space-y-2.5">
          {stepOrder.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-11 font-semibold transition-colors",
                    isComplete && "bg-accent-primary text-on-color",
                    isCurrent && "border-accent-primary border-2 text-accent-primary",
                    !isComplete && !isCurrent && "border border-subtle text-placeholder"
                  )}
                >
                  {isComplete ? <Check className="size-3.5" strokeWidth={2.5} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-13 font-medium transition-colors",
                    isCurrent ? "text-primary" : isComplete ? "text-secondary" : "text-tertiary"
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
