export type TBoardSupportQueue = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type TBoardSupportQueueWritePayload = Partial<
  Pick<TBoardSupportQueue, "name" | "color" | "sort_order" | "is_default" | "description">
>;
