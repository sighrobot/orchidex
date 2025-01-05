'use client';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/card';
import List from 'components/list';
import { FetchRecentProps, useRecent } from 'lib/fetchers/recent';
import { Grex } from 'lib/types';

const LIMIT = 5;

export default function RecentCards({ genus }: FetchRecentProps) {
  const { data, isLoading } = useRecent({ genus, limit: LIMIT });

  if (!isLoading && data.length === 0) {
    return <Padded>No hybrids found.</Padded>;
  }

  return (
    <List<Grex>
      items={data}
      renderItem={(item) => <GrexCard grex={item} />}
      numItemsToLoad={LIMIT}
      itemMinHeight={72}
      isLoading={isLoading}
    />
  );
}
