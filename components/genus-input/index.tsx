'use client';

import { APP_URL } from 'lib/constants';
import { capitalize } from 'lib/utils';
import { useRouter } from 'next/navigation';
import React from 'react';

import style from './style.module.scss';

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
  const [generaInput, setGeneraInput] = React.useState<string>('');
  const [genera, setGenera] = React.useState<string[]>([]);

  const handleChangeGenus = (e) => {
    if (
      e.target.value[0] !== generaInput[0] &&
      genera.includes(e.target.value.toLowerCase())
    ) {
      router.push(`${basePath}/${e.target.value.toLowerCase()}`);
      setGeneraInput('');
    } else {
      setGeneraInput(e.target.value);
    }
  };

  React.useEffect(() => {
    (async () => {
      const fetched = await fetchGenera();
      setGenera(fetched.map(({ g }) => g.toLowerCase()));
    })();
  }, [value]);

  return (
    <>
      {genera.length > 0 && (
        <datalist id='genera'>
          {genera.map((g) => (
            <option key={g}>{capitalize(g)}</option>
          ))}
        </datalist>
      )}

      <input
        className={style.input}
        list='genera'
        placeholder={generaInput.length === 0 ? 'Search genera' : undefined} // Safari/FF placeholder glitch
        value={generaInput.toLowerCase()}
        onChange={handleChangeGenus}
      />
    </>
  );
}
