import cn from 'classnames';

import style from './style.module.scss';

export const Padded = ({ className = '', children, ...rest }) => (
  <section className={cn(style.padded, className)} {...rest}>
    {children}
  </section>
);
