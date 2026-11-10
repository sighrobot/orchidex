'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  applyTheme,
  readPreference,
  savePreference,
  ThemePreference,
  watchSystemTheme,
} from 'lib/theme';

import style from './style.module.scss';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

// Light / Dark / System menu. Light is the default; "System" follows the
// device setting, live.
export default function ThemeToggle() {
  // Unknown until mounted: the server can't see the visitor's choice.
  const [pref, setPref] = React.useState<ThemePreference | null>(null);

  React.useEffect(() => setPref(readPreference()), []);

  React.useEffect(() => {
    if (pref !== 'system') return;
    return watchSystemTheme(() => applyTheme('system'));
  }, [pref]);

  const choose = (value: ThemePreference) => {
    setPref(value);
    savePreference(value);
    applyTheme(value);
  };

  const current = OPTIONS.find((o) => o.value === pref);
  const Icon = current?.Icon ?? Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Theme: ${current?.label ?? 'Light'}`}
        className={style.trigger}
      >
        <Icon aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
          <DropdownMenuItem
            className='cursor-pointer'
            key={value}
            onSelect={() => choose(value)}
          >
            <OptionIcon aria-hidden size={14} />
            {label}
            {pref === value && (
              <Check aria-hidden className='ml-auto' size={14} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
