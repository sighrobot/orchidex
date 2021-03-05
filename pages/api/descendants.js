import { S3_SELECT_PARAMS } from "lib/constants";

const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

AWS.config.loadFromPath("./aws.json");

export default async (req, res) => {
  const { genus, epithet } = req.query;

  const s3 = new S3({
    region: "us-east-1",
  });

  const params = {
    ...S3_SELECT_PARAMS,
    Expression: `SELECT * FROM S3Object WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`,
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
