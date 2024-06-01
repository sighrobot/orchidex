import { H2 } from 'components/layout';
import { login } from './actions';

export default function LoginPage() {
  return (
    <>
      <H2>Log in</H2>
      <form>
        <label>
          Email: <input id='email' name='email' type='email' required />
        </label>
        <button formAction={login}>Log in</button>
      </form>
    </>
  );
}
