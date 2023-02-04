import { query } from 'lib/datasette';

export default async (req, res) => {
  const { genus } = req.query;
  const g = genus.toLowerCase();

  const data = await query(
    `SELECT * FROM rhs where lower(seed_parent_genus) = '${g}' or lower(pollen_parent_genus) = '${g}'`,
  );

  res.status(200).json(data);
};
