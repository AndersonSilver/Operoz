export interface IBoardModuleStage {
  id: string;
  board: string;
  workspace?: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TBoardModuleStageFormData = {
  name: string;
  color: string;
  sort_order?: number;
  is_default?: boolean;
  is_active?: boolean;
};

export type TBoardModuleStageUpdateData = Partial<TBoardModuleStageFormData>;
