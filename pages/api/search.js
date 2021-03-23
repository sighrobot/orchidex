import { query as q } from "lib/aws";
import { SEARCH_FIELDS, CROSS_FIELDS } from "lib/constants";
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

  const d = await q(`SELECT * FROM S3Object WHERE ${condx} limit 1000`);

  res.status(200).json(d);
};
