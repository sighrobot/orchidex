import React from "react";
import { GrexCard } from "components/grex";
import { parseMagicQuery } from "lib/magic-search";
import { Grex } from "lib/types";
import { debounce, throttle } from "lodash";
import { fetchSearch } from "pages";

export const Magic = ({
  onChange,
  name,
}: {
  onChange?: (grex: Grex) => void;
  name?: string;
}) => {
  const [value, setValue] = React.useState<string>("");
  const [results, setResults] = React.useState<Grex[]>([]);
  const handleChange = (e) => setValue(e.target.value);
  const [selected, setSelected] = React.useState<Grex | null>(null);

  const handleSelection = (g: Grex) => setSelected(g);

  const dbed = React.useCallback(
    throttle(async (value) => {
      if (value && value.length > 3) {
        const partialGrex = parseMagicQuery(value);
        const params = [`epithet=${partialGrex.epithet}`];

        if (partialGrex.genus) {
          params.push(`genus=${partialGrex.genus}`);
        }

        const search = await fetchSearch(params);

        setResults(search);
      }
    }, 750),
    []
  );

  React.useEffect(() => {
    dbed(value);

    if (value.length === 0) {
      setResults([]);
      setSelected(null);
    }
  }, [value]);

  React.useEffect(() => {
    onChange?.(selected);
  }, [selected]);

  return (
    <>
      <form className="search magic-search">
        <input
          onChange={handleChange}
          placeholder="Search by grex name…"
          type="search"
          value={value}
        />
      </form>

      {value.length > 0 && (
        <section
          style={{
            overflowX: "auto",
            position: "absolute",
            zIndex: 2,
            top: 50,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: value.length > 0 ? "blur(2px) grayscale(100%)" : "",
            background: "#bcebfb",
            transition: "200ms ease backdropFilter",
            opacity: 0.95,
          }}
        >
          {value.length > 0 &&
            results.map((r) => (
              <article key={r.id} className="grex">
                <GrexCard asButton onClick={handleSelection} grex={r} />
              </article>
            ))}
        </section>
      )}
    </>
  );
};
