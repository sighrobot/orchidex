const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

const S3_SELECT_PARAMS = {
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

const s3 = new S3({ region: "us-east-1" });

export const query = async (expr) => {
  if (!expr) return null;

  const params = {
    ...S3_SELECT_PARAMS,
    Expression: expr,
  };

  return new Promise((resolve) => {
    let str = "";

    s3.selectObjectContent(params, (err, data) => {
      if (err) {
        // Handle error
        console.error(err);
        return;
      }

      // data.Payload is a Readable Stream
      const eventStream = data.Payload;

      // Read events as they are available
      eventStream.on("data", (event) => {
        if (event.Records) {
          // event.Records.Payload is a buffer containing
          // a single record, partial records, or multiple records

          str += event.Records.Payload.toString();
        } else if (event.Stats) {
          console.log(`Processed ${event.Stats.Details.BytesProcessed} bytes`);
        } else if (event.End) {
          console.log("SelectObjectContent completed");

          try {
            return resolve(
              str
                .split("\n")
                .filter((f) => f)
                .map((d) => {
                  return JSON.parse(d);
                })
            );
          } catch (e) {
            console.error(e);
            return resolve([]);
          }
        }
      });
    });
  });
};
