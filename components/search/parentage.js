import React from "react";

export const SearchParentage = ({
  onChange = () => {},
  onSubmit = () => {},
  state,
  submitText = "Search",
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(state);
  };

  return (
    <form className="search search-parentage" onSubmit={handleSubmit}>
      <div>
        <div>
          <input
            autoCorrect="off"
            autoCapitalize="off"
            name="g1"
            onChange={onChange}
            placeholder="Genus"
            type="search"
            value={state.g1 || ""}
            spellCheck={false}
            style={{ fontStyle: "italic" }}
          />
          <input
            autoCorrect="off"
            autoCapitalize="off"
            name="e1"
            onChange={onChange}
            placeholder="Epithet"
            type="search"
            value={state.e1 || ""}
            spellCheck={false}
          />
        </div>

        <div className="cross-icon">&times;</div>

        <div>
          <input
            autoCorrect="off"
            autoCapitalize="off"
            name="g2"
            onChange={onChange}
            placeholder="Genus"
            type="search"
            value={state.g2 || ""}
            spellCheck={false}
            style={{ fontStyle: "italic" }}
          />
          <input
            autoCorrect="off"
            autoCapitalize="off"
            name="e2"
            onChange={onChange}
            placeholder="Epithet"
            type="search"
            value={state.e2 || ""}
            spellCheck={false}
          />
        </div>
      </div>

      <div>
        <button disabled={false} type="submit">
          {submitText}
        </button>
      </div>
    </form>
  );
};
