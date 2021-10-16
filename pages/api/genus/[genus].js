import { query } from "lib/aws";

export default async (req, res) => {
  const { genus } = req.query;
  const g = genus.toLowerCase();

  const data = await query(
    `SELECT * FROM S3OBJECT where lower(genus) = '${g}' or lower(genus) = '${g}'`
  );

  res.status(200).json(data);
};
