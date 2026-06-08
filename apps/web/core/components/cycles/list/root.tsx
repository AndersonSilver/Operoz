import React from "react";
import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// components
import { useTranslation } from "@operis/i18n";
import { BOARD_HUB_CYCLE_SECTION_HEADER } from "@/components/board/board-hub-background";
import { ContentWrapper, ERowVariant } from "@operis/ui";
import { cn } from "@operis/utils";
import { ListLayout } from "@/components/core/list";
import { ActiveCycleRoot } from "@/plane-web/components/cycles";
// local imports
import { CyclePeekOverview } from "../cycle-peek-overview";
import { CycleListGroupHeader } from "./cycle-list-group-header";
import { CyclesListMap } from "./cycles-list-map";

export interface ICyclesList {
  completedCycleIds: string[];
  upcomingCycleIds?: string[] | undefined;
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  isArchived?: boolean;
}

export const CyclesList = observer(function CyclesList(props: ICyclesList) {
  const { completedCycleIds, upcomingCycleIds, cycleIds, workspaceSlug, projectId, isArchived = false } = props;
  const { t } = useTranslation();

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="flex-row">
      <ListLayout>
        {isArchived ? (
          <>
            <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
          </>
        ) : (
          <>
            <ActiveCycleRoot workspaceSlug={workspaceSlug} projectId={projectId} />

            {upcomingCycleIds && (
              <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
                {({ open }) => (
                  <>
                    <Disclosure.Button className={cn("cursor-pointer", BOARD_HUB_CYCLE_SECTION_HEADER)}>
                      <CycleListGroupHeader
                        title={t("project_cycles.upcoming_cycle.label")}
                        type="upcoming"
                        count={upcomingCycleIds.length}
                        showCount
                        isExpanded={open}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel>
                      <CyclesListMap cycleIds={upcomingCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            )}
            <Disclosure as="div" className="flex flex-shrink-0 flex-col pb-7">
              {({ open }) => (
                <>
                  <Disclosure.Button className={cn("cursor-pointer", BOARD_HUB_CYCLE_SECTION_HEADER)}>
                    <CycleListGroupHeader
                      title={t("project_cycles.completed_cycle.label")}
                      type="completed"
                      count={completedCycleIds.length}
                      showCount
                      isExpanded={open}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel>
                    <CyclesListMap cycleIds={completedCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </>
        )}
      </ListLayout>
      <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} isArchived={isArchived} />
    </ContentWrapper>
  );
});
