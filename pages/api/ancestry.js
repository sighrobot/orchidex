import { query } from 'lib/datasette';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';

export default async (req, res) => {
  const names = JSON.parse(req.body);

  const q = names
    .map((n) => {
      const epithetClause = n.epithet.includes(UNKNOWN_CHAR)
        ? `like '${massageQueryTerm(
            n.epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_'),
          )}'`
        : `= '${massageQueryTerm(n.epithet)}'`;

      return `(lower(genus) = '${massageQueryTerm(
        n.genus,
      )}' AND lower(epithet) ${epithetClause})`;
    })
    .join(' OR ');

  const d = await query(`SELECT * FROM rhs WHERE ${q}`);

  res.status(200).json(d);
};
