import { useCallback, useMemo } from "react";
import { Users } from "lucide-react";
// plane editor
import type { TMentionSection } from "@operoz/editor";
import { useTranslation } from "@operoz/i18n";
// plane types
import type { TBoardCircleSearchResponse, TSearchEntities, TSearchResponse } from "@operoz/types";

export type TUseAdditionalEditorMentionArgs = {
  enableAdvancedMentions: boolean;
};

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
};

export type TAdditionalEditorMentionHandlerReturnType = {
  sections: TMentionSection[];
};

export type TAdditionalParseEditorContentArgs = {
  id: string;
  entityType: TSearchEntities;
};

export type TAdditionalParseEditorContentReturnType =
  | {
      redirectionPath: string;
      textContent: string;
    }
  | undefined;

export const useAdditionalEditorMention = (_args: TUseAdditionalEditorMentionArgs) => {
  const { t } = useTranslation();

  const updateAdditionalSections = useCallback(
    ({ response }: TAdditionalEditorMentionHandlerArgs): TAdditionalEditorMentionHandlerReturnType => {
      const circles = response.board_circle as TBoardCircleSearchResponse[] | undefined;
      if (!circles || circles.length === 0) return { sections: [] };

      return {
        sections: [
          {
            key: "circles",
            title: t("editor.mentions.circles_section_title"),
            items: circles.map((circle) => ({
              id: circle.id,
              entity_identifier: circle.id,
              entity_name: "board_circle" as const,
              title: circle.name,
              subTitle: t("editor.mentions.circle_member_count", { count: circle.member_count }),
              icon: <Users className="size-4 flex-shrink-0 text-accent-primary" strokeWidth={1.75} />,
            })),
          },
        ],
      };
    },
    [t]
  );

  const parseAdditionalEditorContent = useCallback(
    (_args: TAdditionalParseEditorContentArgs): TAdditionalParseEditorContentReturnType => undefined,
    []
  );

  const editorMentionTypes: TSearchEntities[] = useMemo(() => ["user_mention", "board_circle"], []);

  return {
    updateAdditionalSections,
    parseAdditionalEditorContent,
    editorMentionTypes,
  };
};
