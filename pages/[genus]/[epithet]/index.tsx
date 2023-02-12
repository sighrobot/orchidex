import { fetchGrexByName } from 'lib/hooks/useAncestry';
import { fetchGrex } from 'lib/hooks/useGrex';
import Grex from './[id]';

export async function getServerSideProps(context) {
  const { genus, epithet } = context.query;

  let data;

  if (genus && epithet) {
    data = await fetchGrexByName({ genus, epithet });
  }

  const maybeId = parseInt(epithet);

  if (maybeId) {
    data = await fetchGrex(maybeId);
  }

  if (data) {
    return { props: { grex: data } };
  }

  return { notFound: true };
}

export default Grex;
