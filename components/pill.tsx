type PillStates =
  | "hypothetical"
  | "species"
  | "natural"
  | "intergeneric"
  | "primary";

type PillProps = {
  type: PillStates;
};

export const Pill = ({ type }: PillProps) => {
  return <span className={`pill ${type.toLowerCase()}`}>{type}</span>;
};
