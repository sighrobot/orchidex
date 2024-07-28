'use client';

import React from 'react';
import { GrexCard } from 'components/grex/grex';
import List from 'components/list';
import { useProgenyAll } from 'lib/hooks/useProgeny';
import { Grex } from 'lib/types';
import { orderBy } from 'lodash';
import {
  Checkbox,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material';

import style from './style.module.scss';

// WISHLIST: alpha by seed/pollen parent

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 48 * 4.5 + 8,
      width: 250,
    },
  },
};

export default function ProgenyList({ grex }: { grex: Grex }) {
  const [direction, setDirection] = React.useState<'asc' | 'desc'>('asc');
  const [field, setField] = React.useState<
    | 'epithet'
    | 'registrant_name'
    | 'date_of_registration'
    | 'first_order_progeny_count'
    | 'parent_name'
  >('epithet');
  const [genValues, setGenValues] = React.useState<Set<number>>(new Set([1]));

  const { data: rawData, isLoading } = useProgenyAll(grex, {
    level: Math.max(...Array.from(genValues.values())),
  });

  const handleDirection = (e) => setDirection(e.target.value);
  const handleField = (e) => {
    const f = e.target.value;

    setField(f);
    setDirection(f === 'first_order_progeny_count' ? 'desc' : 'asc');
  };
  const handleGen = (e) => {
    setGenValues((oldSet) => {
      if (e.target.value.includes(0)) {
        return new Set(genOptions);
      }
      const newValues = e.target.value;
      if (newValues.length === 0) {
        return new Set(oldSet);
      }
      return new Set(newValues);
    });
  };

  const dataAndGen = React.useMemo(() => {
    const genSet = new Set<number>();
    rawData?.forEach((g) => {
      genSet.add(g.generation - 1);
    });
    return {
      data: rawData?.filter((g) => genValues.has(g.generation - 1)),
      genOptions: orderBy(Array.from(genSet.values())),
    };
  }, [genValues, rawData]);

  const { data, genOptions } = dataAndGen;

  const ordered = React.useMemo(() => {
    if (field === 'parent_name') {
      return orderBy(
        data,
        (d) =>
          d.seed_parent_epithet === grex.epithet
            ? d.pollen_parent_epithet
            : d.seed_parent_epithet,
        direction
      );
    }

    return orderBy(data, field, direction);
  }, [data, field, direction, grex]);

  return (
    <div className={style.progenyList}>
      <aside>
        {!isLoading && (
          <span>
            <strong>{data?.length.toLocaleString()}</strong> results in{' '}
            <label>
              generation{' '}
              <Select
                className={style.select}
                size='small'
                multiple
                value={Array.from(genValues.values())}
                onChange={handleGen}
                input={<OutlinedInput />}
                renderValue={(selected) =>
                  orderBy(selected.map((s) => `F${s}`)).join(', ')
                }
                MenuProps={MenuProps}
              >
                <MenuItem value={0}>
                  <Checkbox
                    checked={genOptions.every((o) => genValues.has(o))}
                  />
                  <ListItemText primary={`All generations`} />
                </MenuItem>

                {Array.from(genOptions.values()).map((v) => (
                  <MenuItem key={v} value={v}>
                    <Checkbox checked={genValues.has(v)} />
                    <ListItemText primary={`F${v}`} />
                  </MenuItem>
                ))}
              </Select>
            </label>
          </span>
        )}

        <div className={style.controls}>
          <label>
            Sort by{' '}
            <Select
              className={style.select}
              size='small'
              value={field}
              onChange={handleField}
              input={<OutlinedInput />}
              renderValue={(selected) =>
                selected === 'epithet'
                  ? 'name'
                  : selected === 'registrant_name'
                  ? 'registrant'
                  : selected === 'date_of_registration'
                  ? 'date'
                  : selected === 'first_order_progeny_count'
                  ? '# of progeny'
                  : 'parent name'
              }
            >
              <MenuItem value='epithet'>
                <Checkbox checked={field === 'epithet'} />
                <ListItemText primary='name' />
              </MenuItem>
              <MenuItem value='registrant_name'>
                <Checkbox checked={field === 'registrant_name'} />
                <ListItemText primary='registrant' />
              </MenuItem>
              <MenuItem value='date_of_registration'>
                <Checkbox checked={field === 'date_of_registration'} />
                <ListItemText primary='date' />
              </MenuItem>
              <MenuItem value='first_order_progeny_count'>
                <Checkbox checked={field === 'first_order_progeny_count'} />
                <ListItemText primary='# of progeny' />
              </MenuItem>
              <MenuItem value='parent_name'>
                <Checkbox checked={field === 'parent_name'} />
                <ListItemText primary='parent name' />
              </MenuItem>
            </Select>
            <Select
              className={style.select}
              size='small'
              value={direction}
              onChange={handleDirection}
              input={<OutlinedInput />}
              renderValue={(selected) => (selected === 'asc' ? '↑' : '↓')}
            >
              <MenuItem value='asc'>
                <Checkbox checked={direction === 'asc'} />
                <ListItemText primary='ascending' />
              </MenuItem>
              <MenuItem value='desc'>
                <Checkbox checked={direction === 'desc'} />
                <ListItemText primary='descending' />
              </MenuItem>
            </Select>
          </label>
        </div>
      </aside>
      <List<Grex>
        items={ordered}
        renderItem={(item) => <GrexCard grex={item} contextGrex={grex} />}
        itemMinHeight={72}
        numItemsToLoad={5}
        isLoading={isLoading}
      />
    </div>
  );
}
