export const S3_SELECT_PARAMS = {
  Bucket: "orchidex",
  Key: "date-reverse.tsv",
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
