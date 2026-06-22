import type { LucideIcon } from "lucide-react";
import { AutomationListHero, type AutomationHighlight } from "../automation/automation-list-hero";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  createLabel?: string;
  createHint?: string;
  creating?: boolean;
  onCreate?: () => void;
  highlights?: AutomationHighlight[];
  accentClass?: string;
  gradientClass?: string;
};

export function SupportSettingsHero(props: Props) {
  const {
    icon,
    title,
    description,
    createLabel,
    createHint,
    creating,
    onCreate,
    highlights,
    accentClass = "bg-accent-subtle text-accent-primary",
    gradientClass = "from-accent-subtle/35",
  } = props;

  return (
    <AutomationListHero
      icon={icon}
      title={title}
      description={description}
      createLabel={createLabel ?? ""}
      createHint={createHint}
      creating={creating}
      onCreate={onCreate ?? (() => undefined)}
      highlights={highlights}
      accentClass={accentClass}
      gradientClass={gradientClass}
      showIllustration={false}
      showCreateAction={Boolean(createLabel && onCreate)}
    />
  );
}
