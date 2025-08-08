'use client';

import { track } from '@vercel/analytics';
import React from 'react';
import { GrexCard } from 'components/grex/card';
import List from 'components/list';
import {
  GrexWithGen,
  useProgenyAll,
  useProgenyDepth,
} from 'lib/hooks/useProgeny';
import { Grex } from 'lib/types';
import { difference, orderBy } from 'lodash';
import {
  Checkbox,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select as MaterialSelect,
} from '@mui/material';

import style from './style.module.scss';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MenuProps = {
  PaperProps: { style: { maxHeight: 48 * 4.5 + 8, width: 250 } },
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

  const { data: deepest } = useProgenyDepth(grex);
  const { data: rawData, isLoading } = useProgenyAll(grex, {
    level: Math.max(...Array.from(genValues.values())),
    sortBy: field,
    direction,
  });

  const genOptions = React.useMemo(
    () =>
      Array(deepest)
        .fill(0)
        .map((_, idx) => idx + 1),
    [deepest]
  );

  const handleDirection = (value) => setDirection(value);
  const handleField = (value) => {
    const f = value;

    setField(f);
    setDirection(f === 'first_order_progeny_count' ? 'desc' : 'asc');
    track('Sort progeny list by field', { field: f });
  };

  const dataAndGen = React.useMemo(() => {
    const genSet = new Set<number>();
    rawData?.forEach((g) => {
      g.generations.forEach((gen) => {
        genSet.add(gen - 1);
      });
    });
    return {
      data: rawData?.filter((g) =>
        g.generations.some((gen) => genValues.has(gen - 1))
      ),
    };
  }, [genValues, rawData]);

  const { data } = dataAndGen;

  const areAllChecked = genOptions.every((o) => genValues.has(o));

  const handleGen = (e) => {
    const newValues = e.target.value;
    setGenValues((oldSet) => {
      console.log({ newValues, old: Array.from(oldSet.values()) });

      track('Filter progeny list by generation', {
        generation: String(
          difference(Array.from(oldSet.values()), newValues)[0]
        ),
      });

      if (newValues.includes(0)) {
        if (areAllChecked) {
          return new Set([1]);
        }
        return new Set(genOptions);
      }

      if (newValues.length === 0) {
        return new Set(oldSet);
      }
      return new Set(newValues);
    });
  };

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

    return data ?? [];
  }, [data, field, direction, grex]);

  return (
    <div className={style.progenyList}>
      <aside>
        {!isLoading && (
          <span>
            <strong>
              {Number(data?.length) < 10000
                ? data?.length.toLocaleString()
                : '10,000+'}
            </strong>{' '}
            results in{' '}
            <label>
              generations{' '}
              <MaterialSelect
                className={style.select}
                size='small'
                multiple
                value={Array.from(genValues.values())}
                onChange={handleGen}
                input={<OutlinedInput />}
                renderValue={(selected) =>
                  areAllChecked
                    ? 'All'
                    : orderBy(selected)
                        .map((s) => `${s}`)
                        .join(', ')
                }
                MenuProps={MenuProps}
              >
                <MenuItem value={0}>
                  <Checkbox checked={areAllChecked} />
                  <ListItemText primary={`All generations`} />
                </MenuItem>

                {Array.from(genOptions.values()).map((v) => (
                  <MenuItem key={v} value={v}>
                    <Checkbox checked={genValues.has(v)} />
                    <ListItemText primary={`${v}`} />
                  </MenuItem>
                ))}
              </MaterialSelect>
            </label>
          </span>
        )}

        <div className={style.controls}>
          <label>
            Sort by
            <Select onValueChange={handleField} value={field}>
              <SelectTrigger className='ml-[5px]'>
                <SelectValue>
                  {field === 'epithet'
                    ? 'name'
                    : field === 'registrant_name'
                    ? 'registrant'
                    : field === 'date_of_registration'
                    ? 'date'
                    : field === 'first_order_progeny_count'
                    ? '# of progeny'
                    : 'parent name'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='epithet'>name</SelectItem>
                <SelectItem value='registrant_name'>registrant</SelectItem>
                <SelectItem value='date_of_registration'>date</SelectItem>
                <SelectItem value='first_order_progeny_count'>
                  # of progeny
                </SelectItem>
                <SelectItem value='parent_name'>parent name</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleDirection} value={direction}>
              <SelectTrigger className='ml-[5px]'>
                <SelectValue>{direction === 'asc' ? '↑' : '↓'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='asc'>ascending</SelectItem>
                <SelectItem value='desc'>descending</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </aside>
      <List<Grex>
        items={ordered.slice(0, 500)}
        renderItem={(item: GrexWithGen) => {
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                columnGap: '5px',
              }}
            >
              <GrexCard grex={item} contextGrex={grex} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto',
                }}
              >
                {genOptions.map((genOpt) => {
                  const alpha = (genOpt / genOptions.at(-1)) * 0.33;
                  const s = {
                    background: `rgba(50, 0, 255, ${alpha})`,
                  };

                  if (item.generations.includes(genOpt + 1)) {
                    return (
                      <div key={genOpt} style={s} className={style.gen}>
                        {genOpt}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        }}
        itemMinHeight={72}
        numItemsToLoad={10}
        isLoading={isLoading}
      />
      {ordered.length >= 10000 && (
        <mark>
          A maximum of 10,000 progeny results are displayed. Please refine your
          filters.
        </mark>
      )}
    </div>
  );
}
