import { kebabCase } from 'lodash';

import {
  getDescriptor,
  isIntergeneric,
  isNaturalHybrid,
  isPrimary,
  isSpecies,
} from 'lib/classify';
import { formatName } from 'lib/string';
import { Grex } from 'lib/types';

// The shapes MCP tools return. Raw registry rows use RHS column names and
// empty strings for missing values; agents get plain names, nulls, a
// classification and a link to the page on Orchidex.

export type OrchidKind = 'species' | 'natural' | 'primary' | 'complex';

export type ParentRef = {
  id: string | null;
  name: string;
} | null;

export type Orchid = {
  id: string;
  name: string;
  abbreviated_name: string;
  genus: string;
  epithet: string;
  // species; or for hybrids: natural (arose in the wild), primary (both
  // parents species) or complex (at least one parent is a hybrid).
  kind: OrchidKind;
  intergeneric: boolean;
  description: string;
  seed_parent: ParentRef;
  pollen_parent: ParentRef;
  registrant: string | null;
  originator: string | null;
  registered: string | null;
  url: string;
};

const orNull = (s?: string | null) => (s && s.trim() ? s.trim() : null);

export const orchidPath = (g: Pick<Grex, 'genus' | 'epithet' | 'id'>) => {
  const { long } = formatName(g);
  return `/${kebabCase(long.genus)}/${kebabCase(long.epithet)}/${g.id}`;
};

export const kindOf = (g: Grex): OrchidKind =>
  isSpecies(g)
    ? 'species'
    : isNaturalHybrid(g)
    ? 'natural'
    : isPrimary(g)
    ? 'primary'
    : 'complex';

const parent = (genus?: string, epithet?: string, id?: string): ParentRef =>
  orNull(epithet)
    ? { id: orNull(id), name: `${(genus ?? '').trim()} ${epithet!.trim()}` }
    : null;

export function toOrchid(g: Grex, baseUrl: string): Orchid {
  const name = formatName(g);
  const kind = kindOf(g);
  const hasParents = !!(orNull(g.seed_parent_epithet) && orNull(g.pollen_parent_epithet));

  return {
    id: g.id,
    name: name.long.full.trim(),
    abbreviated_name: name.short.full.trim(),
    genus: g.genus?.trim(),
    epithet: g.epithet?.trim(),
    kind,
    intergeneric: hasParents && !!isIntergeneric(g),
    description: kind === 'species' ? 'a species' : getDescriptor(g),
    seed_parent: parent(g.seed_parent_genus, g.seed_parent_epithet, g.seed_parent_id),
    pollen_parent: parent(
      g.pollen_parent_genus,
      g.pollen_parent_epithet,
      g.pollen_parent_id,
    ),
    registrant: orNull(g.registrant_name),
    originator: orNull(g.originator_name),
    registered: orNull(g.date_of_registration),
    url: `${baseUrl}${orchidPath(g)}`,
  };
}

// A shorter form for long lists: drops what's derivable or rarely needed.
export type OrchidSummary = Pick<
  Orchid,
  'id' | 'name' | 'kind' | 'registrant' | 'registered'
> & { parentage: string | null };

export function toSummary(g: Grex): OrchidSummary {
  const o = toOrchid(g, '');
  return {
    id: o.id,
    name: o.name,
    kind: o.kind,
    parentage:
      o.seed_parent && o.pollen_parent
        ? `${o.seed_parent.name} × ${o.pollen_parent.name}`
        : null,
    registrant: o.registrant,
    registered: o.registered,
  };
}

// Paging fields every list result carries.
export const page = (total: number, offset: number, returned: number) => ({
  total,
  returned,
  offset,
  next_offset: offset + returned < total ? offset + returned : null,
});

export const percent = (fraction: number) =>
  Math.round(fraction * 10000) / 100;
