/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type {
  IBoardCustomField,
  IBoardProjectFieldLayout,
  IProjectCustomFieldLite,
  IProjectFormLayoutResponse,
  IProjectIssueFormConfig,
  TStandardFieldKey,
  IWorkspaceCustomField,
  TBoardCustomFieldFormData,
  TBoardFieldFormSpan,
  TBoardProjectFieldSection,
  TWorkspaceCustomFieldFormData,
  TWorkspaceCustomFieldUpdateData,
} from "@plane/types";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";

export interface IBoardCustomFieldStore {
  boardCustomFieldsByKey: Record<string, IBoardCustomField[]>;
  workspaceCustomFieldsBySlug: Record<string, IWorkspaceCustomField[]>;
  projectCustomFieldsByProjectId: Record<string, IProjectCustomFieldLite[]>;
  fetchBoardCustomFields: (workspaceSlug: string, boardSlug: string) => Promise<IBoardCustomField[]>;
  fetchWorkspaceCustomFields: (workspaceSlug: string) => Promise<IWorkspaceCustomField[]>;
  createWorkspaceCustomField: (
    workspaceSlug: string,
    data: TWorkspaceCustomFieldFormData
  ) => Promise<IWorkspaceCustomField>;
  createBoardCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardCustomFieldFormData
  ) => Promise<IBoardCustomField>;
  bulkAddBoardCustomFields: (
    workspaceSlug: string,
    boardSlug: string,
    customFieldIds: string[]
  ) => Promise<IBoardCustomField[]>;
  updateBoardCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    boardCustomFieldId: string,
    data: Partial<{ is_enabled: boolean; sort_order: number; form_span: "half" | "full" }>
  ) => Promise<IBoardCustomField>;
  updateWorkspaceCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    customFieldId: string,
    data: TWorkspaceCustomFieldUpdateData
  ) => Promise<IBoardCustomField>;
  removeBoardCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    boardCustomFieldId: string
  ) => Promise<void>;
  deleteWorkspaceCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    customFieldId: string
  ) => Promise<void>;
  fetchProjectCustomFields: (workspaceSlug: string, projectId: string) => Promise<IProjectCustomFieldLite[]>;
  getBoardCustomFields: (workspaceSlug: string, boardSlug: string) => IBoardCustomField[];
  getWorkspaceCustomFields: (workspaceSlug: string) => IWorkspaceCustomField[];
  getProjectCustomFields: (projectId: string) => IProjectCustomFieldLite[];
  getEnabledStandardFieldKeys: (projectId: string) => TStandardFieldKey[];
  projectFieldLayoutByKey: Record<string, IBoardProjectFieldLayout[]>;
  fetchBoardProjectFieldLayout: (workspaceSlug: string, boardSlug: string) => Promise<IBoardProjectFieldLayout[]>;
  getBoardProjectFieldLayout: (workspaceSlug: string, boardSlug: string) => IBoardProjectFieldLayout[];
  addBoardProjectLayoutCustomField: (
    workspaceSlug: string,
    boardSlug: string,
    data: {
      custom_field_id: string;
      section?: TBoardProjectFieldSection;
      sort_order?: number;
      is_required?: boolean;
      form_span?: TBoardFieldFormSpan;
    }
  ) => Promise<IBoardProjectFieldLayout>;
  updateBoardProjectFieldLayout: (
    workspaceSlug: string,
    boardSlug: string,
    layoutId: string,
    data: Partial<{
      section: TBoardProjectFieldSection;
      sort_order: number;
      is_required: boolean;
      is_enabled: boolean;
      form_span: TBoardFieldFormSpan;
    }>
  ) => Promise<IBoardProjectFieldLayout>;
  removeBoardProjectFieldLayout: (
    workspaceSlug: string,
    boardSlug: string,
    layoutId: string
  ) => Promise<void>;
  fetchBoardProjectFormLayout: (
    workspaceSlug: string,
    boardSlug: string
  ) => Promise<IProjectFormLayoutResponse>;
  fetchProjectFormLayout: (workspaceSlug: string, projectId: string) => Promise<IProjectFormLayoutResponse>;
}

const boardKey = (workspaceSlug: string, boardSlug: string) => `${workspaceSlug}::${boardSlug}`;

export class BoardCustomFieldStore implements IBoardCustomFieldStore {
  boardCustomFieldsByKey: Record<string, IBoardCustomField[]> = {};
  workspaceCustomFieldsBySlug: Record<string, IWorkspaceCustomField[]> = {};
  projectCustomFieldsByProjectId: Record<string, IProjectCustomFieldLite[]> = {};
  projectIssueFormConfigByProjectId: Record<string, IProjectIssueFormConfig> = {};
  projectFieldLayoutByKey: Record<string, IBoardProjectFieldLayout[]> = {};
  private service = new BoardCustomFieldService();

