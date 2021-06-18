const DEFAULT_APP_URL = `https://${process.env.VERCEL_URL || "grex.es"}`;
export const APP_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : new URL(DEFAULT_APP_URL).origin;

export const CROSS_FIELDS = ["g1", "e1", "g2", "e2"];

export const SEARCH_FIELDS = [
  "genus",
  "epithet",
  "registrant_name",
  "originator_name",
  "date_of_registration",
  "seed_parent_genus",
  "seed_parent_epithet",
  "pollen_parent_genus",
  "pollen_parent_epithet",
  "id",
  "synonym_flag",
  "synonym_genus_name",
  "synonym_epithet_name",
];

export const NORMALIZED_SEARCH_FIELDS = [
  "epithet",
  "registrant_name",
  "originator_name",
  "seed_parent_epithet",
  "pollen_parent_epithet",
];