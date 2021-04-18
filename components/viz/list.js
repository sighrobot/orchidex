import { orderBy } from "lodash";

import React from "react";

const List = ({
  data,
  getFields = () => [],
  order = "desc",
  renderField = (k) => k,
  limit,
  title,
}) => {
  const counts = React.useMemo(() => {
    const c = {};

    data.forEach((d) => {
      const fields = getFields(d);

      fields.forEach((field) => {
        if (c[field]) {
          c[field] += 1;
        } else {
          c[field] = 1;
        }
      });
    });

    return c;
  }, [getFields, data]);

  const sorted = React.useMemo(
    () =>
      orderBy(Object.keys(counts), (k) => counts[k], order).filter(
        (k) => counts[k] > 1
      ),
    [counts]
  );

  return (
    <div className="viz-list">
      {title && <h3>{title}</h3>}
      <ul>
        {sorted.slice(0, limit).map((k) => {
          return (
            <li key={k}>
              <div>{renderField(k)}</div>
              <div>{counts[k]}</div>
              <meter max={1} value={counts[k] / counts[sorted[0]]}></meter>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default List;
