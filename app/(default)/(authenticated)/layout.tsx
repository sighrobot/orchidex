import { createClient } from 'lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function AuthenticatedLayout({ children }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data) {
    notFound();
  }

  return <>{children}</>;
}
