'use client';

import React from 'react';
import { IBM_Plex_Sans } from 'next/font/google';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField, ThemeProvider, createTheme } from '@mui/material';
import { Grex } from 'lib/types';
import { useFTS } from 'lib/fetchers/fts';
import { GrexCard } from 'components/grex/grex';

import style from './style.module.scss';

const ibmPlexSans = IBM_Plex_Sans({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['300', '400'],
});

const THEME = createTheme({
  typography: { fontFamily: [ibmPlexSans.style.fontFamily].join(',') },
});

type GrexAutocompleteProps = {
  grex?: Grex;
  name: string;
  onChange: (grex: Grex) => void;
};

export default function GrexAutocomplete({
  grex,
  name,
  onChange,
}: GrexAutocompleteProps) {
  const [q, setQ] = React.useState<string>('');
  const fts = useFTS({
    q: q.length > 1 ? q : '',
    limit: 10,
    isDebounced: true,
  });

  const handleInputChange = (e) => setQ(e?.target?.value ?? '');
  const handleChange = (_, g) => onChange(g);

  return (
    <div className={style.autocomplete}>
      <ThemeProvider theme={THEME}>
        <Autocomplete<Grex>
          className={ibmPlexSans.className}
          autoHighlight
          disableClearable
          filterOptions={(options) => options}
          getOptionLabel={(g) => g.id}
          inputValue={q}
          isOptionEqualToValue={(o, g) => o.id === g.id}
          onChange={handleChange}
          onInputChange={handleInputChange}
          options={fts.data}
          renderInput={(params) => <TextField {...params} label={name} />}
          renderOption={(props, option, { selected }) => (
            <li {...props} key={option.id}>
              <GrexCard hideLinks grex={option} />
            </li>
          )}
          size='small'
          value={grex}
        />
      </ThemeProvider>

      {grex && (
        <div className={style.selected}>
          <GrexCard grex={grex} />
        </div>
      )}
    </div>
  );
}
