import { createClient } from 'lib/supabase/server';
import { notFound } from 'next/navigation';
import { logout } from '../mgmt/actions';

export default async function AccountPage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    notFound();
  }

  return (
    <>
      <p>Hello {data.user.email}</p>
      <form>
        <button formAction={logout}>Log out</button>
      </form>
    </>
  );
}
