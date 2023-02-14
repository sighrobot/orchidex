import cn from 'classnames';
import { findIndex } from 'lodash';
import React from 'react';
import style from './style.module.scss';

type TabsConfig = {
  label: string;
  count?: number;
  disabled?: boolean;
  component: React.FunctionComponent;
  disablePadding?: boolean;
};

type TabsProps = {
  config: TabsConfig[];
  onClick?: (c: TabsConfig) => void;
  padding?: boolean;
};

export const Tabs = ({ config = [], onClick, padding }: TabsProps) => {
  const [tab, setTab] = React.useState<number>(0);

  React.useEffect(() => {
    const disabledIdx = findIndex(config, (c) => !c.disabled);
    setTab(disabledIdx === -1 ? 0 : disabledIdx);
  }, [JSON.stringify(config)]);

  const handleClick = (e) => {
    const idx = findIndex(config, { label: e.target.name });
    setTab(idx);
    onClick?.(config[idx]);
  };

  return (
    <div className={style.tabs}>
      <nav>
        {config.map((c, idx) => {
          return (
            <button
              key={c.label}
              className={cn({
                [style.active]: tab === idx,
              })}
              onClick={handleClick}
              name={c.label}
              disabled={c.disabled || c.count === 0}
            >
              {c.label}
              {Number.isInteger(c.count) && (
                <div className={style.count}>{c.count}</div>
              )}
            </button>
          );
        })}
      </nav>
      <div
        className={cn(style.content, {
          [style.noPadding]: !padding || config[tab]?.disablePadding,
        })}
      >
        {config[tab]?.component({})}
      </div>
    </div>
  );
};
