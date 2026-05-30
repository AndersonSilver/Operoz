/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TClient360Health } from "@plane/types";
import { cn } from "@plane/utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";

type Props = {
  health: TClient360Health;
  className?: string;
};

const HEALTH_CONFIG: Record<
  TClient360Health,
  { tone: keyof typeof CLIENT_360_TONE; Icon: typeof CheckCircle2 }
> = {
  ok: { tone: "success", Icon: CheckCircle2 },
  warning: { tone: "warning", Icon: AlertTriangle },
  critical: { tone: "danger", Icon: XCircle },
};

export function Client360HealthBadge({ health, className }: Props) {
  const { t } = useTranslation();
  const { tone, Icon } = HEALTH_CONFIG[health];
  const tkn = CLIENT_360_TONE[tone];
  const labelKey =
    health === "critical"
      ? "boards.client_360.health_critical"
      : health === "warning"
        ? "boards.client_360.health_warning"
        : "boards.client_360.health_ok";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-2 px-2 py-0.5 text-11 font-medium text-secondary",
        className
      )}
    >
      <Icon className={cn("size-3 shrink-0", tkn.icon)} strokeWidth={2} />
      {t(labelKey)}
    </span>
  );
}
