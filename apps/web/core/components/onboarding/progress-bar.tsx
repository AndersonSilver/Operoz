import { Tooltip } from "@operis/propel/tooltip";

type Props = {
  currentStepNumber: number;
  totalSteps: number;
};

export function OnboardingProgressBar({ currentStepNumber, totalSteps }: Props) {
  return (
    <div className="h-1 w-full shrink-0 bg-layer-1">
      <Tooltip tooltipContent={`${currentStepNumber}/${totalSteps}`} position="bottom-end">
        <div
          className="h-full bg-accent-primary transition-all duration-700 ease-out"
          style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
        />
      </Tooltip>
    </div>
  );
}
