import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectStatusReportHeader } from "./header";

export default function ProjectStatusReportLayout() {
  return (
    <>
      <AppHeader header={<ProjectStatusReportHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
