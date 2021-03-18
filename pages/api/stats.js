import { s3, S3_SELECT_PARAMS } from "lib/aws";

export default async (req, res) => {
  const params = {
    ...S3_SELECT_PARAMS,
    Expression: `SELECT count(*) as records FROM S3Object`,
  };

  const countResponse = await new Promise((resolve) => {
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

  const synonymCount = await new Promise((resolve) => {
    let str = "";
    s3.selectObjectContent(
      {
        ...params,
        Expression:
          "SELECT count(*) as synonyms FROM S3Object where synonym_flag like '%is  a%'",
      },
      (err, data) => {
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
            console.log(
              `Processed ${event.Stats.Details.BytesProcessed} bytes`
            );
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
      }
    );
  });

  res.status(200).json({ ...countResponse[0], ...synonymCount[0] });
};
