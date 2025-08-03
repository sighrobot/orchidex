'use client';

import { APP_URL } from 'lib/constants';
import { capitalize } from 'lib/utils';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Combobox } from '@/components/ui/combobox';
import { uniqBy } from 'lodash';

async function fetchGenera(): Promise<{ g: string; c: number; d: string }[]> {
  const res = await fetch(`${APP_URL}/api/genera`);
  return res.json();
}

export default function GenusInput({
  basePath,
  value,
}: {
  basePath: string;
  value: string;
}) {
  const router = useRouter();
  const [genera, setGenera] = React.useState<string[]>([]);

  const handleChangeGenus = (value: string) => {
    router.push(`${basePath}/${value.toLowerCase()}`);
  };

  React.useEffect(() => {
    (async () => {
      const fetched = await fetchGenera();
      setGenera(fetched.map(({ g }) => g.toLowerCase()));
    })();
  }, []);

  return (
    <Combobox
      options={uniqBy(
        genera
          .map((g) => ({ label: capitalize(g), value: g }))
          .concat([{ label: capitalize(value), value }]),
        'value'
      )}
      onChange={handleChangeGenus}
      placeholder='Search genera'
      value={value}
    />
  );
}
