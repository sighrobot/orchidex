import { BaseProps } from 'lib/types';
import React from 'react';
import style from './style.module.scss';
import cn from 'classnames';

type ButtonSimpleProps = BaseProps & {
  children?: React.ReactNode;
  onClick: (e: any) => void;
};

export const ButtonSimple = ({
  className,
  children,
  onClick,
  style: inlineStyle,
}: ButtonSimpleProps) => {
  return (
    <button
      className={cn(style.simple, className)}
      onClick={onClick}
      style={inlineStyle}
      type='button'
    >
      {children}
    </button>
  );
};
