import { query } from "lib/aws";

export default async (req, res) => {
  const { d: date } = req.query;

  const expr = date
    ? `SELECT * FROM S3Object WHERE date_of_registration = '${date}'`
    : `SELECT * FROM S3Object limit 100`;

  const d = await query(expr);

  res.status(200).json(d);
};
