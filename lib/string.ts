import type { Grex } from "./types";
import { GENUS_TO_ABBREVIATION } from "./abbreviations";

// https://bytes.grubhub.com/disabling-safari-autofill-for-a-single-line-address-input-b83137b5b1c7
export const INPUT_NAME_SUFFIX = "__search__";

export const UNKNOWN_CHAR = String.fromCharCode(65533); // �
export const CROSS_CHAR = "×";

export const normalize = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const abbreviateGenus = ({ genus } = { genus: "" }) =>
  GENUS_TO_ABBREVIATION[genus] || genus;
export const abbreviateEpithet = ({ epithet } = { epithet: "" }) => {
  return epithet.replace("Memoria ", "Mem. ");
};

export const formatName = (
  grex: Pick<Grex, "genus" | "epithet">,
  {
    shortenGenus,
    shortenEpithet,
  }: { shortenGenus?: boolean; shortenEpithet?: boolean } = {}
) => {
  const g = shortenGenus ? abbreviateGenus(grex) : grex.genus;
  const e = shortenEpithet ? abbreviateEpithet(grex) : grex.epithet;

  return { genus: g, epithet: e };
};

export const repairMalformedNaturalHybridEpithet = (
  { epithet } = { epithet: "" }
) => {
  const i = epithet.indexOf(UNKNOWN_CHAR);

  if (i >= 0) {
    const first = epithet[i + 1];

    if (first === " ") {
      const second = epithet[i + 2];

      if (typeof second === "string" && second === second.toLowerCase()) {
        return epithet.replace(UNKNOWN_CHAR, "×");
      }
    }
  }

  return epithet;
};

export const description = ({
  seed_parent_genus,
  seed_parent_epithet,
  pollen_parent_genus,
  pollen_parent_epithet,
  date_of_registration,
  registrant_name,
}: Grex) => {
  if (
    seed_parent_genus &&
    pollen_parent_genus &&
    date_of_registration &&
    registrant_name
  ) {
    return `${abbreviateGenus({
      genus: seed_parent_genus,
    })} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus({
      genus: pollen_parent_genus,
    })} ${pollen_parent_epithet} registered by ${registrant_name} in ${date_of_registration.slice(
      0,
      4
    )}.`;
  }

  if (seed_parent_genus && pollen_parent_genus && date_of_registration) {
    return `${abbreviateGenus({
      genus: seed_parent_genus,
    })} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus({
      genus: pollen_parent_genus,
    })} ${pollen_parent_epithet} registered in ${date_of_registration.slice(
      0,
      4
    )}.`;
  }

  if (seed_parent_genus && pollen_parent_genus) {
    return `${abbreviateGenus({
      genus: seed_parent_genus,
    })} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus({
      genus: pollen_parent_genus,
    })} ${pollen_parent_epithet}`;
  }

  return "";
};
