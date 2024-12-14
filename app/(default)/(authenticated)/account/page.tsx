import { createClient } from 'lib/supabase/server';
import { logout } from 'lib/serverActions/auth';
import { H2 } from 'components/layout';

export default async function AccountPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <H2>Your account</H2>
      <p>Hello {data?.user?.email}</p>
      <form>
        <button formAction={logout}>Log out</button>
      </form>
    </>
  );
}
