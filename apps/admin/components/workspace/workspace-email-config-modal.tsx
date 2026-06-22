import { Fragment } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
import { Mail } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { setPromiseToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { AdminToggleCard } from "@/components/settings/admin-settings-panel";
import { useWorkspace } from "@/hooks/store";
import { WORKSPACE_NOTIFICATION_FLAGS } from "./workspace-notification-flags";

type Props = {
  workspace: IWorkspace | null;
  isOpen: boolean;
  onClose: () => void;
};

export const WorkspaceEmailConfigModal = observer(function WorkspaceEmailConfigModal(props: Props) {
  const { workspace, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { patchWorkspaceIssueNotificationFlags, loader: workspaceLoader } = useWorkspace();
  const saving = workspaceLoader === "mutation";

  const patchFlag = async (payload: Parameters<typeof patchWorkspaceIssueNotificationFlags>[1]) => {
    if (!workspace) return;

    const promise = patchWorkspaceIssueNotificationFlags(workspace.id, payload);
    setPromiseToast(promise, {
      loading: t("god_mode.common.config_saving"),
      success: {
        title: t("god_mode.common.success"),
        message: () => t("boards.settings.notifications.save_success"),
      },
      error: { title: t("god_mode.common.error"), message: () => t("god_mode.common.config_save_failed") },
    });
    await promise;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-raised-200 transition-all">
                <div className="flex items-start gap-3 border-b border-subtle px-5 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-subtle bg-layer-2 text-accent-primary">
                    <Mail className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="text-16 font-semibold text-primary">
                      {t("god_mode.pages.workspace.config_title")}
                    </Dialog.Title>
                    <p className="mt-1 text-13 leading-relaxed text-secondary">
                      {workspace
                        ? t("god_mode.pages.workspace.config_description", { name: workspace.name })
                        : t("god_mode.pages.workspace.email_section_hint")}
                    </p>
                  </div>
                </div>

                <div className="max-h-[min(70vh,32rem)] space-y-2 overflow-y-auto p-5">
                  <p className="text-12 leading-relaxed text-tertiary">{t("boards.settings.notifications.lead")}</p>
                  {workspace
                    ? WORKSPACE_NOTIFICATION_FLAGS.map((flag) => (
                        <AdminToggleCard
                          key={flag.key}
                          label={t(flag.titleKey)}
                          description={t(flag.descriptionKey)}
                          value={Boolean(workspace[flag.key])}
                          onChange={(next) => patchFlag({ [flag.key]: next })}
                          disabled={saving}
                        />
                      ))
                    : null}
                </div>

                <div className="flex justify-end border-t border-subtle px-5 py-4">
                  <Button type="button" variant="secondary" size="lg" onClick={onClose}>
                    {t("close")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
