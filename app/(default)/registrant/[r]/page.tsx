import React from 'react';
import { Grex } from 'lib/types';
import { fetchRegistrant, RegistrantPageParams } from './layout';
import RegistrantView from './view';

export default async function RegistrantPage({
  params,
}: {
  params: RegistrantPageParams;
}) {
  const { r } = await params;
  const name = decodeURIComponent(r);
  const rawData = (await fetchRegistrant(name)) as Grex[];

  return (
    <>
      <RegistrantView name={name} rawData={rawData} />
    </>
  );
}
