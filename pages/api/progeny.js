import { query } from "lib/aws";

export default async (req, res) => {
  const { genus, epithet: e } = req.query;
  const epithet = e.replace(/'/g, "''");

  const d = await query(
    `SELECT * FROM S3Object WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`
  );

  res.status(200).json(d);
};
