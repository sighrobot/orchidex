import { fetchGrex } from 'lib/hooks/useGrex';

import Grex from 'pages/[genus]/[epithet]/[id]';

export async function getServerSideProps(context) {
  const { id } = context.query;

  if (parseInt(id, 10)) {
    const data = await fetchGrex(id);

    if (data) {
      return { props: { grex: data } };
    }
  }

  return { notFound: true };
}

export default Grex;
