// plane imports
import type { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@operoz/types";
// local imports
import type { IFilterInstance } from "../rich-filters";

export type TWorkItemFilterKey = `${EIssuesStoreType}-${string}`;

export type IWorkItemFilterInstance = IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>;
