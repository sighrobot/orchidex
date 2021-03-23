import { query } from "lib/aws";

export default async (req, res) => {
  const { id } = req.query;

  const d = await query(`SELECT * FROM S3Object WHERE id like '${id}' limit 1`);

  res.status(200).json(d[0] ?? null);
};
