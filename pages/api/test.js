import { query } from "lib/aws";

export default async (req, res) => {
  const data = await query(
    // `SELECT * FROM S3Object where seed_parent_genus = 'Aeridovanda' and seed_parent_genus != pollen_parent_genus and lower(epithet) = epithet limit 50`
    `SELECT * FROM S3OBJECT where seed_parent_genus = 'Cattleya' or pollen_parent_genus = 'Cattleya'`
  );

  res.status(200).json(data);
};
