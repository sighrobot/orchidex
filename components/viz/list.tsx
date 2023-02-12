import cn from 'classnames';
import { formatName } from 'lib/string';
import { orderBy } from 'lodash';

import React from 'react';
import style from './list.module.scss';

const type = 'text/plain';

type ListProps = {
  activeId?: string;
  className?: string;
  data: any;
  getCount: any;
  getFields?: any;
  order?: 'asc' | 'desc' | boolean;
  renderField?: (f: any) => React.ReactNode;
  renderCount?: (c: number) => string;
  limit?: number;
  title?: string;
  countByField?: boolean;
  showBars?: boolean;
};

const List = ({
  activeId,
  className,
  data,
  getCount,
  getFields = () => [],
  order = 'desc',
  renderField = (k) => k,
  renderCount = (c) => c.toLocaleString(),
  limit,
  title,
  countByField,
  showBars = true,
}: ListProps) => {
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
            (k) => counts[k] > 0,
          )
        : orderBy(
            data,
            [getCount, ({ grex: g }) => `${g.genus} ${g.epithet}`],
            [order, 'asc'],
          ),
    [data, getCount, counts, countByField, order],
  );
  const total = React.useMemo(
    () => sorted.reduce((acc, s) => acc + s.score, 0),
    [counts],
  );

  const copiedValue = sorted
    .map((d) => {
      const fn = formatName(d.grex);
      return `${renderCount(d.score).replace(' ', '')} ${fn.short.epithet}`;
    })
    .join(', ');

  return (
    <div className={cn(style.vizList, className)}>
      {title && <h3>{title}</h3>}
      <ul>
        {sorted.slice(0, limit).map((k) => {
          return (
            <li
              key={k.grex.id}
              className={
                activeId && k.id === activeId ? style.active : undefined
              }
            >
              <div>{renderField(k)}</div>
              <div>{renderCount(getCount ? getCount(k) : counts[k])}</div>
              {showBars && (
                <meter
                  value={(getCount ? getCount(k) : counts[k]) / total}
                ></meter>
              )}
            </li>
          );
        })}
      </ul>
      {/* <ButtonSimple
        onClick={() => {
          const data = [
            new ClipboardItem({ [type]: new Blob([copiedValue], { type }) }),
          ];
          navigator.clipboard.write(data);
        }}
        style={{ textAlign: 'right', display: 'block' }}
      >
        Copy text as cells
      </ButtonSimple> */}
    </div>
  );
};

export default List;
