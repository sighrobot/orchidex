import { countBy, orderBy } from "lodash";

import React from "react";

const List = ({
  data,
  getCount,
  getFields = () => [],
  order = "desc",
  renderField = (k) => k,
  renderCount = (c) => c,
  limit,
  title,
  countByField,
  max,
}) => {
  const counts = React.useMemo(() => {
    const c = {};

    if (countByField) {
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
    }

    return c;
  }, [countByField, getFields, data]);

  const sorted = React.useMemo(
    () =>
      countByField
        ? orderBy(Object.keys(counts), (k) => counts[k], order).filter(
            (k) => counts[k] > 0
          )
        : orderBy(
            data,
            [getCount, ({ grex: g }) => `${g.genus} ${g.epithet}`],
            [order, "asc"]
          ),
    [data, getCount, counts, countByField, order]
  );

  return (
    <div className="viz-list">
      {title && <h3>{title}</h3>}
      <ul>
        {sorted.slice(0, limit).map((k) => {
          return (
            <li key={k.grex.id}>
              <div>{renderField(k)}</div>
              <div>{renderCount(getCount ? getCount(k) : counts[k])}</div>
              <meter
                max={sorted[0].score}
                value={getCount ? getCount(k) : counts[k]}
              ></meter>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default List;
