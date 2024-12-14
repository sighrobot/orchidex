import { H2 } from 'components/layout';

import style from '../style.module.scss';

export default async function LoginPage() {
  return (
    <section className={style.next}>
      <H2>🎉 Check your email!</H2>

      <p>
        <b>A link has been sent to the email address you provided.</b> Whether
        you have an existing Orchidex account or wish to create a new one,
        clicking the link will take care of the rest.
      </p>

      <p>
        <em>Changed your mind? You can safely disregard the email.</em>
      </p>
    </section>
  );
}
