import { H2 } from 'components/layout';
import { deleteLists, getList } from 'lib/serverActions/list';

export default async function ListPage({ params: { id } }) {
  const { data: lists } = await getList(id);
  const list = lists?.[0];

  const deleteListWithId = deleteLists.bind(null, [list?.id]);

  return (
    <>
      <H2>List {id}</H2>

      <form key={list?.id} action={deleteListWithId}>
        <button name={list?.id}>Delete list</button>
      </form>
    </>
  );
}
