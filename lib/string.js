import { CROSS_CHAR } from "lib/constants";
import { abbreviateGenus } from "lib/utils";

export const description = ({
  seed_parent_genus,
  seed_parent_epithet,
  pollen_parent_genus,
  pollen_parent_epithet,
  date_of_registration,
  registrant_name,
}) => {
  if (
    seed_parent_genus &&
    pollen_parent_genus &&
    date_of_registration &&
    registrant_name
  ) {
    return `${abbreviateGenus(
      seed_parent_genus
    )} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus(
      pollen_parent_genus
    )} ${pollen_parent_epithet} registered by ${registrant_name} in ${date_of_registration.slice(
      0,
      4
    )}.`;
  }

  if (seed_parent_genus && pollen_parent_genus && date_of_registration) {
    return `${abbreviateGenus(
      seed_parent_genus
    )} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus(
      pollen_parent_genus
    )} ${pollen_parent_epithet} registered in ${date_of_registration.slice(
      0,
      4
    )}.`;
  }

  if (seed_parent_genus && pollen_parent_genus) {
    return `${abbreviateGenus(
      seed_parent_genus
    )} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus(
      pollen_parent_genus
    )} ${pollen_parent_epithet}`;
  }

  return "";
};
