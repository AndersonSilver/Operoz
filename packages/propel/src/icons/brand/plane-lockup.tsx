/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ISvgIcons } from "../type";
import { BrandMark } from "./brand-mark";

export function PlaneLockup(props: ISvgIcons) {
  const { className, height, width } = props;
  return <BrandMark className={className} alt="Logo" height={height} width={width} />;
}
