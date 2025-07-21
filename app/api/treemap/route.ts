import { NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

// let q = `SELECT id, genus, epithet
export async function GET() {
  // let q = `SELECT COUNT(*) c, genus parent
  // FROM rhs
  // WHERE

  // ${[
  //   "epithet != ''",
  //   // "seed_parent_epithet != ''",
  //   // "pollen_parent_epithet != ''",
  //   // "date_of_registration != ''",
  //   "synonym_flag = 'This is not a synonym'",
  //   // "synonym_genus_name != ''",
  //   // "genus = 'Oncidium'",
  //   // "((synonym_flag = 'This is not a synonym' AND synonym_genus_name = '') OR (synonym_flag = 'This is  a synonym' AND synonym_genus_name != ''))",
  // ].join(' AND ')}

  // GROUP BY parent
  // ORDER BY c DESC, parent`;

  // let q = `select (seed_parent_genus || '-' || genus) edge
  // FROM rhs
  // WHERE id != '1016580' AND date_of_registration != '' AND epithet != '' AND genus != seed_parent_genus AND genus != pollen_parent_genus AND seed_parent_genus != 'na' AND seed_parent_genus != '' AND genus != ''
  // group by edge`;

  let q = `
  SELECT DISTINCT (parent_genus || '-' || genus) AS edge
FROM (
  SELECT seed_parent_genus AS parent_genus, genus
  FROM rhs
  WHERE seed_parent_genus = 'Vanda' AND id != '1016580'
    AND date_of_registration != ''
    AND epithet != ''
    AND genus != seed_parent_genus
    AND genus != pollen_parent_genus
    AND seed_parent_genus NOT IN ('', 'na')
    AND genus != ''

  UNION

  SELECT pollen_parent_genus AS parent_genus, genus
  FROM rhs
  WHERE pollen_parent_genus = 'Vanda' AND id != '1016580'
    AND date_of_registration != ''
    AND epithet != ''
    AND genus != seed_parent_genus
    AND genus != pollen_parent_genus
    AND pollen_parent_genus NOT IN ('', 'na')
    AND genus != ''
) AS all_edges;
  `;

  const json = await query(q);

  return NextResponse.json(json, { status: 200 });
}
