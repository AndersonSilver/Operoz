import type { ReactNode } from "react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  headerStart?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  zIndexClass?: string;
  panelClassName?: string;
};

export function SettingsSidePanel(props: Props) {
  const {
    isOpen,
    onClose,
    title,
    description,
    headerStart,
    children,
    footer,
    zIndexClass = "z-[35]",
    panelClassName,
  } = props;
  const { t } = useTranslation();

  if (typeof document === "undefined") return null;

  return createPortal(
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className={cn("relative", zIndexClass)} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" aria-hidden="true" />
        </Transition.Child>

        <div className={cn("fixed inset-0", zIndexClass)}>
          <div className="absolute inset-0">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={cn(
                    "pointer-events-auto flex h-full w-screen max-w-md flex-col border-l border-subtle bg-surface-1 shadow-raised-200",
                    panelClassName
                  )}
                >
                  <div className="flex shrink-0 items-start gap-2 border-b border-subtle px-5 py-4">
                    {headerStart}
                    <div className="min-w-0 flex-1 pr-2">
                      <Dialog.Title className="text-14 leading-snug font-semibold text-primary">{title}</Dialog.Title>
                      {description ? <p className="mt-1 text-12 text-tertiary">{description}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="shrink-0 rounded p-1.5 text-placeholder transition-colors hover:bg-layer-transparent-hover"
                      aria-label={t("close")}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                  {footer}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>,
    document.body
  );
}
