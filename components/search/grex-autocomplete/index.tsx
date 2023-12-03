'use client';

import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField, ThemeProvider, createTheme } from '@mui/material';
import { Grex } from 'lib/types';
import { useFTS } from 'lib/fetchers/fts';
import { GrexCard } from 'components/grex/grex';
import { ibmPlexSans } from 'lib/utils';

import style from './style.module.scss';
import { formatName } from 'lib/string';

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
  const [open, setOpen] = React.useState<boolean>(false);
  const [q, setQ] = React.useState<string>('');
  const fts = useFTS({
    q: q.length > 1 ? q : '',
    limit: 10,
    isDebounced: true,
  });

  const grexName = grex ? formatName(grex).long.full : '';

  const handleInputChange = (e) => setQ(e?.target?.value ?? grexName ?? '');
  const handleChange = (_, g) => {
    setOpen(false);
    onChange(g);
  };

  return (
    <div className={style.autocomplete}>
      <ThemeProvider theme={THEME}>
        <Autocomplete<Grex>
          className={ibmPlexSans.className}
          autoHighlight
          // onOpen={() => setOpen(true)}
          // clearOnBlur={false}
          disableClearable={true as unknown as false} // weird type bug
          filterOptions={(options) => options}
          getOptionLabel={(g) => g.id}
          inputValue={q}
          // open={open}
          isOptionEqualToValue={(o, g) => o.id === g.id}
          onChange={handleChange}
          onInputChange={handleInputChange}
          options={fts.data}
          renderInput={(params) => <TextField {...params} label={name} />}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <GrexCard hideLinks grex={option} />
            </li>
          )}
          size='small'
          fullWidth
          value={grex}
          loading={fts.isLoading}
          noOptionsText={
            q ? `No results for '${q}'` : 'Search orchid or registrant name'
          }
        />
      </ThemeProvider>

      {grex && (
        <div className={style.selected}>
          <GrexCard grex={grex} hideName />
        </div>
      )}
    </div>
  );
}
