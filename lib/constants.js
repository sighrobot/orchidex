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
