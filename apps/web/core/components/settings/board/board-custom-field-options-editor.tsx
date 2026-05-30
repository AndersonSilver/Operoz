/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";

type Props = {
  options: string[];
  onChange: (options: string[]) => void;
};

export function getTrimmedFieldOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean);
}

export function BoardCustomFieldOptionsEditor(props: Props) {
  const { options, onChange } = props;
  const { t } = useTranslation();

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  const addOption = () => {
    onChange([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-11 font-medium text-secondary">{t("boards.settings.fields.options_label")}</p>
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={index} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={t("boards.settings.fields.option_placeholder")}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="grid size-8 shrink-0 place-items-center rounded-md text-placeholder transition-colors hover:bg-layer-transparent-hover hover:text-danger disabled:opacity-30"
              disabled={options.length === 1 && !option.trim()}
              aria-label={t("boards.settings.fields.option_remove")}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="tertiary" size="sm" onClick={addOption} className="w-full">
        <Plus className="size-3.5" />
        {t("boards.settings.fields.option_add")}
      </Button>
    </div>
  );
}
