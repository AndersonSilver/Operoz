import type { ReactNode } from "react";
import { observer } from "mobx-react";

export const ExtendedAppHeader = observer(function ExtendedAppHeader(props: { header: ReactNode }) {
  const { header } = props;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="w-full min-w-0 flex-1">{header}</div>
    </div>
  );
});
