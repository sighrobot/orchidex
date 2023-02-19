import { Padded } from 'components/container/container';
import { H2 } from 'components/layout';
import style from './style.module.scss';

export const Hero = ({ subheading = '', heading, children }) => {
  return (
    <Padded>
      {subheading && <div className={style.subheading}>{subheading}</div>}
      <header className={style.hero}>
        <H2 className={style.heading}>{heading}</H2>
        {children}
      </header>
    </Padded>
  );
};
