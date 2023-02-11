import { fetchGrexByName } from 'lib/hooks/useAncestry';
import Grex from './[id]';

export async function getServerSideProps(context) {
  const { genus, epithet } = context.query;

  if (genus && epithet) {
    const data = await fetchGrexByName({ genus, epithet });

    if (data) {
      return { props: { grex: data } };
    }
  }

  return { notFound: true };
}

export default Grex;
