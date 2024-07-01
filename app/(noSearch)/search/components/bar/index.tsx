'use client';

import React, { InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import cn from 'classnames';

import { INPUT_NAME_SUFFIX } from 'lib/string';

import style from './style.module.scss';

export const AdvSearchCTA = () => (
  <aside className={style.advSearchCta}>
    <Link href='/search-hybrid'>Hybrid search</Link> &middot;{' '}
    <Link href='/search-advanced'>Advanced search</Link>
  </aside>
);

type SearchInputProps = {
  className?: string;
  name?: string;
  onChange: InputHTMLAttributes<HTMLInputElement>['onChange'];
  placeholder?: string;
  type?: string;
  value: string;
};

export const SearchInput = ({
  className,
  onChange,
  placeholder = 'Search orchid or registrant name',
  name = `home${INPUT_NAME_SUFFIX}`,
  type = 'search',
  value,
}: SearchInputProps) => {
  return (
    <input
      className={cn(style.input, className)}
      autoCapitalize='off'
      autoCorrect='off'
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck={false}
      type={type}
      value={value}
    />
  );
};

type SearchBarProps = {
  className?: string;
  value?: string;
};

export default function SearchBar({ className, value = '' }: SearchBarProps) {
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
      <SearchInput onChange={handleSearchText} value={searchText} />
    </form>
  );
}
