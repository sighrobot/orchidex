import { query } from "lib/datasette2";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { d: date, limit } = Object.fromEntries(req.nextUrl.searchParams);

  let expr = "SELECT * FROM rhs WHERE epithet != '' AND ";

  if (date) {
    expr += `date_of_registration = '${date}'`;
  } else {
    expr += `date_of_registration != '' AND date_of_registration > '2023-07-20' ORDER BY date_of_registration DESC`;
  }

  if (limit) {
    expr += ` LIMIT ${limit}`;
  } else {
    expr += " LIMIT 100";
  }

  const fetched = await query(expr);
  const json = await fetched?.json();

  const aWeekBefore = new Date(`${json[0].date_of_registration}T00:00:00`);
  aWeekBefore.setDate(aWeekBefore.getDate() - 8);

  const last7Days = json.filter((j) => {
    return new Date(`${j.date_of_registration}T00:00:00`) > aWeekBefore;
  });

  return NextResponse.json(last7Days, { status: 200 });
}
