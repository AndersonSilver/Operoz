import React from "react";
// helpers
import { Button } from "@operoz/propel/button";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false } = props;
  return (
    <Button variant="secondary" disabled={disabled} size="sm" className="h-8 gap-1.5 px-2.5">
      {icon && icon}
      <span className="text-body-xs-medium">{title}</span>
    </Button>
  );
}
