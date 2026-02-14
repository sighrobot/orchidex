import { CROSS_CHAR } from 'lib/string';
import { createClient } from 'lib/supabase/server';
import { cachedJson } from 'lib/cache';

function makeFilter(prefix: 'seed' | 'pollen') {
  return `and(${prefix}_parent_epithet.neq."", ${prefix}_parent_id.is.null)`;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('rhs')
    .select('*')
    .neq('seed_parent_epithet', 'na')
    .neq('pollen_parent_epithet', 'na')
    .neq('date_of_registration', '')
    .not('epithet', 'like', `${CROSS_CHAR}%`)
    .or([makeFilter('seed'), makeFilter('pollen')].join(', '));

  return cachedJson(data);
}
