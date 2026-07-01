/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

// plane internal packages
import { WEB_BASE_URL } from "@plane/constants";
import { NewTabIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { ToggleSwitch } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  const { getWorkspaceById, patchWorkspaceIssueNotificationFlags, loader: workspaceLoader } = useWorkspace();
  const workspace = getWorkspaceById(workspaceId);
  const saving = workspaceLoader === "mutation";

  if (!workspace) return null;

  const assigneesAlways = Boolean(workspace.issue_notify_assignees_always_email);
  const extendedActivities = Boolean(workspace.issue_notify_email_include_extended_activities);
  const descriptionChanges = Boolean(workspace.issue_notify_email_include_description_changes);
  const immediateDispatch = Boolean(workspace.issue_notify_email_dispatch_immediately);

  const patchFlag = async (
    payload: Parameters<typeof patchWorkspaceIssueNotificationFlags>[1],
    successMessage: string
  ) => {
    const promise = patchWorkspaceIssueNotificationFlags(workspaceId, payload);
    setPromiseToast(promise, {
      loading: "Saving…",
      success: { title: "Saved", message: () => successMessage },
      error: { title: "Error", message: () => "Could not save workspace settings" },
    });
    await promise;
  };

  return (
    <div className="rounded-lg border border-subtle bg-layer-1 shadow-raised-100">
      <a
        href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
        target="_blank"
        className="group flex items-center justify-between gap-2.5 truncate border-b border-subtle p-3 hover:bg-layer-1-hover"
        rel="noreferrer"
      >
        <div className="flex items-start gap-4">
          <span
            className={`relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-11 uppercase ${
              !workspace?.logo_url && "rounded-lg bg-accent-primary text-on-color"
            }`}
          >
            {workspace?.logo_url && workspace.logo_url !== "" ? (
              <img
                src={getFileURL(workspace.logo_url)}
                className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
                alt="Workspace Logo"
              />
            ) : (
              (workspace?.name?.[0] ?? "...")
            )}
          </span>
          <div className="flex flex-col items-start gap-1">
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <h3 className={`text-14 font-medium capitalize`}>{workspace.name}</h3>
              <Tooltip tooltipContent="The unique URL of your workspace">
                <h4 className="text-13 text-tertiary">[{workspace.slug}]</h4>
              </Tooltip>
            </div>
            {workspace.owner.email && (
              <div className="flex items-center gap-1 text-11">
                <h3 className="font-medium text-secondary">Owned by:</h3>
                <h4 className="text-tertiary">{workspace.owner.email}</h4>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-11">
              {workspace.total_projects !== null && (
                <span className="flex items-center gap-1">
                  <h3 className="font-medium text-secondary">Total projects:</h3>
                  <h4 className="text-tertiary">{workspace.total_projects}</h4>
                </span>
              )}
              {workspace.total_members !== null && (
                <>
                  •
                  <span className="flex items-center gap-1">
                    <h3 className="font-medium text-secondary">Total members:</h3>
                    <h4 className="text-tertiary">{workspace.total_members}</h4>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <NewTabIcon width={14} height={16} className="text-placeholder group-hover:text-secondary" />
        </div>
      </a>

      <div
        className="space-y-0 px-3 pb-3 pt-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <p className="text-11 leading-5 text-tertiary pb-2">
          Issue email behaviour for this workspace (off = default Plane-style notifications).
        </p>

        <div className="flex flex-col divide-y divide-subtle border border-subtle rounded-md">
          <div className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0">
              <div className="text-13 font-medium">Assignees always get email</div>
              <div className="text-11 text-tertiary leading-5">
                Assignees receive issue activity emails even if they turned off email for property changes.
              </div>
            </div>
            <ToggleSwitch
              value={assigneesAlways}
              onChange={(next) =>
                patchFlag({ issue_notify_assignees_always_email: next }, "Assignee email setting updated")
              }
              size="sm"
              disabled={saving}
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0">
              <div className="text-13 font-medium">Extended activity types</div>
              <div className="text-11 text-tertiary leading-5">
                Notify for cycles, modules, reactions, votes, drafts, and intake (normally skipped).
              </div>
            </div>
            <ToggleSwitch
              value={extendedActivities}
              onChange={(next) =>
                patchFlag(
                  { issue_notify_email_include_extended_activities: next },
                  "Extended activity notifications updated"
                )
              }
              size="sm"
              disabled={saving}
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0">
              <div className="text-13 font-medium">Description changes</div>
              <div className="text-11 text-tertiary leading-5">
                Send subscriber/assignee notifications when the issue description is edited.
              </div>
            </div>
            <ToggleSwitch
              value={descriptionChanges}
              onChange={(next) =>
                patchFlag(
                  { issue_notify_email_include_description_changes: next },
                  "Description notification setting updated"
                )
              }
              size="sm"
              disabled={saving}
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0">
              <div className="text-13 font-medium">Send email queue immediately</div>
              <div className="text-11 text-tertiary leading-5">
                After logging notifications, trigger the mail worker right away instead of waiting for the 5-minute job.
              </div>
            </div>
            <ToggleSwitch
              value={immediateDispatch}
              onChange={(next) =>
                patchFlag(
                  { issue_notify_email_dispatch_immediately: next },
                  "Immediate dispatch setting updated"
                )
              }
              size="sm"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
