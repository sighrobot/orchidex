import { APP_DESCRIPTION, APP_TITLE } from 'lib/constants';

import { ToolContext, ToolError, validateArgs } from './tool';
import { getAncestry, getProgeny } from './tools/lineage';
import { getGenus, listGenera } from './tools/genera';
import { findCross, getOrchid, searchOrchids } from './tools/orchids';
import { findPeople, getPerson } from './tools/people';
import {
  getRecentRegistrations,
  getRegistrationTrends,
  getRegistryOverview,
} from './tools/registry';

// A stateless Model Context Protocol server: JSON-RPC 2.0 messages in, JSON
// responses out (the Streamable HTTP transport's JSON response mode). No
// sessions, so it runs fine on serverless functions.
// Spec: https://modelcontextprotocol.io/specification/2025-06-18

export const SUPPORTED_PROTOCOL_VERSIONS = [
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
];

const SERVER_INFO = {
  name: 'orchidex',
  title: APP_TITLE,
  version: '1.0.0',
};

const INSTRUCTIONS = `${APP_DESCRIPTION}

Data: the Royal Horticultural Society (RHS) International Orchid Register (every registered orchid hybrid, or grex, plus the species used as parents) and the World Checklist of Vascular Plants for species taxonomy.

Orchids are referenced by id or by "Genus epithet" name; RHS genus abbreviations ("Paph.", "Phal.", "Blc.") work anywhere a genus is expected. Species epithets are lowercase (Phalaenopsis amabilis); grex epithets are capitalized (Paphiopedilum Maudiae).

Typical flows:
- Identify an orchid: search_orchids → get_orchid.
- Pedigree and genetic makeup: get_ancestry. Descendants and breeding influence: get_progeny.
- Is a cross new? find_cross.
- Genus questions: list_genera, get_genus, get_registration_trends.
- Growers and nurseries: find_people → get_person.
- What's new: get_recent_registrations. Big picture: get_registry_overview.

Every orchid, genus and person result carries a url to its page on Orchidex; link to it when presenting results.`;

// Grouped as the instructions above describe them.
export const TOOLS = [
  // Find and identify orchids
  searchOrchids,
  getOrchid,
  findCross,
  // Lineage
  getAncestry,
  getProgeny,
  // Genera
  listGenera,
  getGenus,
  // People
  findPeople,
  getPerson,
  // The register as a whole
  getRegistryOverview,
  getRecentRegistrations,
  getRegistrationTrends,
];

const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

type JsonRpcId = string | number | null;

export type JsonRpcMessage = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: any;
};

export type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | {
      jsonrpc: '2.0';
      id: JsonRpcId;
      error: { code: number; message: string; data?: unknown };
    };

export const ERRORS = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

export const rpcError = (
  id: JsonRpcId,
  code: number,
  message: string,
): JsonRpcResponse => ({ jsonrpc: '2.0', id, error: { code, message } });

const ok = (id: JsonRpcId, result: unknown): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  result,
});

// Handles one message. Returns null for notifications and responses, which
// get no reply.
export async function handleMessage(
  msg: JsonRpcMessage,
  ctx: ToolContext,
): Promise<JsonRpcResponse | null> {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
    return rpcError(msg?.id ?? null, ERRORS.INVALID_REQUEST, 'Invalid JSON-RPC message.');
  }

  // A notification (no id) or a response to something we never sent.
  if (msg.id === undefined || !msg.method) return null;

  const { id, method, params } = msg;

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      return ok(id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : SUPPORTED_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations,
        })),
      });

    case 'tools/call': {
      const tool = TOOLS_BY_NAME.get(params?.name);
      if (!tool) {
        return rpcError(id, ERRORS.INVALID_PARAMS, `Unknown tool: ${params?.name}`);
      }
      return ok(id, await callTool(tool.name, params?.arguments, ctx));
    }

    // Declared empty rather than unsupported, so clients that probe for them
    // don't log errors.
    case 'resources/list':
      return ok(id, { resources: [] });
    case 'resources/templates/list':
      return ok(id, { resourceTemplates: [] });
    case 'prompts/list':
      return ok(id, { prompts: [] });

    default:
      return rpcError(id, ERRORS.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

// Runs a tool. Bad input and "not found" come back as tool errors the model
// can read and recover from; anything unexpected is logged and reported
// generically.
export async function callTool(name: string, rawArgs: unknown, ctx: ToolContext) {
  const tool = TOOLS_BY_NAME.get(name)!;

  try {
    const args = validateArgs(tool.inputSchema, rawArgs);
    const result = await tool.handler(args, ctx);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
      isError: false,
    };
  } catch (e) {
    const message =
      e instanceof ToolError
        ? e.message
        : 'The Orchidex database could not answer this request. Try again shortly.';
    if (!(e instanceof ToolError)) console.error(`[mcp] ${name} failed`, e);
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}
