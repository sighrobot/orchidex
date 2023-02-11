import { Padded } from 'components/container/container';
import style from './style.module.scss';

export const Hero = ({ subheading, heading, children }) => {
  return (
    <Padded>
      <div className={style.subheading}>{subheading}</div>
      <header className={style.hero}>
        <h2 className={style.heading}>{heading}</h2>
        {children}
      </header>
    </Padded>
  );
};
