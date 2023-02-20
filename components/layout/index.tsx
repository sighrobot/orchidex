import { BaseProps } from 'lib/types';
import cn from 'classnames';
import style from './style.module.scss';
import Link, { LinkProps } from 'next/link';

type HProps = BaseProps & { children: React.ReactNode };

export const H2 = ({ className, ...props }: HProps) => (
  <h2 className={cn(style.h2, className)} {...props} />
);

export const H3 = ({ className, ...props }: HProps) => (
  <h3 className={cn(style.h3, className)} {...props} />
);

export const SupportBanner = () => (
  <aside className={style.support}>
    <H3>Keep this platform free</H3>
    <p>
      Contribute to the human effort and infrastructure that makes this platform
      possible.
    </p>
  </aside>
);
