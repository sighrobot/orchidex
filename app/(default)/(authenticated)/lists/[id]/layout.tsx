import { notFound } from 'next/navigation';
import { getListCached } from './getListCached';

export default async function ListLayout({ children, params: { id } }) {
  const { data: lists } = await getListCached(id);

  const list = lists?.[0];

  if (!list) {
    notFound();
  }

  return <>{children}</>;
}
