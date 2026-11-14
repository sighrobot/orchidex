import { Header } from 'components/header/header';
import SectionNav from 'components/section-nav/section-nav';

import style from './style.module.scss';

export const HeaderLayout = ({ children, hasSearch = true }) => (
  <>
    <Header hasSearch={hasSearch} />
    <SectionNav />
    <main className={style.layout}>{children}</main>
  </>
);
