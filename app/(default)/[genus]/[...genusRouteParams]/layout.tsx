import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { description, formatName } from 'lib/string';
import { APP_TITLE } from 'lib/constants';
import { GrexPageParams, maybeGetGrex } from './page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: GrexPageParams;
}): Promise<Metadata> {
  const { genus: g, genusRouteParams } = await params;
  const [rawE, id] = genusRouteParams;
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
