// A small, dependency-free tool definition for the MCP server: a JSON Schema
// for the arguments (the subset below), a handler, and the validation that
// keeps handlers from seeing anything the schema doesn't allow.

export type JsonSchema =
  | {
      type: 'string';
      description?: string;
      enum?: readonly string[];
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      default?: string;
    }
  | {
      type: 'integer';
      description?: string;
      minimum?: number;
      maximum?: number;
      default?: number;
    }
  | { type: 'boolean'; description?: string; default?: boolean };

export type ObjectSchema = {
  type: 'object';
  properties: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: false;
};

export type ToolContext = {
  // Origin of the incoming request, e.g. https://orchidex.org. Used to build
  // links back to the site.
  baseUrl: string;
};

export type ToolAnnotations = {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: ObjectSchema;
  annotations?: ToolAnnotations;
  handler: (args: Record<string, any>, ctx: ToolContext) => Promise<unknown>;
};

// Every Orchidex tool only reads a closed dataset.
const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export function defineTool(
  tool: Omit<Tool, 'annotations' | 'inputSchema'> & {
    inputSchema: Omit<ObjectSchema, 'type'>;
  },
): Tool {
  return {
    ...tool,
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      ...tool.inputSchema,
    },
    annotations: { title: tool.title, ...READ_ONLY },
  };
}

// A failure the caller should see and can act on (bad input, nothing found).
// Reported as a tool result with isError, not a protocol error.
export class ToolError extends Error {}

// Checks `raw` against the schema, applying defaults. Integers given as
// numeric strings are accepted, since some clients send everything as text.
export function validateArgs(
  schema: ObjectSchema,
  raw: unknown,
): Record<string, any> {
  if (raw != null && (typeof raw !== 'object' || Array.isArray(raw))) {
    throw new ToolError('Arguments must be an object.');
  }
  const input = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, any> = {};

  for (const key of Object.keys(input)) {
    if (!(key in schema.properties)) {
      throw new ToolError(
        `Unknown argument "${key}". Expected: ${Object.keys(
          schema.properties,
        ).join(', ')}.`,
      );
    }
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    let value = input[key];

    if (value === undefined || value === null || value === '') {
      if (schema.required?.includes(key)) {
        throw new ToolError(`Missing required argument "${key}".`);
      }
      if (prop.default !== undefined) out[key] = prop.default;
      continue;
    }

    switch (prop.type) {
      case 'string': {
        if (typeof value !== 'string') {
          throw new ToolError(`"${key}" must be a string.`);
        }
        value = value.trim();
        const s = value as string;
        if (prop.enum && !prop.enum.includes(s)) {
          throw new ToolError(
            `"${key}" must be one of: ${prop.enum.join(', ')}.`,
          );
        }
        if (prop.pattern && !new RegExp(prop.pattern).test(s)) {
          throw new ToolError(`"${key}" must match ${prop.pattern}.`);
        }
        if (prop.minLength != null && s.length < prop.minLength) {
          throw new ToolError(
            `"${key}" must be at least ${prop.minLength} characters.`,
          );
        }
        if (prop.maxLength != null && s.length > prop.maxLength) {
          throw new ToolError(
            `"${key}" must be at most ${prop.maxLength} characters.`,
          );
        }
        out[key] = s;
        break;
      }
      case 'integer': {
        const n =
          typeof value === 'string' && /^-?\d+$/.test(value.trim())
            ? Number(value)
            : value;
        if (typeof n !== 'number' || !Number.isInteger(n)) {
          throw new ToolError(`"${key}" must be an integer.`);
        }
        if (prop.minimum != null && n < prop.minimum) {
          throw new ToolError(`"${key}" must be at least ${prop.minimum}.`);
        }
        if (prop.maximum != null && n > prop.maximum) {
          throw new ToolError(`"${key}" must be at most ${prop.maximum}.`);
        }
        out[key] = n;
        break;
      }
      case 'boolean': {
        const b = value === 'true' ? true : value === 'false' ? false : value;
        if (typeof b !== 'boolean') {
          throw new ToolError(`"${key}" must be true or false.`);
        }
        out[key] = b;
        break;
      }
    }
  }

  return out;
}

// Reusable argument schemas.
export const ORCHID_REF: JsonSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 200,
  description:
    'An orchid: its Orchidex/RHS id (e.g. "12345"), or its name as "Genus epithet". Genus abbreviations work ("Paph. Maudiae", "Phal amabilis"). Names are case- and accent-insensitive.',
};

export const DATE: JsonSchema = {
  type: 'string',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
};

export const limit = (def: number, max: number): JsonSchema => ({
  type: 'integer',
  minimum: 1,
  maximum: max,
  default: def,
  description: `Maximum results to return (1–${max}, default ${def}).`,
});

export const OFFSET: JsonSchema = {
  type: 'integer',
  minimum: 0,
  default: 0,
  description: 'Results to skip, for paging. Use the returned next_offset.',
};
