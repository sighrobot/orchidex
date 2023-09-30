import { headers } from 'next/headers';
import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  const queryString = decodeURIComponent(
    headers().get('x-invoke-query') ?? '{}'
  );
  const query = JSON.parse(queryString);

  const stuff1 = [query.g1, query.e1].filter((s) => s);
  const stuff2 = [query.g2, query.e2].filter((s) => s);

  const strArr = [...stuff1];

  if (stuff1.length > 0 && stuff2.length > 0) {
    strArr.push('×');
  }

  strArr.push(...stuff2);

  const title = `${
    strArr.length > 0
      ? `${strArr.join(' ')} | Advanced search`
      : 'Advanced search'
  } |
    ${APP_TITLE}`;

  return { title };
}

export default function SearchAdvancedLayout({ children }) {
  return <>{children}</>;
}
