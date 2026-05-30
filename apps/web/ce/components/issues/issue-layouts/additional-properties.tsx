import React from "react";
import type { IIssueDisplayProperties, TIssue } from "@operis/types";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export function WorkItemLayoutAdditionalProperties(_props: TWorkItemLayoutAdditionalProperties) {
  return <></>;
}
