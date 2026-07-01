import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IBoardCustomField, TBoardProjectFieldSection, TProjectStandardFieldKey } from "@operoz/types";
import { Input } from "@operoz/ui";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";
import { PROJECT_STANDARD_FIELD_KEYS } from "./board-project-schema-constants";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  targetSection: TBoardProjectFieldSection;
  availableCustomFields: IBoardCustomField[];
  hiddenSystemKeys: TProjectStandardFieldKey[];
  onAddSystem: (key: TProjectStandardFieldKey) => void;
  onAddCustom: (customFieldId: string) => void;
};

export function BoardProjectSchemaFieldsSidebar(props: Props) {
  const { workspaceSlug, boardSlug, targetSection, availableCustomFields, hiddenSystemKeys, onAddSystem, onAddCustom } =
    props;
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const camposHref = `/${workspaceSlug}/settings/boards/${boardSlug}/campos/`;

  const filteredSystem = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hiddenSystemKeys.filter((key) => {
      const label = t(`boards.settings.project_schema.standard_fields.${key}`).toLowerCase();
      return !q || label.includes(q);
    });
  }, [hiddenSystemKeys, search, t]);

  const filteredCustom = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableCustomFields;
    return availableCustomFields.filter((f) => f.name.toLowerCase().includes(q));
  }, [availableCustomFields, search]);

  const sectionLabel =
    targetSection === "description"
      ? t("boards.settings.project_schema.section_description")
      : t("boards.settings.project_schema.section_context");

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-lg border border-subtle bg-layer-1 lg:w-72 xl:w-80">
      <div className="border-b border-subtle px-4 py-3">
        <h3 className="text-13 font-semibold text-primary">{t("boards.settings.project_schema.fields_panel_title")}</h3>
        <p className="mt-0.5 text-11 text-tertiary">{t("boards.settings.project_schema.fields_panel_hint")}</p>
        <p className="mt-2 text-11 font-medium text-secondary">
          {t("boards.settings.project_schema.adding_to_section", { section: sectionLabel })}
        </p>
      </div>
      <div className="border-b border-subtle p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-placeholder" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("boards.settings.project_schema.search_fields")}
            className="w-full pl-8 text-13"
          />
        </div>
      </div>
      <div className="max-h-[min(520px,60vh)] flex-1 overflow-y-auto p-2">
        {filteredSystem.length > 0 && (
          <div className="mb-4">
            <p className="px-2 py-1 text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("boards.settings.project_schema.system_fields")}
            </p>
            <ul className="space-y-0.5">
              {filteredSystem.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-13 hover:bg-layer-transparent-hover"
                    onClick={() => onAddSystem(key)}
                  >
                    <BoardCustomFieldTypeGlyph fieldType="standard" size="sm" />
                    <span className="min-w-0 flex-1 truncate">
                      {t(`boards.settings.project_schema.standard_fields.${key}`)}
                    </span>
                    <Plus className="size-3.5 shrink-0 text-tertiary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="px-2 py-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            {t("boards.settings.project_schema.custom_from_board")}
          </p>
          {filteredCustom.length === 0 ? (
            <p className="px-2 py-2 text-12 text-tertiary">
              {availableCustomFields.length === 0
                ? t("boards.settings.project_schema.no_custom_available")
                : t("boards.settings.project_schema.no_search_results")}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredCustom.map((field) => (
                <li key={field.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-13 hover:bg-layer-transparent-hover"
                    onClick={() => field.custom_field_id && onAddCustom(field.custom_field_id)}
                  >
                    <BoardCustomFieldTypeGlyph fieldType={field.field_type} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{field.name}</span>
                    <Plus className="size-3.5 shrink-0 text-tertiary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-subtle p-3">
        <Link href={camposHref} className="block">
          <Button variant="secondary" size="sm" className="w-full">
            <Plus className="size-3.5" />
            {t("boards.settings.project_schema.create_custom_field")}
          </Button>
        </Link>
        <p className="mt-2 text-11 text-tertiary">{t("boards.settings.project_schema.create_custom_field_hint")}</p>
      </div>
    </aside>
  );
}
