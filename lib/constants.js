export const S3_SELECT_PARAMS = {
  Bucket: "orchidex",
  Key: "data.tsv",
  ExpressionType: "SQL",
  InputSerialization: {
    CSV: {
      FileHeaderInfo: "USE",
      RecordDelimiter: "\n",
      FieldDelimiter: "\t",
    },
  },
  OutputSerialization: {
    JSON: {},
  },
};

export const AWS_CONFIG = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
};

export const APP_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://grex.es";

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

// https://bytes.grubhub.com/disabling-safari-autofill-for-a-single-line-address-input-b83137b5b1c7
export const INPUT_NAME_SUFFIX = "__search__";

export const UNKNOWN_CHAR = String.fromCharCode(65533); // �

export const CROSS_CHAR = "×";
