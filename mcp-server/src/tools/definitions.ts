import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import { loadMcpProfile } from "../config.js";
import { AGENT_TOOLS, FULL_META_TOOLS } from "./registry/meta.js";
import { operationToMcpTool } from "./registry/schema.js";
import { ALL_OPERATIONS } from "./registry/index.js";

const REGISTRY_TOOLS: Tool[] = ALL_OPERATIONS.map(operationToMcpTool);

const profile = loadMcpProfile();

/** Ferramentas expostas ao Cursor / agentes MCP */
export const OPEROZ_TOOLS: Tool[] = profile === "full" ? [...FULL_META_TOOLS, ...REGISTRY_TOOLS] : AGENT_TOOLS;

export const OPEROZ_TOOL_COUNT = OPEROZ_TOOLS.length;
export const OPEROZ_MCP_PROFILE = profile;
export const OPEROZ_REGISTRY_OPERATION_COUNT = ALL_OPERATIONS.length;
