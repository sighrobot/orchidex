import { createClient } from 'lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: 'unauth' }, { status: 401 });
  }

  const { data } = supabase.from('lists').select('*').eq('user_id', user.id);

  return NextResponse.json([], { status: 200 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(user, { status: 401 });
  }

  // const listData = await req.json();

  await supabase.from('lists').insert({});

  return NextResponse.json({ message: 'ok' }, { status: 200 });
}
