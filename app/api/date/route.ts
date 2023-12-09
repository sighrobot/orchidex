import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { limit, genus } = Object.fromEntries(req.nextUrl.searchParams);

  let expr = `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
    ', '
  )} FROM rhs WHERE epithet != '' AND `;

  if (genus) {
    expr += `lower(genus) = '${genus}' AND `;
  }

  expr += `date_of_registration != '' ORDER BY date_of_registration DESC, id::int DESC`;

  if (limit) {
    expr += ` LIMIT ${limit}`;
  } else {
    expr += ' LIMIT 100';
  }

  const json = await query(expr);

  let last7Days = json;

  if (!genus && json?.[0]) {
    const aWeekBefore = new Date(`${json[0].date_of_registration}T00:00:00`);
    aWeekBefore.setDate(aWeekBefore.getDate() - 8);

    last7Days = json.filter((j) => {
      return new Date(`${j.date_of_registration}T00:00:00`) > aWeekBefore;
    });
  }

  return NextResponse.json(last7Days, { status: 200 });
}
