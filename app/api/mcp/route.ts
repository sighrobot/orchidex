import { NextRequest, NextResponse } from 'next/server';

import {
  ERRORS,
  handleMessage,
  JsonRpcMessage,
  rpcError,
  SUPPORTED_PROTOCOL_VERSIONS,
  TOOLS,
} from 'lib/mcp/server';

// Orchidex MCP server, Streamable HTTP transport (stateless, JSON responses).
// Connect an MCP client to https://<host>/api/mcp. Tools live in lib/mcp.

export const dynamic = 'force-dynamic';
// Deep progeny walks can take a while on large genera.
export const maxDuration = 60;

// Read-only public data with no cookies or credentials, so any origin may
// call it (browser-based MCP clients and inspectors included).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CORS });

export async function POST(req: NextRequest) {
  const version = req.headers.get('mcp-protocol-version');
  if (version && !SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    return json(
      rpcError(
        null,
        ERRORS.INVALID_REQUEST,
        `Unsupported MCP-Protocol-Version ${version}. Supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')}.`,
      ),
      400,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(rpcError(null, ERRORS.PARSE, 'Parse error: body is not JSON.'), 400);
  }

  const ctx = { baseUrl: req.nextUrl.origin };
  const isBatch = Array.isArray(body);
  const messages = (isBatch ? body : [body]) as JsonRpcMessage[];

  if (messages.length === 0) {
    return json(rpcError(null, ERRORS.INVALID_REQUEST, 'Empty batch.'), 400);
  }

  const responses = (
    await Promise.all(messages.map((m) => handleMessage(m, ctx)))
  ).filter(Boolean);

  // Only notifications or responses: accepted, nothing to say.
  if (responses.length === 0) {
    return new NextResponse(null, { status: 202, headers: CORS });
  }

  return json(isBatch ? responses : responses[0]);
}

// GET would open a server-to-client event stream, which a stateless server
// doesn't offer (the spec allows 405). The body describes the server for
// anyone who opens the URL in a browser.
export function GET() {
  return NextResponse.json(
    {
      name: 'Orchidex MCP server',
      transport: 'streamable-http',
      usage: 'POST JSON-RPC 2.0 messages to this URL from an MCP client.',
      protocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
      tools: TOOLS.map((t) => ({ name: t.name, title: t.title })),
    },
    { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } },
  );
}

// No sessions to end.
export function DELETE() {
  return new NextResponse(null, {
    status: 405,
    headers: { ...CORS, Allow: 'POST, OPTIONS' },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
