import React from 'react';
import cn from 'classnames';
import { H3 } from 'components/layout';
import List from 'components/list';
import { Meter } from 'components/meter/meter';
import { orderBy } from 'lodash';

import style from './list.module.scss';

type VizListProps = {
  activeId?: string;
  className?: string;
  data: any;
  getCount: any;
  getFields?: any;
  order?: 'asc' | 'desc' | boolean;
  renderField?: (f: any, idx: number) => React.ReactNode;
  renderCount?: (c: number) => string;
  limit?: number;
  title?: string;
  countByField?: boolean;
  showBars?: boolean;
  isLoading?: boolean;
  numItemsToLoad?: number;
};

const VizList = ({
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
  isLoading,
  numItemsToLoad,
}: VizListProps) => {
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
            [order, 'asc']
          ),
    [data, getCount, counts, countByField, order]
  );
  const total = React.useMemo(
    () => sorted.reduce((acc, s) => acc + s.score, 0),
    [counts]
  );

  return (
    <div className={cn(style.vizList, className)}>
      {title && <H3>{title}</H3>}

      <List
        className={style.list}
        isLoading={isLoading}
        items={sorted.slice(0, limit)}
        renderItem={(k, idx) => (
          <>
            <div>{renderField(k, idx)}</div>
            <div>{renderCount(getCount ? getCount(k) : counts[k])}</div>
            {showBars && (
              <Meter
                className={style.meter}
                value={(getCount ? getCount(k) : counts[k]) / total}
              />
            )}
          </>
        )}
        itemMinHeight={23}
        numItemsToLoad={numItemsToLoad}
      />
    </div>
  );
};

export default VizList;
