import { queryGrexById } from 'lib/queries/grex';
import { resolveGenusName } from 'lib/queries/genera';
import { searchRegistry } from 'lib/queries/search';
import { Grex } from 'lib/types';

import { toSummary } from './format';
import { ToolError } from './tool';

// Turns an orchid reference (an id, or "Genus epithet") into one registry
// record. When a name is ambiguous or misspelled, the error lists candidates
// so the agent can retry with an id.

const ID = /^\d+$/;

export async function resolveOrchid(ref: string): Promise<Grex> {
  const trimmed = ref.trim();

  if (ID.test(trimmed)) {
    const [grex] = await queryGrexById(trimmed);
    if (!grex) throw new ToolError(`No orchid has id ${trimmed}.`);
    return grex;
  }

  const [first, ...rest] = trimmed.split(/\s+/);
  const epithet = rest.join(' ');

  if (epithet) {
    const genus = resolveGenusName(first);
    const { results } = await searchRegistry(
      { genus: `"${genus}"`, epithet: `"${epithet}"` },
      { limit: 10 },
    );
    if (results.length === 1) return results[0];
    if (results.length > 1) throw ambiguous(trimmed, results);
  }

  // Nothing exact: offer the closest text matches.
  const { results } = await searchRegistry({ q: trimmed }, { limit: 10 });
  if (results.length === 0) {
    throw new ToolError(
      `No orchid matches "${trimmed}". Try search_orchids with part of the name.`,
    );
  }
  throw ambiguous(trimmed, results, 'No exact match for');
}

function ambiguous(ref: string, matches: Grex[], lead = 'Several orchids match') {
  const list = matches
    .map((g) => {
      const s = toSummary(g);
      return `- ${s.name} (id ${s.id}, ${s.kind}${
        s.parentage ? `, ${s.parentage}` : ''
      })`;
    })
    .join('\n');
  return new ToolError(
    `${lead} "${ref}". Call again with one of these ids:\n${list}`,
  );
}
