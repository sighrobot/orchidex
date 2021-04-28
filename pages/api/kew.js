import { query } from "lib/aws";
import { cloneDeep } from "lodash";

export default async (req, res) => {
  const genus = "Vanda";
  const expr = `SELECT * FROM S3Object WHERE genus = '${genus}' and lower(rank) = 'species' and lower(taxonomic_status) = 'accepted'`;

  const species = await query(expr, (config) => {
    const newConfig = cloneDeep(config);

    newConfig.Key = "wcvp_v4_mar_2021.txt";
    newConfig.InputSerialization.CSV.FieldDelimiter = "|";

    return newConfig;
  });

  const primaries = await query(
    `SELECT * FROM S3Object WHERE genus = '${genus}' AND pollen_parent_epithet != '' AND substring(pollen_parent_epithet, 1, 1) = lower(substring(pollen_parent_epithet, 1, 1)) AND seed_parent_epithet != '' AND substring(seed_parent_epithet, 1, 1) = lower(substring(seed_parent_epithet, 1, 1))`
  );

  res.status(200).json({ species, primaries });
};
