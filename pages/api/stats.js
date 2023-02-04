import { query } from 'lib/datasette';

export default async (req, res) => {
  const records = await query(`SELECT count(*) as records FROM rhs`);
  const synonyms = await query(
    "SELECT count(*) as synonyms FROM rhs where synonym_flag like '%is  a%'",
  );
  const species = await query(
    "SELECT count(*) as species FROM rhs where epithet != '' and substring(epithet, 1, 1) = lower(substring(epithet, 1, 1))",
  );

  const naturalHybrids = await query(
    "SELECT count(*) as naturalHybrids FROM rhs where registrant_name like '%a natural hybrid%'",
  );

  res.status(200).json({
    ...records[0],
    ...synonyms[0],
    ...species[0],
    ...naturalHybrids[0],
  });
};
