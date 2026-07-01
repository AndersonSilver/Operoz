import { API_BASE_URL } from "@operoz/constants";
import type { TBoardIntakeForm, TBoardIntakeFormWritePayload } from "@operoz/types";
import { APIService } from "@/services/api.service";

function parseBoardIntakeFormList(data: unknown): TBoardIntakeForm[] {
  if (Array.isArray(data)) return data as TBoardIntakeForm[];
  return [];
}

export class BoardIntakeFormService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, boardSlug: string): Promise<TBoardIntakeForm[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/intake-forms/`)
      .then((res) => parseBoardIntakeFormList(res?.data))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardIntakeFormWritePayload
  ): Promise<TBoardIntakeForm> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/intake-forms/`, data)
      .then((res) => res?.data as TBoardIntakeForm)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    boardSlug: string,
    formId: string,
    data: TBoardIntakeFormWritePayload
  ): Promise<TBoardIntakeForm> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/intake-forms/${formId}/`, data)
      .then((res) => res?.data as TBoardIntakeForm)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, boardSlug: string, formId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/intake-forms/${formId}/`).catch((error) => {
      throw error?.response?.data;
    });
  }
}

export const boardIntakeFormService = new BoardIntakeFormService();

export const DEFAULT_BOARD_INTAKE_FIELDS: TBoardIntakeFormWritePayload["fields"] = [
  {
    id: "field-client",
    field_type: "client",
    label: "Cliente",
    required: true,
    form_span: "full",
    maps_to: "project_id",
  },
  {
    id: "field-name",
    field_type: "name",
    label: "Resumo",
    required: true,
    form_span: "full",
    maps_to: "name",
  },
  {
    id: "field-description",
    field_type: "description",
    label: "Descrição",
    required: false,
    form_span: "full",
    maps_to: "description_html",
  },
  {
    id: "field-criticality",
    field_type: "criticality",
    label: "Criticidade",
    required: true,
    form_span: "full",
    options: ["p0", "p1", "p2", "p3", "p4", "not_incident"],
  },
  {
    id: "field-problem-started-at",
    field_type: "datetime",
    label: "Início do problema",
    required: true,
    form_span: "full",
  },
  {
    id: "field-sla-due",
    field_type: "sla_due",
    label: "SLA do chamado",
    required: false,
    form_span: "full",
  },
  {
    id: "field-ticket-number",
    field_type: "ticket_number",
    label: "Número do chamado",
    required: false,
    form_span: "full",
  },
];
