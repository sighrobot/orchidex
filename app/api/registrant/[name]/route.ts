import { NextRequest, NextResponse } from 'next/server';
import { queryPerson } from 'lib/queries/people';

type Params = Promise<{ name: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { name } = await params;

  const json = await queryPerson(name);

  return NextResponse.json(json, { status: 200 });
}
