const ORCHID_ROOTS_BASE_ID = 100000000;
const SHARED_PROPS = {
  target: "_blank",
  rel: "noreferrer noopener",
};

export const Resources = ({ grex = {} }) => {
  const idNumber = parseInt(grex.id, 10);
  const orchidRootsIdNumber = ORCHID_ROOTS_BASE_ID + idNumber;

  return (
    <ul className="resources">
      <li>
        <a
          {...SHARED_PROPS}
          href={`https://www.google.com/search?q=${encodeURIComponent(
            `"${grex.genus} ${grex.epithet}"`
          )}&tbm=isch`}
        >
          Google Images
        </a>
      </li>

      <li>
        <a
          {...SHARED_PROPS}
          href={`https://bluenanta.com/detail/${String(
            orchidRootsIdNumber
          )}/hybrid/`}
        >
          OrchidRoots
        </a>
      </li>

      <li>
        <a
          {...SHARED_PROPS}
          href={`https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`}
        >
          IOR/RHS
        </a>
      </li>
    </ul>
  );
};
