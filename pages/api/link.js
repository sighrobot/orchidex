import { AWS_CONFIG, S3_SELECT_PARAMS } from "lib/constants";

const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

if (process.env.NODE_ENV === "development") {
  AWS.config.loadFromPath("./aws.json");
} else {
  AWS.config.update(AWS_CONFIG);
}

export default async (req, res) => {
  const s3 = new S3({
    region: "us-east-1",
  });

  let Expression = `SELECT *, foo FROM S3Object limit 1 where foo is 1`;

  const params = {
    ...S3_SELECT_PARAMS,
    Expression,
  };

  let str = "";

  const d = await new Promise((resolve) => {
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

  res.status(200).json(d);
};
