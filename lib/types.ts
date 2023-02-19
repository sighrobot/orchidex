import type { CSSProperties } from 'react';

export type BaseProps = {
  className?: string;
  style?: CSSProperties;
};

export type Grex = {
  id: string;
  genus: string;
  epithet: string;
  originator_name: string;
  registrant_name: string;
  date_of_registration: string;
  seed_parent_genus?: string;
  seed_parent_epithet?: string;
  pollen_parent_genus?: string;
  pollen_parent_epithet?: string;
};

export type Stat =
  | 'registrant_genus_pct'
  | 'seed_parent_registrants'
  | 'pollen_parent_registrants'
  | 'seed_parent_originators'
  | 'pollen_parent_originators'
  | 'year_genus_pct';
