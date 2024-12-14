import { notFound } from 'next/navigation';
import { getList } from 'lib/serverActions/list';

export default async function ListLayout({ children, params: { id } }) {
  const { data: lists } = await getList(id);

  const list = lists?.[0];

  if (!list) {
    notFound();
  }

  return <>{children}</>;
}
