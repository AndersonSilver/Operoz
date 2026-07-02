import { HourglassSpinner } from "@/components/common/hourglass-spinner";

export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <HourglassSpinner size={36} className="text-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
