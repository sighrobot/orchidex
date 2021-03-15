import React from "react";
import { capitalize } from "lodash";

import { INPUT_NAME_SUFFIX, SEARCH_FIELDS } from "lib/constants";
import { useRouter } from "next/router";

export const SearchGrex = ({
  onChange = () => {},
  onSubmit = () => {},
  state,
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(state);
    setExpanded(false);
  };

  return (
    <form className="search search-grex" onSubmit={handleSubmit}>
      {SEARCH_FIELDS.map((f, idx) => {
        const show = expanded || idx < 2 || state[f] || router.query[f];

        if (show) {
          return (
            <input
              key={f}
              autoCorrect="off"
              autoCapitalize="off"
              name={`${f}${INPUT_NAME_SUFFIX}`}
              onChange={onChange}
              placeholder={capitalize(f.replace(/_/g, " "))}
              type="search"
              value={state[f] || ""}
              spellCheck={false}
              style={{ fontStyle: f.includes("genus") ? "italic" : "normal" }}
            />
          );
        }
      })}

      <div style={{ display: "flex" }}>
        <button
          style={{ marginBottom: "-20px" }}
          className="simple"
          type="button"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "show fewer" : "show more"}
        </button>
      </div>

      <div>
        <button disabled={false} type="submit">
          Search
        </button>
      </div>
    </form>
  );
};