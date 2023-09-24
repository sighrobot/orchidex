'use client';

import React from 'react';

import { Pills } from 'components/pills/pills';
import Table from 'components/table';
import { useFTS } from 'lib/fetchers/fts';
import { abbreviateGenus } from 'lib/string';

import style from './style.module.scss';

export default function TablePage() {
  const [input, setInput] = React.useState<string>('');
  const [q, setQ] = React.useState<string>('');

  const fts = useFTS({ q }); // WHY not gripp's

  const handleSearch = (e) => {
    e.preventDefault();
    setQ(input);
  };

  const handleChange = (e) => setInput(e.target.value);

  return (
    <>
      <form onSubmit={handleSearch}>
        <input type='search' onChange={handleChange} value={input} />
      </form>
      <Table
        className={style.table}
        identifier={q}
        data={fts.data}
        cols={[
          {
            key: 'name',
            className: style.name,
            label: 'Name',
            render: (g) => (
              <strong>
                <em>{g.genus}</em> {g.epithet}
              </strong>
            ),
          },
          {
            key: 'pill',
            className: style.pill,
            render: (g) => <Pills grex={g} />,
          },
          {
            key: 'registrant_name',
            label: 'Registrant',
            className: style.ellipsis,
            render: (g) => (
              <small>
                {g.registrant_name === 'This is a natural hybrid'
                  ? ''
                  : g.registrant_name}
              </small>
            ),
          },
          {
            key: 'date_of_registration',
            label: 'Year',
            render: (d) => <small>{d.date_of_registration?.slice(0, 4)}</small>,
          },
          {
            key: 'seed_parent',
            label: 'Seed Parent',
            className: style.ellipsis,
            render: (g) =>
              g.seed_parent_genus && (
                <small>
                  <em>{abbreviateGenus({ genus: g.seed_parent_genus })}</em>{' '}
                  {g.seed_parent_epithet}
                </small>
              ),
          },
          {
            key: 'pollen_parent',
            label: 'Pollen Parent',
            className: style.ellipsis,
            render: (g) =>
              g.pollen_parent_genus && (
                <>
                  <em>{abbreviateGenus({ genus: g.pollen_parent_genus })}</em>{' '}
                  {g.pollen_parent_epithet}
                </>
              ),
          },
        ]}
        isLoading={fts.isLoading}
        rowIdField='id'
        numRowsLoading={20}
        numItems={fts.data.length}
        itemsPerPage={10}
      />
    </>
  );
}
