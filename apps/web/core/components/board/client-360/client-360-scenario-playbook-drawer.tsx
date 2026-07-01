import { BookOpen, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { TClient360ScenarioPlaybook } from "@operoz/types";
import { cn } from "@operoz/utils";

type Props = {
  playbook: TClient360ScenarioPlaybook | null;
  onClose: () => void;
};

export function Client360ScenarioPlaybookDrawer({ playbook, onClose }: Props) {
  const { t } = useTranslation();
  if (!playbook) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-backdrop">
      <div className="shadow-xl flex h-full w-full max-w-md flex-col border-l border-subtle bg-layer-1">
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-accent-primary" />
            <div>
              <p className="text-13 font-medium text-primary">{playbook.title}</p>
              <p className="text-11 text-tertiary">{playbook.playbook_code}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <pre className={cn("font-sans text-13 leading-relaxed whitespace-pre-wrap text-secondary")}>
            {playbook.markdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
