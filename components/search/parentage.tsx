import React from 'react';

import searchStyle from './search.module.scss';

type SearchParentageState = {
  g1?: string;
  e1?: string;
  g2?: string;
  e2?: string;
};

type SearchParentageProps = {
  onChange: (e: any) => void;
  onSubmit: (state: object) => void;
  state: SearchParentageState;
  submitText?: string;
};

export const SearchParentage = ({
  onChange = () => {},
  onSubmit = () => {},
  state,
  submitText = 'Search',
}: SearchParentageProps) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(state);
  };

  return (
    <form className={searchStyle.search} onSubmit={handleSubmit}>
      <div>
        <div>
          <input
            autoCorrect='off'
            autoCapitalize='off'
            name='g1'
            onChange={onChange}
            placeholder='Genus'
            type='search'
            value={state.g1 || ''}
            spellCheck={false}
            style={{ fontStyle: 'italic' }}
          />
          <input
            autoCorrect='off'
            autoCapitalize='off'
            name='e1'
            onChange={onChange}
            placeholder='Epithet'
            type='search'
            value={state.e1 || ''}
            spellCheck={false}
          />
        </div>

        <div className={searchStyle.crossIcon}>&times;</div>

        <div>
          <input
            autoCorrect='off'
            autoCapitalize='off'
            name='g2'
            onChange={onChange}
            placeholder='Genus'
            type='search'
            value={state.g2 || ''}
            spellCheck={false}
            style={{ fontStyle: 'italic' }}
          />
          <input
            autoCorrect='off'
            autoCapitalize='off'
            name='e2'
            onChange={onChange}
            placeholder='Epithet'
            type='search'
            value={state.e2 || ''}
            spellCheck={false}
          />
        </div>
      </div>

      <div>
        <button disabled={false} type='submit'>
          {submitText}
        </button>
      </div>
    </form>
  );
};
