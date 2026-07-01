import { observer } from "mobx-react";
import Link from "next/link";
import { useTranslation } from "@operoz/i18n";
import type { THomeWidgetProps } from "@operoz/types";
import { WidgetSection } from "../shared/widget-section";

const TUTORIAL_STEPS = [
  "home.quick_tutorial.steps.create_project",
  "home.quick_tutorial.steps.create_work_item",
  "home.quick_tutorial.steps.invite_team",
  "home.quick_tutorial.steps.use_views",
];

export const QuickTutorialWidget = observer(function QuickTutorialWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();

  return (
    <WidgetSection
      title={t("home.quick_tutorial.title")}
      action={
        <Link
          href="https://docs.plane.so/core-concepts/projects/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-13 font-medium text-accent-primary hover:text-accent-secondary"
        >
          {t("home.quick_tutorial.docs")}
        </Link>
      }
    >
      <ol className="flex flex-col gap-2">
        {TUTORIAL_STEPS.map((stepKey, index) => (
          <li
            key={stepKey}
            className="flex items-start gap-3 rounded-lg border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-primary/10 text-11 font-semibold text-accent-primary">
              {index + 1}
            </span>
            <span>{t(stepKey)}</span>
          </li>
        ))}
      </ol>
      <Link
        href={`/${workspaceSlug}/settings`}
        className="mt-3 inline-block text-13 font-medium text-accent-primary hover:text-accent-secondary"
      >
        {t("home.quick_tutorial.workspace_settings")}
      </Link>
    </WidgetSection>
  );
});
