// operoz web imports
import type { TEditorMentionComponentProps } from "@/operoz-web/components/editor/embeds/mentions";
import { EditorAdditionalMentionsRoot } from "@/operoz-web/components/editor/embeds/mentions";
// local imports
import { EditorCircleMention } from "./circle";
import { EditorUserMention } from "./user";

export function EditorMentionsRoot(props: TEditorMentionComponentProps) {
  const { entity_identifier, entity_name } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    case "board_circle":
      return <EditorCircleMention id={entity_identifier} />;
    default:
      return <EditorAdditionalMentionsRoot {...props} />;
  }
}
