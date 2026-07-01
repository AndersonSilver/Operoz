/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IBoardStatusReport,
  TBoardStatusReportCreateData,
  TBoardStatusReportUpdateData,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class BoardStatusReportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, boardSlug: string): Promise<IBoardStatusReport[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardStatusReportCreateData
  ): Promise<IBoardStatusReport> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, boardSlug: string, reportId: string): Promise<IBoardStatusReport> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/${reportId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    boardSlug: string,
    reportId: string,
    data: TBoardStatusReportUpdateData
  ): Promise<IBoardStatusReport> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/${reportId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, boardSlug: string, reportId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/${reportId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadExport(workspaceSlug: string, boardSlug: string, reportId: string): Promise<string> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/status-reports/${reportId}/export/`, {}, {
      responseType: "text",
    })
      .then((response) => response?.data as string)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
