import { s3 } from "lib/aws";
import { SEARCH_FIELDS, S3_SELECT_PARAMS, CROSS_FIELDS } from "lib/constants";
import { formatClause, makeCrossQuery } from "lib/utils";

export default async (req, res) => {
  const { query } = req;
  const isCross = CROSS_FIELDS.some((f) => query[f]);

  const condx = isCross
    ? makeCrossQuery(query)
    : SEARCH_FIELDS.map((f) => {
        if (query[f]) {
          return formatClause(f, query[f]);
        }
      })
        .filter((c) => c)
        .join(" and ");

  const Expression = `SELECT * FROM S3Object WHERE ${condx} limit 1000`;

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
