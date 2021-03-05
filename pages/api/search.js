import { AWS_CONFIG, S3_SELECT_PARAMS } from "lib/constants";

const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

if (process.env.NODE_ENV === "development") {
  AWS.config.loadFromPath("./aws.json");
} else {
  AWS.config.update(AWS_CONFIG);
}

export default async (req, res) => {
  const { g1, e1, g2, e2 } = req.query;

  const s3 = new S3({
    region: "us-east-1",
  });

  let Expression =
    g2 || e2
      ? `SELECT * FROM S3Object WHERE ((lower(seed_parent_genus) like '%${g1.toLowerCase()}%' and lower(seed_parent_epithet) like '%${e1.toLowerCase()}%') and (lower(pollen_parent_genus) like '%${g2.toLowerCase()}%' and lower(pollen_parent_epithet) like '%${e2.toLowerCase()}%') or (lower(seed_parent_genus) like '%${g2.toLowerCase()}%' and lower(seed_parent_epithet) like '%${e2.toLowerCase()}%') and (lower(pollen_parent_genus) like '%${g1.toLowerCase()}%' and lower(pollen_parent_epithet) like '%${e1.toLowerCase()}%')) limit 1000`
      : `SELECT * FROM S3Object WHERE lower(genus) like '%${g1.toLowerCase()}%' and lower(epithet) like '%${e1.toLowerCase()}%' limit 1000`;

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
