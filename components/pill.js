export const Pill = ({ type = "" }) => {
  return <span className={`pill ${type.toLowerCase()}`}>{type}</span>;
};
