import { NextRequest } from 'next/server';
import { cachedJson } from 'lib/cache';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const json = await query(
    "SELECT genus g FROM rhs WHERE genus != 'na' AND epithet != '' GROUP BY genus"
  );

  return cachedJson(json);
}
