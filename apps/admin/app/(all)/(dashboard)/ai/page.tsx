import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@operis/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";
// local
import { InstanceAIForm } from "./form";

const InstanceAIPage = observer(function InstanceAIPage(_props: Route.ComponentProps) {
  // store
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <PageWrapper
      header={{
        title: "Inteligência artificial do Operoz",
        description:
          "Configure provedor, modelo e credenciais de IA para habilitar o Operoz Assistant e recursos inteligentes em todos os workspaces.",
      }}
    >
      {formattedConfig ? (
        <InstanceAIForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-8">
          <Loader.Item height="50px" width="40%" />
          <div className="grid w-2/3 grid-cols-2 gap-x-8 gap-y-4">
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
          </div>
          <Loader.Item height="50px" width="20%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Inteligência Artificial - Operoz Admin" }];

export default InstanceAIPage;