  constructor() {
    makeObservable(this, {
      boardCustomFieldsByKey: observable,
      workspaceCustomFieldsBySlug: observable,
      projectCustomFieldsByProjectId: observable,
      projectIssueFormConfigByProjectId: observable,
      fetchBoardCustomFields: action,
      fetchWorkspaceCustomFields: action,
      createWorkspaceCustomField: action,
      createBoardCustomField: action,
      bulkAddBoardCustomFields: action,
      updateBoardCustomField: action,
      updateWorkspaceCustomField: action,
      removeBoardCustomField: action,
      deleteWorkspaceCustomField: action,
      fetchProjectCustomFields: action,
      projectFieldLayoutByKey: observable,
      fetchBoardProjectFieldLayout: action,
      addBoardProjectLayoutCustomField: action,
      updateBoardProjectFieldLayout: action,
      removeBoardProjectFieldLayout: action,
      fetchBoardProjectFormLayout: action,
      fetchProjectFormLayout: action,
    });
  }

  getBoardCustomFields = (workspaceSlug: string, boardSlug: string) =>
    this.boardCustomFieldsByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  getWorkspaceCustomFields = (workspaceSlug: string) =>
    this.workspaceCustomFieldsBySlug[workspaceSlug] ?? [];

  getProjectCustomFields = (projectId: string) => this.projectCustomFieldsByProjectId[projectId] ?? [];

  getEnabledStandardFieldKeys = (projectId: string): TStandardFieldKey[] =>
    this.projectIssueFormConfigByProjectId[projectId]?.enabled_standard_keys ?? [
      "priority",
      "label_ids",
      "start_date",
      "target_date",
      "cycle_id",
      "module_ids",
      "estimate_point",
      "parent_id",
    ];

  fetchBoardCustomFields = async (workspaceSlug: string, boardSlug: string) => {
    const fields = await this.service.getBoardCustomFields(workspaceSlug, boardSlug);
    runInAction(() => {
      this.boardCustomFieldsByKey[boardKey(workspaceSlug, boardSlug)] = fields;
    });
    return fields;
  };

  fetchWorkspaceCustomFields = async (workspaceSlug: string) => {
    const fields = await this.service.getWorkspaceCustomFields(workspaceSlug);
    runInAction(() => {
      this.workspaceCustomFieldsBySlug[workspaceSlug] = fields;
    });
    return fields;
  };

