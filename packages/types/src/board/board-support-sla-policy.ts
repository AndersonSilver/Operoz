import type { TSupportCriticality } from "../intake/intake-form";

export type TBoardSupportSlaPolicyRule = {
  duration_minutes: number;
};

export type TBoardSupportSlaPolicyRules = Record<TSupportCriticality, TBoardSupportSlaPolicyRule>;

export type TBoardSupportSlaPolicy = {
  id: string;
  board: string;
  policies: TBoardSupportSlaPolicyRules;
  created_at?: string;
  updated_at?: string;
};

export type TBoardSupportSlaPolicyWritePayload = Pick<TBoardSupportSlaPolicy, "policies">;
