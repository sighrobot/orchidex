import React from 'react';
import cn from 'classnames';
import Loader from 'components/loader';

import style from './style.module.scss';

type GenericRecord = Record<string, any>;

type TableProps<T extends GenericRecord> = {
  className?: string;
  identifier: string;
  data: T[];
  isLoading?: boolean;
  numRowsLoading?: number;
  rowIdField: string;
  cols: {
    key: string;
    label?: string;
    className?: string;
    render?: (datum: T) => React.ReactNode;
  }[];
  onChangePage?: (pageNum: number) => void;
  numItems?: number;
  itemsPerPage?: number;
};

export default function Table({
  className,
  identifier,
  data,
  cols,
  isLoading,
  rowIdField,
  numItems = data.length,
  itemsPerPage = 10,
  numRowsLoading = itemsPerPage,
}: TableProps<Record<string, any>>) {
  const [page, setPage] = React.useState<number>(1);

  React.useEffect(() => setPage(1), [identifier]);

  const rows = isLoading ? Array(numRowsLoading).fill(null) : data;
  const numPages = Math.max(1, Math.ceil(numItems / itemsPerPage));

  const windowStart = (page - 1) * itemsPerPage;
  const windowEnd = windowStart + itemsPerPage;

  const pageControls = numPages > 0 && (
    <aside className={style.pageControls}>
      Page:{' '}
      {Array(numPages)
        .fill(null)
        .map((_, n) => {
          const pageNum = n + 1;
          const handleClick = () => setPage(pageNum);
          return (
            <button key={n} disabled={page === pageNum} onClick={handleClick}>
              {pageNum}
            </button>
          );
        })}
    </aside>
  );

  return (
    <>
      {pageControls}

      <table
        className={cn(style.table, className, {
          [style.loading]: isLoading,
        })}
      >
        <thead>
          <tr>
            {cols.map((col) => {
              return <th key={col.key}>{col.label}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {rows.slice(windowStart, windowEnd).map((datum, rowIdx) => {
            return (
              <tr key={rowIdx}>
                {cols.map((col) => {
                  const content = isLoading ? (
                    <Loader
                      height={25}
                      index={Math.floor(
                        Math.random() * cols.length * numRowsLoading
                      )}
                    />
                  ) : (
                    col.render?.(datum) ?? datum[col.key]
                  );

                  return (
                    <td key={`${col.key}-${rowIdx}`} className={col.className}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageControls}
    </>
  );
}
