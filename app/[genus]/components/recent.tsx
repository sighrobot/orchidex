'use client';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { FetchRecentProps, useRecent } from 'lib/fetchers/recent';

export default function RecentCards({ genus }: FetchRecentProps) {
  const { data, isLoading } = useRecent({ genus, limit: 5 });

  if (!isLoading && data.length === 0) {
    return <Padded>No hybrids found.</Padded>;
  }

  return (
    <>
      {data.map((r) => (
        <GrexCard grex={r} />
      ))}
    </>
  );
}
