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
