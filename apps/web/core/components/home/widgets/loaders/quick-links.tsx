import { range } from "lodash-es";
// ui
import { Loader } from "@operoz/ui";

export function QuickLinksWidgetLoader() {
  return (
    <Loader className="flex flex-wrap gap-2 rounded-xl bg-surface-1">
      {range(4).map((index) => (
        <Loader.Item key={index} height="56px" width="230px" />
      ))}
    </Loader>
  );
}
