import { Header } from 'components/header/header';

import style from './style.module.scss';

export const HeaderLayout = ({ children, hasSearch = true }) => (
  <>
    <Header hasSearch={hasSearch} />
    <main className={style.layout}>{children}</main>
  </>
);
