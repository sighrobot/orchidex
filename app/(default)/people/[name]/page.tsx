import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { APP_TITLE } from 'lib/constants';
import { queryPerson, queryPersonParentBreeders } from 'lib/queries/people';

import { describePerson, summarizePerson } from './summary';
import PersonView from './view';

type Params = Promise<{ name: string }>;

const fetchPerson = cache((name: string) => queryPerson(name));

const getName = async (params: Params) =>
  decodeURIComponent((await params).name);

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const name = await getName(params);
  const grexes = await fetchPerson(name);

  if (grexes.length === 0) return { title: `${name} - ${APP_TITLE}` };

  return {
    title: `${name} - ${APP_TITLE}`,
    description: describePerson(summarizePerson(name, grexes)),
  };
}

export default async function PersonPage({ params }: { params: Params }) {
  const name = await getName(params);
  const [grexes, parentBreeders] = await Promise.all([
    fetchPerson(name),
    queryPersonParentBreeders(name),
  ]);

  if (grexes.length === 0) notFound();

  return (
    <PersonView grexes={grexes} name={name} parentBreeders={parentBreeders} />
  );
}
