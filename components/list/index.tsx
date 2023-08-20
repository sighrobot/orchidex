import React from 'react';
import cn from 'classnames';
import Loader from 'components/loader';

import style from './style.module.scss';

export default function List<T>({
  className,
  isLoading,
  itemMinHeight,
  items,
  numItemsToLoad = 3,
  renderEmpty,
  renderItem,
}: {
  className?: string;
  isLoading?: boolean;
  itemMinHeight: number;
  items: T[];
  numItemsToLoad?: number;
  renderEmpty?: () => React.ReactNode;
  renderItem: (item: T, idx: number) => React.ReactNode;
}) {
  const memoizedItems = React.useMemo(() => {
    return isLoading ? Array(numItemsToLoad).fill(0) : items;
  }, [numItemsToLoad, isLoading, items]);

  return (
    <ul className={cn(style.list, className)}>
      {!isLoading && memoizedItems.length === 0 && renderEmpty?.()}
      {memoizedItems.map((item, idx) => {
        return (
          <li key={idx}>
            {isLoading ? (
              <Loader index={idx} height={itemMinHeight} />
            ) : (
              renderItem(item, idx)
            )}
          </li>
        );
      })}
    </ul>
  );
}
