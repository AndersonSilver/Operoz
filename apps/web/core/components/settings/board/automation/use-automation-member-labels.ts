import { useEffect, useState } from "react";
import type { IBoardMember } from "@operis/types";
import { useUser } from "@/hooks/store/user";
import { BoardAccessService } from "@/services/board/board-access.service";

const boardAccessService = new BoardAccessService();

export function useAutomationMemberLabels(workspaceSlug: string, boardSlug: string) {
  const { data: currentUser } = useUser();
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    boardAccessService
      .getBoardMembers(workspaceSlug, boardSlug)
      .then((members) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        (members as IBoardMember[]).forEach((member) => {
          map[member.user_id] = member.member?.display_name ?? member.email;
        });
        if (currentUser?.id) {
          map[currentUser.id] = currentUser.display_name ?? currentUser.email ?? currentUser.id;
        }
        setLabels(map);
      })
      .catch(() => {
        if (!cancelled) setLabels({});
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, boardSlug, currentUser?.display_name, currentUser?.email, currentUser?.id]);

  const resolveUser = (userId: string | null | undefined): string | null => {
    if (!userId) return null;
    return labels[userId] ?? null;
  };

  return { resolveUser };
}
