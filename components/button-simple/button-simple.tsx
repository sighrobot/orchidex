import React, { CSSProperties } from 'react';
import style from './style.module.scss';

type ButtonSimpleProps = {
  children?: React.ReactNode;
  onClick: (e: any) => void;
  style?: CSSProperties;
};

export const ButtonSimple = ({
  children,
  onClick,
  style: inlineStyle,
}: ButtonSimpleProps) => {
  return (
    <button
      className={style.simple}
      onClick={onClick}
      style={inlineStyle}
      type='button'
    >
      {children}
    </button>
  );
};
