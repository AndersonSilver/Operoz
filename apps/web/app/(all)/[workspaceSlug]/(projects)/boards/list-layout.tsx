import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { BoardsDirectoryHeader } from "./header-directory";

export default function BoardsListLayout() {
  return (
    <>
      <AppHeader header={<BoardsDirectoryHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
