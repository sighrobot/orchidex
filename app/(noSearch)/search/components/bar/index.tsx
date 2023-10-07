'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import cn from 'classnames';

import { INPUT_NAME_SUFFIX } from 'lib/string';

import style from './style.module.scss';

export const AdvSearchCTA = () => (
  <aside className={style.advSearchCta}>
    <strong>
      <Link href='/search-advanced'>Try advanced search &raquo;</Link>
    </strong>
  </aside>
);

type SearchBarProps = {
  className?: string;
  hasButton?: boolean;
  value?: string;
};

export default function SearchBar({
  className,
  hasButton = true,
  value = '',
}: SearchBarProps) {
  const router = useRouter();
  const [searchText, setSearchText] = React.useState<string>(value);

  React.useEffect(() => setSearchText(value), [value]);

  const handleSearchText = (e) => setSearchText(e.target.value);
  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search/${encodeURIComponent(searchText)}`);
  };

  return (
    <form className={cn(style.search, className)} onSubmit={handleSearch}>
      <input
        autoCapitalize='off'
        autoCorrect='off'
        name={`home${INPUT_NAME_SUFFIX}`}
        onChange={handleSearchText}
        placeholder='Search orchid or registrant name'
        spellCheck={false}
        type='search'
        value={searchText}
      />
    </form>
  );
}