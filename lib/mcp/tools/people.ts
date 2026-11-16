import { queryPerson, searchPeople } from 'lib/queries/people';

import { toSummary } from '../format';
import { defineTool, limit, ToolError } from '../tool';

export const findPeople = defineTool({
  name: 'find_people',
  title: 'Find registrants and originators',
  description:
    'Find people and nurseries in the register by name (accent- and case-insensitive, matches anywhere in the name). The same grower often appears under several spellings, so this returns every matching name with how many hybrids it registered and originated. Pass an exact name to get_person.',
  inputSchema: {
    properties: {
      query: {
        type: 'string',
        minLength: 2,
        maxLength: 200,
        description: 'Part of a name, e.g. "Lines" or "Orchid Zone".',
      },
      limit: limit(20, 100),
    },
    required: ['query'],
  },
  async handler({ query, limit }) {
    const people = await searchPeople(query, limit);
    return { returned: people.length, people };
  },
});

export const getPerson = defineTool({
  name: 'get_person',
  title: 'Get person profile',
  description:
    'Profile of a registrant (who registered hybrids with the RHS) or originator (who made the cross): how many hybrids they registered and originated, years active, registrations per decade, genera they work in, the parents they use most and their latest registrations. Name must match exactly as registered; use find_people first if unsure.',
  inputSchema: {
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Exact registrant or originator name.',
      },
      recent_limit: {
        ...limit(10, 100),
        description: 'How many of their latest registrations to list (default 10).',
      },
    },
    required: ['name'],
  },
  async handler({ name, recent_limit }, { baseUrl }) {
    const profile = await queryPerson(name, { recentLimit: recent_limit });
    if (!profile) {
      throw new ToolError(
        `No registrant or originator is named exactly "${name}". Use find_people to look up the spelling.`,
      );
    }
    return {
      ...profile,
      recent: profile.recent.map(toSummary),
      url: `${baseUrl}/registrant/${encodeURIComponent(name)}`,
    };
  },
});
