import useSWR from "swr";
import { useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, TClient360IntakeType } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

export function BoardClient360IntakeTypesPanel(props: { workspaceSlug: string; board: IBoard }) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: intakeTypes, mutate } = useSWR(
    workspaceSlug && board.slug ? `CLIENT360_INTAKE_TYPES_${workspaceSlug}_${board.slug}` : null,
    () => boardService.getClient360IntakeTypes(workspaceSlug, board.slug),
    { revalidateOnFocus: false }
  );

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await boardService.createClient360IntakeType(workspaceSlug, board.slug, {
        name: trimmed,
        type_name_pattern: pattern.trim() || trimmed.toLowerCase(),
      });
      setName("");
      setPattern("");
      void mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.client_360_health.intake_create_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: TClient360IntakeType) => {
    try {
      await boardService.deleteClient360IntakeType(workspaceSlug, board.slug, row.id);
      void mutate();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
      <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.intake_title")}</h3>
      <p className="text-12 text-secondary">{t("boards.settings.client_360_health.intake_hint")}</p>
      {intakeTypes && intakeTypes.length > 0 ? (
        <ul className="divide-y divide-subtle rounded-md border border-subtle">
          {intakeTypes.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-13">
              <div className="min-w-0">
                <p className="font-medium text-primary">{row.name}</p>
                <p className="truncate text-11 text-tertiary">{row.type_name_pattern || row.slug}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void handleDelete(row)}>
                {t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-12 text-tertiary">{t("boards.settings.client_360_health.intake_empty")}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-12 text-secondary">
          {t("boards.settings.client_360_health.intake_name")}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
          />
        </label>
        <label className="block text-12 text-secondary">
          {t("boards.settings.client_360_health.intake_pattern")}
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t("boards.settings.client_360_health.intake_pattern_placeholder")}
            className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
          />
        </label>
      </div>
      <Button variant="secondary" size="sm" onClick={() => void handleCreate()} disabled={saving || !name.trim()}>
        {saving ? t("loading") : t("boards.settings.client_360_health.intake_add")}
      </Button>
    </div>
  );
}
