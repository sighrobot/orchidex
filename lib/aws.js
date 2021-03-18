const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

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

const AWS_CONFIG = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
};

if (process.env.NODE_ENV === "development") {
  AWS.config.loadFromPath("./aws.json");
} else {
  AWS.config.update(AWS_CONFIG);
}

export const s3 = new S3({ region: "us-east-1" });
