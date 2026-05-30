// plane imports
import type { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@operis/types";
// local imports
import type { IFilterInstance } from "../rich-filters";

export type TWorkItemFilterKey = `${EIssuesStoreType}-${string}`;

export type IWorkItemFilterInstance = IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>;
