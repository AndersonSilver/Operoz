import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import { META_TOOLS } from "./registry/meta.js";
import { operationToMcpTool } from "./registry/schema.js";
import { ALL_OPERATIONS } from "./registry/index.js";

const REGISTRY_TOOLS: Tool[] = ALL_OPERATIONS.map(operationToMcpTool);

/** Ferramentas expostas ao Cursor / agentes MCP */
export const OPERIS_TOOLS: Tool[] = [...META_TOOLS, ...REGISTRY_TOOLS];

export const OPERIS_TOOL_COUNT = OPERIS_TOOLS.length;
