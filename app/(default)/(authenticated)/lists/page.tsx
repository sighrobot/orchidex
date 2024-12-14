import Link from 'next/link';
import { H2, H3 } from 'components/layout';
import { createList, deleteLists, getLists } from 'lib/serverActions/list';

export default async function ListsPage() {
  const { data: lists } = await getLists();

  return (
    <>
      <H2>Your lists</H2>

      <form action={createList}>
        <button type='submit'>Create list</button>
      </form>

      {lists?.map((list) => {
        const deleteListWithId = deleteLists.bind(null, [list.id]);

        return (
          <form key={list.id} action={deleteListWithId}>
            <H3>{list?.id}</H3>
            <Link href={`/lists/${list?.id}`}>view</Link>
            <button name={list.id}>Delete</button>
          </form>
        );
      })}
    </>
  );
}
