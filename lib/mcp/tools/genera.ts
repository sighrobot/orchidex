import {
  abbreviationFor,
  queryGenera,
  queryGenus,
  resolveGenusName,
} from 'lib/queries/genera';

import { toSummary } from '../format';
import { defineTool, limit, ToolError } from '../tool';

export const listGenera = defineTool({
  name: 'list_genera',
  title: 'List genera',
  description:
    'Orchid genera in the RHS register with how many species and hybrids each holds, largest first, and the official RHS abbreviation (e.g. Paphiopedilum → Paph.). Includes man-made intergeneric genera such as Rhyncholaeliocattleya. Use query to filter by name.',
  inputSchema: {
    properties: {
      query: {
        type: 'string',
        maxLength: 100,
        description: 'Only genera whose name contains this text.',
      },
      limit: limit(50, 1000),
    },
  },
  async handler({ query, limit }) {
    const { total, genera } = await queryGenera(query, limit);
    return {
      total,
      returned: genera.length,
      genera: genera.map(({ genus, count }) => ({
        genus,
        abbreviation: abbreviationFor(genus),
        records: count,
      })),
    };
  },
});

export const getGenus = defineTool({
  name: 'get_genus',
  title: 'Get genus profile',
  description:
    'Profile of one genus: counts of species and hybrids, intergeneric hybrids, accepted species per the World Checklist of Vascular Plants, first and latest registration, registrations per decade, top registrants, the orchids most used as parents (as seed and as pollen parent) and the latest registrations. Accepts a full name or RHS abbreviation ("Phal.", "Paph").',
  inputSchema: {
    properties: {
      genus: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Genus name or RHS abbreviation.',
      },
    },
    required: ['genus'],
  },
  async handler({ genus: raw }, { baseUrl }) {
    const genus = resolveGenusName(raw);
    const profile = await queryGenus(genus);
    if (!profile) {
      throw new ToolError(
        `No genus "${genus}" in the register. Use list_genera with a query to find the spelling.`,
      );
    }
    return {
      ...profile,
      abbreviation: abbreviationFor(genus),
      recent: profile.recent.map(toSummary),
      url: `${baseUrl}/${genus.toLowerCase()}`,
      parentage_chart_url: `${baseUrl}/learn/parentage/${genus.toLowerCase()}`,
    };
  },
});
