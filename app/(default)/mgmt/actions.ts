'use server';

import { APP_URL } from 'lib/constants';
import { createClient } from 'lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: formData.get('email') as string,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: APP_URL,
    },
  });

  if (error) {
    notFound();
  }

  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function logout() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    notFound();
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
