/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";
import { hasConfiguredLogo } from "@/components/board/gantt/board-gantt-row-icon";

type Props = {
  label: string;
  description?: string;
  value?: TLogoProps;
  onChange: (logo: TLogoProps) => void;
};

const emptyLogo = (): TLogoProps => ({ in_use: "emoji", emoji: { value: "📁" } });

export function BoardLogoPropsField(props: Props) {
  const { label, description, value, onChange } = props;
  const [isOpen, setIsOpen] = useState(false);
  const logo = value ?? emptyLogo();

  return (
    <div className="flex items-start gap-4 rounded-lg border border-subtle bg-layer-2/50 p-4">
      <EmojiPicker
        iconType="material"
        defaultOpen={EmojiIconPickerTypes.ICON}
        isOpen={isOpen}
        handleToggle={setIsOpen}
        label={
          <span className="grid size-12 place-items-center rounded-md border border-subtle bg-layer-1">
            <Logo logo={logo} size={24} />
          </span>
        }
        onChange={(val) => {
          const logoValue = val.type === EmojiIconPickerTypes.EMOJI ? { value: val.value } : val.value;
          onChange({ in_use: val.type, [val.type]: logoValue } as TLogoProps);
          setIsOpen(false);
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm-medium text-primary">{label}</p>
        {description ? <p className="mt-0.5 text-12 text-tertiary">{description}</p> : null}
        {!hasConfiguredLogo(logo) ? (
          <p className="mt-1 text-11 text-tertiary">Clique no ícone para escolher.</p>
        ) : null}
      </div>
    </div>
  );
}
