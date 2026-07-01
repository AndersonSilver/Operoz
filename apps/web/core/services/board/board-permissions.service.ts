/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IProjectBoardPermissions } from "@plane/types";
import { APIService } from "@/services/api.service";

export class BoardPermissionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectBoardPermissions(
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectBoardPermissions> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/board-permissions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
