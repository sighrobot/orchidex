import { query } from 'lib/datasette';

export default async (req, res) => {
  const {
    query: { genus = '', epithet = '' },
  } = req;

  const q = `select * from wcvp where taxon_name = '${genus} ${epithet
    .replace(/ var /g, ' var. ')
    .replace(/{var}/g, 'var.')
    .replace(/ subsp. /g, ' var. ')}'`;

  const data = await query(q);

  res.status(200).json(data);
};
