import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function McpAuthorizeLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Autorizar conector - Operoz" }];
