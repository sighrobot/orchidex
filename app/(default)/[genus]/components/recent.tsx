'use client';

import { GrexTable } from 'components/grex/table';
import { FetchRecentProps, useRecent } from 'lib/fetchers/recent';

import style from './recent.module.scss';

const LIMIT = 10;

export default function RecentRegistrations({ genus }: FetchRecentProps) {
  const { data, isLoading } = useRecent({ genus, limit: LIMIT });

  return (
    <GrexTable
      className={style.table}
      grexes={data}
      isLoading={isLoading}
      numRowsLoading={LIMIT}
      renderEmpty={() => <p className={style.empty}>No hybrids found.</p>}
    />
  );
}
