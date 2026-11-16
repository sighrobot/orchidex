import { resolveGenusName } from 'lib/queries/genera';
import {
  queryOverview,
  queryRecent,
  queryTrends,
  TrendBucket,
} from 'lib/queries/registry';

import { toOrchid } from '../format';
import { DATE, defineTool, limit } from '../tool';

export const getRegistryOverview = defineTool({
  name: 'get_registry_overview',
  title: 'Registry overview',
  description:
    'Headline numbers for the whole RHS orchid register as held by Orchidex: total records, registered hybrids, species, natural hybrids, synonyms, genera and registrants, the date range of registrations and how many were registered this year and last. Also states the data sources. A good first call to orient yourself.',
  inputSchema: { properties: {} },
  async handler() {
    return {
      ...(await queryOverview()),
      sources: [
        'Royal Horticultural Society (RHS) International Orchid Register',
        'World Checklist of Vascular Plants (WCVP), Royal Botanic Gardens, Kew',
      ],
    };
  },
});

export const getRecentRegistrations = defineTool({
  name: 'get_recent_registrations',
  title: 'Recent registrations',
  description:
    'The newest hybrid registrations, newest first. Without since, returns the week leading up to the most recent registration date in the register (the RHS publishes in batches, so this may not be this week). Reports that latest date too.',
  inputSchema: {
    properties: {
      genus: {
        type: 'string',
        maxLength: 100,
        description: 'Only this genus (name or RHS abbreviation).',
      },
      since: { ...DATE, description: 'Registered on or after (YYYY-MM-DD).' },
      limit: limit(50, 500),
    },
  },
  async handler({ genus, since, limit }, { baseUrl }) {
    const { latest, since: from, results } = await queryRecent({
      genus: genus ? resolveGenusName(genus) : undefined,
      since,
      limit,
    });
    return {
      latest_registration_date: latest,
      since: from,
      returned: results.length,
      results: results.map((g) => toOrchid(g, baseUrl)),
    };
  },
});

export const getRegistrationTrends = defineTool({
  name: 'get_registration_trends',
  title: 'Registration trends',
  description:
    'How many hybrids were registered per year or per decade, for the whole register, one genus, or one person (registrant or originator, exact name). Use it to chart popularity over time or compare genera; call once per series. Also returns the peak period and the total.',
  inputSchema: {
    properties: {
      by: {
        type: 'string',
        enum: ['year', 'decade'],
        default: 'decade',
        description: 'Bucket size (default decade).',
      },
      genus: {
        type: 'string',
        maxLength: 100,
        description: 'Only this genus (name or RHS abbreviation).',
      },
      person: {
        type: 'string',
        maxLength: 200,
        description: 'Only this registrant or originator (exact name).',
      },
    },
  },
  async handler({ by, genus, person }) {
    const resolvedGenus = genus ? resolveGenusName(genus) : undefined;
    const series = await queryTrends({
      bucket: by as TrendBucket,
      genus: resolvedGenus,
      person,
    });
    const peak = series.reduce<(typeof series)[number] | null>(
      (best, s) => (!best || s.count > best.count ? s : best),
      null,
    );
    return {
      by,
      genus: resolvedGenus ?? null,
      person: person ?? null,
      total: series.reduce((sum, s) => sum + s.count, 0),
      peak,
      series,
    };
  },
});
