import type { LucideIcon } from "lucide-react";
import { Bot, CalendarRange, ClipboardList, Home, Kanban, ListTodo, Users } from "lucide-react";

export type TTourSteps =
  | "welcome"
  | "workspace"
  | "boards"
  | "delivery"
  | "planning"
  | "clients"
  | "status_report"
  | "assistant";

export type TTourStepTranslationKey =
  | "workspace"
  | "boards"
  | "delivery"
  | "planning"
  | "clients"
  | "status_report"
  | "assistant";

export type TTourStepConfig = {
  key: Exclude<TTourSteps, "welcome">;
  translationKey: TTourStepTranslationKey;
  Icon: LucideIcon;
  tipCount: number;
};

export const TOUR_STEPS: TTourStepConfig[] = [
  { key: "workspace", translationKey: "workspace", Icon: Home, tipCount: 4 },
  { key: "boards", translationKey: "boards", Icon: Kanban, tipCount: 4 },
  { key: "delivery", translationKey: "delivery", Icon: ListTodo, tipCount: 4 },
  { key: "planning", translationKey: "planning", Icon: CalendarRange, tipCount: 4 },
  { key: "clients", translationKey: "clients", Icon: Users, tipCount: 4 },
  { key: "status_report", translationKey: "status_report", Icon: ClipboardList, tipCount: 4 },
  { key: "assistant", translationKey: "assistant", Icon: Bot, tipCount: 4 },
];

export function getTourStepTips(t: (key: string) => string, translationKey: TTourStepTranslationKey, count: number) {
  return Array.from({ length: count }, (_, index) => t(`product_tour.steps.${translationKey}.tip_${index + 1}`)).filter(
    Boolean
  );
}
