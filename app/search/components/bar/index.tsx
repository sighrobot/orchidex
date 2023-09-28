import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { INPUT_NAME_SUFFIX } from 'lib/string';

import style from './style.module.scss';

type SearchBarProps = { value?: string };

export default function SearchBar({ value = '' }: SearchBarProps) {
  const router = useRouter();
  const [searchText, setSearchText] = React.useState<string>(value);

  React.useEffect(() => setSearchText(value), [value]);

  const handleSearchText = (e) => setSearchText(e.target.value);
  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search/${encodeURIComponent(searchText)}`);
  };

  return (
    <form className={style.search} onSubmit={handleSearch}>
      <div className={style.lockup}>
        <input
          autoCapitalize='off'
          autoCorrect='off'
          name={`home${INPUT_NAME_SUFFIX}`}
          onChange={handleSearchText}
          placeholder='Search by orchid or registrant name'
          spellCheck={false}
          type='search'
          value={searchText}
        />
        <aside>
          <strong>
            <Link href='/search-advanced'>Try advanced search &raquo;</Link>
          </strong>
        </aside>
      </div>
      <button disabled={!searchText} type='submit'>
        Go
      </button>
    </form>
  );
}
