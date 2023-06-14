import React from 'react';
import { GrexCard } from 'components/grex/grex';
import { parseMagicQuery } from 'lib/magic-search';
import { Grex } from 'lib/types';
import { throttle } from 'lodash';
import { fetchSearch } from 'pages/search';

export const Magic = ({
  inlineMenu,
  onChange,
  onSubmit,
}: {
  inlineMenu?: boolean;
  onChange?: (grex: Grex | null) => void;
  onSubmit?: (partialGrex: Partial<Grex>) => void;
}) => {
  const [value, setValue] = React.useState<string>('');
  const [results, setResults] = React.useState<Grex[]>([]);
  const handleChange = (e) => setValue(e.target.value);
  const [selected, setSelected] = React.useState<Grex | null>(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      const partialGrex = parseMagicQuery(value);
      setResults([]);
      setValue('');
      setSelected(null);
      onSubmit?.(partialGrex);
    }
  };

  const handleSelection = (g: Grex) => {
    // setSelected(g);
    setResults([]);
    setValue('');
    setSelected(null);
    onChange?.(g);
  };

  const dbed = React.useCallback(
    throttle(async (value) => {
      if (value && value.length >= 3) {
        const partialGrex = parseMagicQuery(value);
        const params = [`epithet=${partialGrex.epithet}`];

        if (partialGrex.genus) {
          params.push(`genus=${partialGrex.genus}`);
        }

        const search = await fetchSearch(params);

        setResults(search);
      }
    }, 500),
    [],
  );

  React.useEffect(() => {
    dbed(value);

    if (value.length === 0) {
      setResults([]);
      setSelected(null);
    }
  }, [value]);

  React.useEffect(() => {
    onChange?.(selected);
  }, [selected]);

  return (
    <>
      <form onSubmit={handleSubmit} className='search magic-search'>
        <input
          onChange={handleChange}
          placeholder='Search'
          type='search'
          value={value}
        />
      </form>

      {/* <button
        style={{
          position: "fixed",
          top: 50,
          right: 0,
          height: 40,
          width: 40,
          fontSize: "30px",
          lineHeight: "30px",
          background: "none",
          border: "none",
          zIndex: 3,
        }}
      >
        &times;
      </button> */}

      {value.trim().length > 0 && (
        <section
          style={
            inlineMenu
              ? {
                  height: 300,
                  left: 10,
                  right: 10,
                  maxWidth: 400,
                  overflowY: 'auto',
                  position: 'absolute',
                  background: 'white',
                  border: '1px solid gray',
                  zIndex: 1,
                }
              : {
                  overflowX: 'auto',
                  position: 'absolute',
                  zIndex: 2,
                  top: 50,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backdropFilter:
                    value.length > 0 ? 'blur(2px) grayscale(100%)' : '',
                  background: '#bcebfb',
                  transition: '200ms ease backdropFilter',
                  opacity: 0.95,
                }
          }
        >
          {value.length > 0 &&
            results.map((r) => (
              <GrexCard
                key={r.id}
                asButton
                onClick={handleSelection}
                grex={r}
              />
            ))}
        </section>
      )}
    </>
  );
};
