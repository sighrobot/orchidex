import cn from 'classnames';
import { findIndex } from 'lodash';
import React from 'react';
import style from './style.module.scss';

type TabsConfig = {
  label: string;
  count?: number;
  disabled?: boolean;
  component: React.ReactNode;
};

type TabsProps = {
  config: TabsConfig[];
  identifier?: string;
  sidecar?: React.ReactNode;
};

export const Tabs = ({ config = [], identifier, sidecar }: TabsProps) => {
  const [tab, setTab] = React.useState<number>(0);

  React.useEffect(() => {
    setTab(0);
  }, [identifier]);

  const handleClick = (e) =>
    setTab(findIndex(config, { label: e.target.name }));

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
        {sidecar && <div className={style.sidecar}>{sidecar}</div>}
      </nav>
      <div className={style.content}>{config[tab]?.component}</div>
    </div>
  );
};
