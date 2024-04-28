import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { description, formatName } from 'lib/string';
import { APP_TITLE } from 'lib/constants';
import { maybeGetGrex } from './page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params: { genus: g, params },
}: {
  params: { genus: string; params: [string, string] };
}): Promise<Metadata> {
  const [rawE, id] = params;
  const e = decodeURIComponent(rawE);
  const grex = await maybeGetGrex(g, e, id);

  if (!grex) {
    notFound();
  }

  return {
    title: `${formatName(grex).long.full} - ${APP_TITLE}`,
    description: description(grex),
  };
}

export default function GrexLayout({ children }) {
  return <>{children}</>;
}
