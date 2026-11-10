'use client';

import React from 'react';
import cn from 'classnames';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField, ThemeProvider, createTheme } from '@mui/material';
import { Grex } from 'lib/types';
import { useFTS } from 'lib/fetchers/fts';
import { GrexCard } from 'components/grex/card';
import { ibmPlexSans } from 'lib/utils';
import { formatName } from 'lib/string';
import { useRecent } from 'lib/fetchers/recent';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';
import { DARK_COLORS } from 'lib/theme';

import style from './style.module.scss';

// One MUI theme per site theme.
const typography = {
  fontFamily: [ibmPlexSans.style.fontFamily].join(','),
};
const THEMES = {
  light: createTheme({ typography }),
  dark: createTheme({
    typography,
    palette: {
      mode: 'dark',
      background: { default: DARK_COLORS.bg, paper: DARK_COLORS.raised },
      text: { primary: DARK_COLORS.fg },
    },
  }),
};

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
  const { data: recents } = useRecent({ limit: 5 });
  const theme = THEMES[useResolvedTheme()];

  const grexName = grex ? formatName(grex).long.full : '';

  React.useEffect(() => {
    setQ(grexName);
  }, [grexName]);

  const handleInputChange = (e) => setQ(e?.target?.value ?? grexName ?? '');
  const handleChange = (_, g) => {
    onChange(g);
  };

  return (
    <div className={style.autocomplete}>
      <ThemeProvider theme={theme}>
        <Autocomplete<Grex>
          className={ibmPlexSans.className}
          autoHighlight
          disableClearable={true as unknown as false} // weird type bug
          filterOptions={(options) => options}
          getOptionLabel={(g) => g.id}
          inputValue={q}
          isOptionEqualToValue={(o, g) => o.id === g?.id}
          onChange={handleChange}
          onInputChange={handleInputChange}
          options={q ? fts.data : recents}
          renderInput={(params) => <TextField {...params} label={name} />}
          renderOption={(props, option) => {
            return (
              <li
                {...props}
                key={option.id}
                className={cn(style.grexItem, {
                  [style.selected]: props['aria-selected'],
                })}
              >
                <GrexCard hideLinks grex={option} />
              </li>
            );
          }}
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
        <div className={cn(style.selected, style.external)}>
          <GrexCard grex={grex} />
        </div>
      )}
    </div>
  );
}
