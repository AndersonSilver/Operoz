import { observer } from "mobx-react";
import { LayoutGrid, Link2, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { PageWrapper } from "@/components/common/page-wrapper";
import type { Route } from "./+types/page";
import { WorkspaceCreateForm } from "./form";

const WorkspaceCreatePage = observer(function WorkspaceCreatePage(_props: Route.ComponentProps) {
  const { t } = useTranslation();

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: LayoutGrid,
        title: t("god_mode.pages.workspace.create_title"),
        description: t("god_mode.pages.workspace.create_description"),
        highlights: [
          { label: t("god_mode.pages.workspace.create_name_label"), icon: LayoutGrid, tone: "accent" },
          { label: t("god_mode.pages.workspace.create_url_label"), icon: Link2, tone: "purple" },
          { label: t("god_mode.pages.workspace.create_size_label"), icon: Users, tone: "success" },
        ],
      }}
    >
      <WorkspaceCreateForm />
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Create Workspace - God Mode" }];

export default WorkspaceCreatePage;
