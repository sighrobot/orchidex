import React from 'react';
import { useSearchParams } from 'next/navigation';

import { SEARCH_FIELDS } from 'lib/constants';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import { capitalize } from 'lib/utils';
import { ButtonSimple } from 'components/button-simple/button-simple';

import searchStyle from './search.module.scss';

type SearchGrexState = {
  genus?: string;
  epithet?: string;
};

type SearchGrexProps = {
  onChange: (e: any) => void;
  onSubmit: (state: object) => void;
  state: SearchGrexState;
};

export const SearchGrex = ({
  onChange = () => {},
  onSubmit = () => {},
  state,
}: SearchGrexProps) => {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(state);
    setExpanded(false);
  };

  return (
    <form className={searchStyle.search} onSubmit={handleSubmit}>
      {SEARCH_FIELDS.map((f, idx) => {
        const show = expanded || idx < 2 || state[f] || searchParams?.[f];

        if (show) {
          return (
            <input
              key={f}
              autoCorrect='off'
              autoCapitalize='off'
              name={`${f}${INPUT_NAME_SUFFIX}`}
              onChange={onChange}
              placeholder={capitalize(f.replace(/_/g, ' '))}
              type='search'
              value={state[f] || ''}
              spellCheck={false}
              style={{ fontStyle: f.includes('genus') ? 'italic' : 'normal' }}
            />
          );
        }
      })}

      <div style={{ display: 'flex' }}>
        <ButtonSimple
          onClick={() => setExpanded((e) => !e)}
          style={{ marginBottom: '-20px' }}
        >
          {expanded ? 'show fewer fields' : 'show more fields'}
        </ButtonSimple>
      </div>

      <div>
        <button disabled={SEARCH_FIELDS.every((f) => !state[f])} type='submit'>
          Search
        </button>
      </div>
    </form>
  );
};
