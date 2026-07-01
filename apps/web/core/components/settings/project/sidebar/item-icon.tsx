import type { LucideIcon } from "lucide-react";
import { LifeBuoy, Users, Zap } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@operoz/propel/icons";
import {
  CycleIcon,
  EstimatePropertyIcon,
  IntakeIcon,
  LabelPropertyIcon,
  ModuleIcon,
  PageIcon,
  StatePropertyIcon,
  ViewsIcon,
} from "@operoz/propel/icons";
import type { TProjectSettingsTabs } from "@operoz/types";
// components
import { SettingIcon } from "@/components/icons/attachment";

export const PROJECT_SETTINGS_ICONS: Record<TProjectSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: SettingIcon,
  members: Users,
  features_cycles: CycleIcon,
  features_modules: ModuleIcon,
  features_views: ViewsIcon,
  features_pages: PageIcon,
  features_intake: IntakeIcon,
  features_support: LifeBuoy,
  states: StatePropertyIcon,
  labels: LabelPropertyIcon,
  estimates: EstimatePropertyIcon,
  automations: Zap,
};
