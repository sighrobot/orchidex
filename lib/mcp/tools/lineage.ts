import {
  MAX_PROGENY_GENERATIONS,
  ProgenySort,
  queryAncestry,
  queryProgeny,
} from 'lib/queries/lineage';

import { page, percent, toOrchid, toSummary } from '../format';
import { resolveOrchid } from '../resolve';
import { defineTool, limit, OFFSET, ORCHID_REF } from '../tool';

export const getAncestry = defineTool({
  name: 'get_ancestry',
  title: 'Get ancestry',
  description: `Full pedigree of an orchid hybrid, traced through every registered generation back to the species it descends from. Returns:
- species_composition: the founding species (and any ancestors whose own parents aren't on record) with the percentage of the hybrid's genome each contributed, counting every line of descent (each generation back halves the share).
- unresolved_percent: share coming from parents missing from the registry.
- ancestors: every ancestor with its nearest generation (1 = parent, 2 = grandparent…), its percentage and how many lines of descent lead to it.
- generations: how many generations deep the pedigree goes.
Species have no ancestry; use get_orchid for them.`,
  inputSchema: {
    properties: {
      orchid: ORCHID_REF,
      max_ancestors: {
        ...limit(50, 1000),
        description:
          'Maximum ancestors to list, nearest generations first (default 50). species_composition is always complete.',
      },
    },
    required: ['orchid'],
  },
  async handler({ orchid, max_ancestors }, { baseUrl }) {
    const grex = await resolveOrchid(orchid);
    const rows = await queryAncestry(grex.id);
    const ancestors = rows.filter((r) => r.id !== grex.id);

    const founders = rows
      .filter((r) => r.id !== grex.id && !r.seed_parent_id && !r.pollen_parent_id)
      .sort((a, b) => b.contribution - a.contribution);
    const resolved = founders.reduce((sum, r) => sum + r.contribution, 0);

    return {
      orchid: toOrchid(grex, baseUrl),
      generations: rows.reduce((max, r) => Math.max(max, r.max_depth), 0),
      ancestor_count: ancestors.length,
      species_composition: founders.map((r) => ({
        ...toSummary(r),
        percent: percent(r.contribution),
        lines_of_descent: r.paths,
      })),
      unresolved_percent: ancestors.length ? percent(Math.max(0, 1 - resolved)) : 0,
      ancestors: ancestors.slice(0, max_ancestors).map((r) => ({
        ...toSummary(r),
        generation: r.min_depth,
        percent: percent(r.contribution),
        lines_of_descent: r.paths,
      })),
      ancestors_truncated: ancestors.length > max_ancestors,
    };
  },
});

export const getProgeny = defineTool({
  name: 'get_progeny',
  title: 'Get progeny',
  description: `Registered hybrids descended from an orchid. generations=1 (default) lists its direct offspring; higher values also include grandchildren and beyond, each listed once at its nearest generation. Each result includes how many registered offspring it has in turn, so sort=most_progeny surfaces the most influential descendants. Returns { total, by_generation, results, next_offset }.`,
  inputSchema: {
    properties: {
      orchid: ORCHID_REF,
      generations: {
        type: 'integer',
        minimum: 1,
        maximum: MAX_PROGENY_GENERATIONS,
        default: 1,
        description: `How many generations down to go (1–${MAX_PROGENY_GENERATIONS}, default 1). Popular species have tens of thousands of descendants beyond a few generations.`,
      },
      sort: {
        type: 'string',
        enum: ['newest', 'oldest', 'name', 'most_progeny'],
        default: 'newest',
        description: 'Order within each generation (default newest).',
      },
      limit: limit(50, 200),
      offset: OFFSET,
    },
    required: ['orchid'],
  },
  async handler({ orchid, generations, sort, limit, offset }, { baseUrl }) {
    const grex = await resolveOrchid(orchid);
    const { total, by_generation, results } = await queryProgeny(grex.id, {
      generations,
      sort: sort as ProgenySort,
      limit,
      offset,
    });

    return {
      orchid: toOrchid(grex, baseUrl),
      ...page(total, offset, results.length),
      by_generation,
      results: results.map((r) => ({
        ...toSummary(r),
        generation: r.generation,
        registered_offspring: r.child_count,
      })),
    };
  },
});
