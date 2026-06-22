import { API_BASE_URL } from "@operis/constants";
import { APIService } from "@/services/api.service";

export type TDiscordSlashCommandStatus = "pending" | "synced" | "failed";

export type TDiscordSlashCommand = {
  id: string;
  name: string;
  description: string;
  prompt_instructions: string;
  guild_id: string | null;
  board_slug: string;
  default_project: string | null;
  is_enabled: boolean;
  discord_command_id: string | null;
  registration_status: TDiscordSlashCommandStatus;
  registration_error: string;
  created_at: string;
  updated_at: string;
};

export type TDiscordSlashCommandPayload = {
  name: string;
  description: string;
  prompt_instructions: string;
  guild_id?: string | null;
  board_slug?: string;
  default_project?: string | null;
  is_enabled?: boolean;
};

export class DiscordSlashCommandService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  list(workspaceSlug: string) {
    return this.get(`/api/workspaces/${workspaceSlug}/discord/slash-commands/`).then(
      (response) => response?.data as TDiscordSlashCommand[]
    );
  }

  create(workspaceSlug: string, data: TDiscordSlashCommandPayload) {
    return this.post(`/api/workspaces/${workspaceSlug}/discord/slash-commands/`, data).then(
      (response) => response?.data as TDiscordSlashCommand
    );
  }

  update(workspaceSlug: string, commandId: string, data: Partial<TDiscordSlashCommandPayload>) {
    return this.patch(`/api/workspaces/${workspaceSlug}/discord/slash-commands/${commandId}/`, data).then(
      (response) => response?.data as TDiscordSlashCommand
    );
  }

  remove(workspaceSlug: string, commandId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/discord/slash-commands/${commandId}/`);
  }
}
