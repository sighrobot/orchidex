import { ABBR_TO_GENUS, GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { resolveGenusName, queryWcvpTaxon } from 'lib/queries/genera';
import { queryGrexById } from 'lib/queries/grex';
import { queryChildCount, queryCross } from 'lib/queries/lineage';
import { searchRegistry } from 'lib/queries/search';
import { SearchParams } from 'lib/search/params';
import { capitalize } from 'lib/utils';

import { page, toOrchid } from '../format';
import { resolveOrchid } from '../resolve';
import { DATE, defineTool, limit, OFFSET, ORCHID_REF } from '../tool';

// Splits "Paph. Maudiae" into genus and epithet. A single word is a genus if
// it names (or abbreviates) one, otherwise an epithet.
function splitName(raw: string): { genus?: string; epithet?: string } {
  const [first, ...rest] = raw.trim().split(/\s+/);
  if (rest.length) return { genus: resolveGenusName(first), epithet: rest.join(' ') };
  const asGenus = capitalize(first.replace(/\.$/, '').toLowerCase());
  return GENUS_TO_ABBREVIATION[asGenus] || ABBR_TO_GENUS[`${asGenus}.`]
    ? { genus: resolveGenusName(first) }
    : { epithet: first };
}

const KINDS = ['species', 'hybrid', 'primary', 'complex', 'natural'] as const;

export const searchOrchids = defineTool({
  name: 'search_orchids',
  title: 'Search orchids',
  description: `Search the RHS orchid register (species and registered hybrids) by name, parentage, people, type and registration date. All filters combine with AND. Text filters match anywhere in the field, case- and accent-insensitive; wrap a value in double quotes for an exact match (e.g. genus: "\\"Phalaenopsis\\""). Use this to find candidates, then get_orchid, get_ancestry or get_progeny with an id. Returns { total, results, next_offset }.`,
  inputSchema: {
    properties: {
      query: {
        type: 'string',
        maxLength: 200,
        description:
          'Free text over names and people, ranked by relevance. Genus abbreviations work ("paph rothsch").',
      },
      genus: { type: 'string', maxLength: 100, description: 'Genus name.' },
      epithet: {
        type: 'string',
        maxLength: 200,
        description: 'Species or grex epithet, e.g. "Maudiae".',
      },
      parent: {
        type: 'string',
        maxLength: 200,
        description:
          'A parent, as "Genus epithet", a genus, or an epithet. Matches either seed or pollen parent.',
      },
      other_parent: {
        type: 'string',
        maxLength: 200,
        description:
          'The second parent, same format. With parent, finds crosses of the two in either direction.',
      },
      registrant: {
        type: 'string',
        maxLength: 200,
        description: 'Who registered it (person or nursery).',
      },
      originator: {
        type: 'string',
        maxLength: 200,
        description: 'Who made the cross.',
      },
      kind: {
        type: 'string',
        enum: KINDS,
        description:
          'species; hybrid (any); primary (both parents species); complex (a parent is a hybrid); natural (natural hybrid).',
      },
      intergeneric: {
        type: 'boolean',
        description: 'Only hybrids whose parents are from different genera.',
      },
      registered_from: { ...DATE, description: 'Registered on or after (YYYY-MM-DD).' },
      registered_to: { ...DATE, description: 'Registered on or before (YYYY-MM-DD).' },
      sort: {
        type: 'string',
        enum: ['relevance', 'newest', 'oldest', 'name'],
        description:
          'Default: relevance with query, otherwise newest. Species have no registration date and sort last by date.',
      },
      limit: limit(25, 100),
      offset: OFFSET,
    },
  },
  async handler(a, { baseUrl }) {
    const p: SearchParams = {};
    if (a.query) p.q = a.query;
    if (a.genus) p.genus = a.genus.startsWith('"') ? a.genus : resolveGenusName(a.genus);
    if (a.epithet) p.epithet = a.epithet;
    if (a.registrant) p.registrant = a.registrant;
    if (a.originator) p.originator = a.originator;
    if (a.parent) {
      const { genus, epithet } = splitName(a.parent);
      p.g1 = genus;
      p.e1 = epithet;
    }
    if (a.other_parent) {
      const { genus, epithet } = splitName(a.other_parent);
      p.g2 = genus;
      p.e2 = epithet;
    }
    switch (a.kind) {
      case 'species':
      case 'hybrid':
        p.type = a.kind;
        break;
      case 'primary':
      case 'complex':
        p.type = 'hybrid';
        p.origin = a.kind;
        break;
      case 'natural':
        p.type = 'hybrid';
        p.origin = 'primary';
        p.natural = true;
        break;
    }
    if (a.intergeneric) {
      p.type = 'hybrid';
      p.intergeneric = true;
    }
    if (a.registered_from) p.from = a.registered_from;
    if (a.registered_to) p.to = a.registered_to;
    if (a.sort) p.sort = a.sort;

    const { results, total } = await searchRegistry(p, {
      limit: a.limit,
      offset: a.offset,
    });

    return {
      ...page(total, a.offset, results.length),
      results: results.map((g) => toOrchid(g, baseUrl)),
    };
  },
});

export const getOrchid = defineTool({
  name: 'get_orchid',
  title: 'Get orchid',
  description:
    'Full record for one orchid species or hybrid: classification, both parents (with their own records), registrant, originator, registration date, how many registered hybrids use it as a parent, and for species the botanical details from the World Checklist of Vascular Plants (author, native range, life form, climate). Accepts an id or a name.',
  inputSchema: {
    properties: { orchid: ORCHID_REF },
    required: ['orchid'],
  },
  async handler({ orchid }, { baseUrl }) {
    const grex = await resolveOrchid(orchid);
    const o = toOrchid(grex, baseUrl);

    const parentIds = [grex.seed_parent_id, grex.pollen_parent_id].filter(
      Boolean,
    ) as string[];

    const [parents, childCount, wcvp] = await Promise.all([
      parentIds.length ? queryGrexById(parentIds.join(',')) : [],
      queryChildCount(grex.id),
      o.kind === 'species' ? queryWcvpTaxon(o.genus, o.epithet) : null,
    ]);
    const byId = new Map(
      parents.map((p) => [p.id, toOrchid(p, baseUrl)] as const),
    );

    return {
      ...o,
      seed_parent: o.seed_parent && {
        ...o.seed_parent,
        record: (o.seed_parent.id && byId.get(o.seed_parent.id)) || null,
      },
      pollen_parent: o.pollen_parent && {
        ...o.pollen_parent,
        record: (o.pollen_parent.id && byId.get(o.pollen_parent.id)) || null,
      },
      registered_offspring: childCount,
      taxonomy: wcvp && {
        accepted_name: wcvp.taxon_name ?? null,
        rank: wcvp.taxon_rank ?? null,
        status: wcvp.taxon_status ?? null,
        author: wcvp.primary_author ?? null,
        first_published: wcvp.first_published ?? null,
        native_range: wcvp.geographic_area ?? null,
        life_form: wcvp.lifeform_description ?? null,
        climate: wcvp.climate_description ?? null,
        source: 'World Checklist of Vascular Plants (WCVP), Royal Botanic Gardens, Kew',
      },
    };
  },
});

export const findCross = defineTool({
  name: 'find_cross',
  title: 'Find a cross',
  description:
    'Has this cross been registered? Looks up registered hybrids of two given parents, in either direction (seed × pollen or pollen × seed). Give the same orchid twice to look for a selfing. When nothing is registered, says so and reports how often each parent has been used, which helps judge whether the cross is novel.',
  inputSchema: {
    properties: {
      parent_a: ORCHID_REF,
      parent_b: ORCHID_REF,
    },
    required: ['parent_a', 'parent_b'],
  },
  async handler({ parent_a, parent_b }, { baseUrl }) {
    const [a, b] = await Promise.all([
      resolveOrchid(parent_a),
      resolveOrchid(parent_b),
    ]);
    const crosses = await queryCross(a.id, b.id);

    const result: Record<string, unknown> = {
      parent_a: toOrchid(a, baseUrl),
      parent_b: toOrchid(b, baseUrl),
      registered: crosses.length > 0,
      crosses: crosses.map((g) => ({
        ...toOrchid(g, baseUrl),
        direction:
          g.seed_parent_id === a.id ? 'parent_a × parent_b' : 'parent_b × parent_a',
      })),
    };

    if (!crosses.length) {
      const [aCount, bCount] = await Promise.all([
        queryChildCount(a.id),
        queryChildCount(b.id),
      ]);
      result.parent_a_offspring = aCount;
      result.parent_b_offspring = bCount;
    }

    return result;
  },
});
