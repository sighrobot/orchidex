import { Metadata } from 'next';
import React from 'react';

import { Grex } from 'lib/types';
import { APP_TITLE, APP_URL } from 'lib/constants';
import { StatMap, createRegistrantStatMap } from './page';

const buildDescription = (
  name: string,
  statMap: StatMap,
  registrantGrexes: Grex[]
) => {
  const tokens: string[] = [];

  if (statMap.primary > 0) {
    tokens.push(`${statMap.primary.toLocaleString()} primary`);
  }
  if (statMap.intergeneric > 0) {
    tokens.push(`${statMap.intergeneric.toLocaleString()} intergeneric`);
  }

  const thisYear = new Date().getFullYear();
  const endYear = parseInt(
    registrantGrexes[0]?.date_of_registration.slice(0, 4),
    10
  );

  const didEndThisYear = endYear === thisYear;

  let timeString = '';

  if (didEndThisYear) {
    timeString = `Since ${statMap.firstYear},`;
  } else {
    timeString = `From ${
      statMap.firstYear
    } to ${registrantGrexes[0]?.date_of_registration.slice(0, 4)},`;
  }

  let desc = `${timeString} ${name}${
    didEndThisYear ? ' has ' : ' '
  }registered or originated ${registrantGrexes.length.toLocaleString()} orchid ${
    registrantGrexes.length === 1 ? 'hybrid' : 'hybrids'
  } in ${statMap.genera.size} genera`;

  if (tokens.length > 0) {
    const tokenString = tokens.join(' and ');
    desc += `, including ${tokenString}`;
  }

  return `${desc}.`;
};

export async function fetchRegistrant(name: string): Promise<object[]> {
  const res = await fetch(
    `${APP_URL}/api/registrant/${encodeURIComponent(name)}`
  );
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { r: string };
}): Promise<Metadata> {
  const registrantName = decodeURIComponent(params.r);
  const registrantGrexes = (await fetchRegistrant(registrantName)) as Grex[];

  const statMap = createRegistrantStatMap(registrantName, registrantGrexes);

  return {
    title: `${registrantName} - ${APP_TITLE}`,
    description: buildDescription(registrantName, statMap, registrantGrexes),
  };
}

export default function RegistrantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
