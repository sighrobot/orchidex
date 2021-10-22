import { GENUSES } from "./abbreviations";

const isSubstringOfGenus = (s: string): boolean => {
  return GENUSES.some((g) => g.toLowerCase().indexOf(s.toLowerCase()) === 0);
};

export const parseMagicQuery = (
  q: string
): { genus: string; epithet: string } => {
  const trimmed = q.trim();
  const tokens = trimmed.split(" ");

  if (tokens.length === 0) {
    return { genus: "", epithet: "" };
  }

  if (tokens.length === 1) {
    return { genus: "", epithet: trimmed };
  }

  const isFirstTokenGenus = isSubstringOfGenus(tokens[0]);

  if (isFirstTokenGenus) {
    return { genus: tokens[0], epithet: tokens.slice(1).join(" ") };
  }

  console.log(tokens);

  return { genus: "", epithet: trimmed };
};
