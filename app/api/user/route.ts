import { createClient } from 'lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({ user }, { status: user ? 200 : 401 });
}
