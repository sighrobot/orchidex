'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from 'lib/supabase/server';

export async function createList() {
  const supabase = createClient();
  await supabase.from('lists').insert({});

  revalidatePath('/account', 'layout');
}

export async function deleteLists(ids: string[]) {
  const supabase = createClient();

  await supabase.from('lists').delete().in('id', ids);

  revalidatePath('/account', 'layout');
}

export async function deleteList(id: string) {
  return deleteLists([id]);
}

export async function getLists() {
  const supabase = createClient();
  return supabase.from('lists').select('*');
}
export async function getList(id: string) {
  const supabase = createClient();
  return supabase.from('lists').select('*').eq('id', id);
}