  createWorkspaceCustomField = async (workspaceSlug: string, data: TWorkspaceCustomFieldFormData) => {
    const created = await this.service.createWorkspaceCustomField(workspaceSlug, data);
    runInAction(() => {
      const wsFields = this.workspaceCustomFieldsBySlug[workspaceSlug] ?? [];
      this.workspaceCustomFieldsBySlug[workspaceSlug] = [...wsFields, created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    return created;
  };

  createBoardCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardCustomFieldFormData
  ) => {
    const created = await this.service.createBoardCustomField(workspaceSlug, boardSlug, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      const list = [...(this.boardCustomFieldsByKey[key] ?? []), created].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      this.boardCustomFieldsByKey[key] = list;
      const wsFields = this.workspaceCustomFieldsBySlug[workspaceSlug] ?? [];
      if (!wsFields.find((f) => f.id === created.custom_field_id)) {
        this.workspaceCustomFieldsBySlug[workspaceSlug] = [
          ...wsFields,
          {
            id: created.custom_field_id,
            name: created.name,
            key: created.key,
            description: created.description,
            field_type: created.field_type,
            settings: created.settings,
            is_active: created.is_active,
          },
        ];
      }
    });
    return created;
  };

  bulkAddBoardCustomFields = async (
    workspaceSlug: string,
    boardSlug: string,
    customFieldIds: string[]
  ) => {
    const created = await this.service.bulkAddBoardCustomFields(workspaceSlug, boardSlug, customFieldIds);
    await this.fetchBoardCustomFields(workspaceSlug, boardSlug);
    return created;
  };

  updateBoardCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    boardCustomFieldId: string,
    data: Partial<{ is_enabled: boolean; sort_order: number; form_span: "half" | "full" }>
  ) => {
    const updated = await this.service.updateBoardCustomField(
      workspaceSlug,
      boardSlug,
      boardCustomFieldId,
      data
    );
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardCustomFieldsByKey[key] = (this.boardCustomFieldsByKey[key] ?? []).map((item) =>
        item.id === boardCustomFieldId ? updated : item
      );
    });
    return updated;
  };

  updateWorkspaceCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    customFieldId: string,
    data: TWorkspaceCustomFieldUpdateData
  ) => {
    const wsField = await this.service.updateWorkspaceCustomField(workspaceSlug, customFieldId, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardCustomFieldsByKey[key] = (this.boardCustomFieldsByKey[key] ?? []).map((item) =>
        item.custom_field_id === customFieldId
          ? {
              ...item,
              name: wsField.name,
              key: wsField.key,
              description: wsField.description,
              settings: wsField.settings,
            }
          : item
      );
      const wsList = this.workspaceCustomFieldsBySlug[workspaceSlug] ?? [];
      this.workspaceCustomFieldsBySlug[workspaceSlug] = wsList.map((f) =>
        f.id === customFieldId ? { ...f, ...wsField } : f
      );
    });
    const key = boardKey(workspaceSlug, boardSlug);
    const updatedBoardField = (this.boardCustomFieldsByKey[key] ?? []).find(
      (item) => item.custom_field_id === customFieldId
    );
    if (!updatedBoardField) {
      throw new Error("BOARD_CUSTOM_FIELD_NOT_FOUND");
    }
    return updatedBoardField;
  };

  removeBoardCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    boardCustomFieldId: string
  ) => {
    await this.service.removeBoardCustomField(workspaceSlug, boardSlug, boardCustomFieldId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardCustomFieldsByKey[key] = (this.boardCustomFieldsByKey[key] ?? []).flatMap((item) => {
        if (item.id !== boardCustomFieldId) return [item];
        if (item.is_system) return [{ ...item, is_enabled: false }];
        return [];
      });
    });
  };

  deleteWorkspaceCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    customFieldId: string
  ) => {
    await this.service.deleteWorkspaceCustomField(workspaceSlug, customFieldId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardCustomFieldsByKey[key] = (this.boardCustomFieldsByKey[key] ?? []).filter(
        (item) => item.custom_field_id !== customFieldId
      );
      const wsFields = this.workspaceCustomFieldsBySlug[workspaceSlug] ?? [];
      this.workspaceCustomFieldsBySlug[workspaceSlug] = wsFields.filter((f) => f.id !== customFieldId);
    });
  };

  fetchProjectCustomFields = async (workspaceSlug: string, projectId: string) => {
    const config = await this.service.getProjectIssueFormConfig(workspaceSlug, projectId);
    runInAction(() => {
      this.projectIssueFormConfigByProjectId[projectId] = config;
      this.projectCustomFieldsByProjectId[projectId] = config?.custom_fields ?? [];
    });
    return config?.custom_fields ?? [];
  };

  getBoardProjectFieldLayout = (workspaceSlug: string, boardSlug: string) =>
    this.projectFieldLayoutByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  fetchBoardProjectFieldLayout = async (workspaceSlug: string, boardSlug: string) => {
    const fields = await this.service.getBoardProjectFieldLayout(workspaceSlug, boardSlug);
    runInAction(() => {
      this.projectFieldLayoutByKey[boardKey(workspaceSlug, boardSlug)] = fields;
    });
    return fields;
  };

  addBoardProjectLayoutCustomField = async (
    workspaceSlug: string,
    boardSlug: string,
    data: {
      custom_field_id: string;
      section?: TBoardProjectFieldSection;
      sort_order?: number;
      is_required?: boolean;
      form_span?: TBoardFieldFormSpan;
    }
  ) => {
    const field = await this.service.addBoardProjectLayoutCustomField(workspaceSlug, boardSlug, data);
    await this.fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
    return field;
  };

  updateBoardProjectFieldLayout = async (
    workspaceSlug: string,
    boardSlug: string,
    layoutId: string,
    data: Partial<{
      section: TBoardProjectFieldSection;
      sort_order: number;
      is_required: boolean;
      is_enabled: boolean;
      form_span: TBoardFieldFormSpan;
    }>
  ) => {
    const field = await this.service.updateBoardProjectFieldLayout(workspaceSlug, boardSlug, layoutId, data);
    await this.fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
    return field;
  };

  removeBoardProjectFieldLayout = async (workspaceSlug: string, boardSlug: string, layoutId: string) => {
    await this.service.removeBoardProjectFieldLayout(workspaceSlug, boardSlug, layoutId);
    await this.fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
  };

  fetchBoardProjectFormLayout = (workspaceSlug: string, boardSlug: string) =>
    this.service.getBoardProjectFormLayout(workspaceSlug, boardSlug);

  fetchProjectFormLayout = (workspaceSlug: string, projectId: string) =>
    this.service.getProjectFormLayout(workspaceSlug, projectId);
}
