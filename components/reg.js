export const Reg = ({ grex }) => {
  if (grex) {
    const dateStr = grex.date_of_registration
      ? new Date(grex.date_of_registration).toUTCString().split("00:00:00")[0]
      : "unknown date";
    return (
      <span className="reg">
        Registered on <strong>{dateStr}</strong>
      </span>
    );
  }

  return null;
};
