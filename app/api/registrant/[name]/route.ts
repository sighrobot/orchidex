import { NextRequest, NextResponse } from 'next/server';
import { queryRegistrant } from 'lib/queries/registrant';

type Params = Promise<{ name: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { name } = await params;

  const json = await queryRegistrant(name);

  return NextResponse.json(json, { status: 200 });
}
