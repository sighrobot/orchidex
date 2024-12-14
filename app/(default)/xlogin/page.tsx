import { login } from 'lib/serverActions/auth';
import { H2 } from 'components/layout';

import style from './style.module.scss';

export default async function LoginPage() {
  return (
    <section className={style.login}>
      <H2>Log in / create an account</H2>

      <form>
        <label>
          <input
            id='email'
            name='email'
            type='email'
            required
            placeholder='Email address'
          />
        </label>
        <button formAction={login}>Next</button>
      </form>
    </section>
  );
}
