export const APP_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.VERCEL_URL || "https://grex.es";

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
];
