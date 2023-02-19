import { BaseProps } from 'lib/types';
import cn from 'classnames';
import style from './style.module.scss';

type HProps = BaseProps & { children: React.ReactNode };

export const H2 = ({ className, ...props }: HProps) => (
  <h2 className={cn(style.h2, className)} {...props} />
);

export const H3 = ({ className, ...props }: HProps) => (
  <h3 className={cn(style.h3, className)} {...props} />
);
