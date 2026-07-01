import { Briefcase, Wrench } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Tooltip } from "@operoz/propel/tooltip";
import type { Client360Persona } from "@/components/board/client-360/use-client-360-persona";

type Props = {
  persona: Client360Persona;
  onChange: (persona: Client360Persona) => void;
};

export function Client360PersonaToggle({ persona, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-subtle bg-layer-2 p-0.5"
      role="group"
      aria-label={t("boards.client_360.persona_label")}
    >
      <Tooltip tooltipContent={t("boards.client_360.persona_management_tooltip")}>
        <Button
          variant={persona === "management" ? "primary" : "ghost"}
          size="sm"
          className="h-7 gap-1 px-2 text-12"
          onClick={() => onChange("management")}
          aria-pressed={persona === "management"}
        >
          <Briefcase className="size-3.5" />
          {t("boards.client_360.persona_management")}
        </Button>
      </Tooltip>
      <Tooltip tooltipContent={t("boards.client_360.persona_pm_tooltip")}>
        <Button
          variant={persona === "pm" ? "primary" : "ghost"}
          size="sm"
          className="h-7 gap-1 px-2 text-12"
          onClick={() => onChange("pm")}
          aria-pressed={persona === "pm"}
        >
          <Wrench className="size-3.5" />
          {t("boards.client_360.persona_pm")}
        </Button>
      </Tooltip>
    </div>
  );
}
