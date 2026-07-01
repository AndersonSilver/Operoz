import { useState } from "react";

import { Dialog } from "@headlessui/react";

import { LayoutDashboard, X } from "lucide-react";

import { useTranslation } from "@operoz/i18n";

import { IconButton } from "@operoz/propel/icon-button";

import { Tooltip } from "@operoz/propel/tooltip";

import type { TClient360Client, TClient360Summary } from "@operoz/types";

import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";

import { Client360OverviewContent } from "@/components/board/client-360/client-360-overview";

type Props = {
  summary: TClient360Summary;

  clients: TClient360Client[];

  disabled?: boolean;
};

export function Client360OverviewModalTrigger({ summary, clients, disabled }: Props) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const label = t("boards.client_360.overview_title");

  return (
    <>
      <Tooltip tooltipContent={label}>
        <span className="inline-flex">
          <IconButton
            variant="secondary"
            size="xl"
            icon={LayoutDashboard}
            aria-label={label}
            className="shrink-0 rounded-sm"
            disabled={disabled}
            onClick={() => setIsOpen(true)}
          />
        </span>
      </Tooltip>

      <ModalCore
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXL}
        className="overflow-hidden"
      >
        <div className="flex max-h-[min(85vh,720px)] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-subtle px-5 py-4">
            <div>
              <Dialog.Title className="text-16 font-semibold text-primary">{label}</Dialog.Title>

              <p className="mt-0.5 text-13 text-tertiary">{t("boards.client_360.overview_modal_subtitle")}</p>
            </div>

            <IconButton variant="ghost" size="sm" icon={X} aria-label={t("close")} onClick={() => setIsOpen(false)} />
          </div>

          <div className="min-h-0 overflow-y-auto">
            <Client360OverviewContent summary={summary} clients={clients} />
          </div>
        </div>
      </ModalCore>
    </>
  );
}
