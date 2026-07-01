/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import type { THomeWidgetProps } from "@plane/types";
import { WidgetSection } from "../shared/widget-section";

const RELEASE_LINKS = [
  {
    titleKey: "home.new_at_plane.items.boards.title",
    descriptionKey: "home.new_at_plane.items.boards.description",
    href: "https://github.com/makeplane/plane/releases",
  },
  {
    titleKey: "home.new_at_plane.items.home.title",
    descriptionKey: "home.new_at_plane.items.home.description",
    href: "https://docs.plane.so",
  },
];

export const NewAtPlaneWidget = observer(function NewAtPlaneWidget(_props: THomeWidgetProps) {
  const { t } = useTranslation();

  return (
    <WidgetSection title={t("home.new_at_plane.title")}>
      <div className="flex flex-col gap-2">
        {RELEASE_LINKS.map((item) => (
          <Link
            key={item.titleKey}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-subtle bg-layer-2 p-3 transition-colors hover:bg-layer-1"
          >
            <p className="text-13 font-medium text-primary">{t(item.titleKey)}</p>
            <p className="mt-1 text-11 text-tertiary">{t(item.descriptionKey)}</p>
          </Link>
        ))}
      </div>
    </WidgetSection>
  );
});
