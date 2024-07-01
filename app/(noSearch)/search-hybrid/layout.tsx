import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Hybrid search - ${APP_TITLE}` };
}

export default function SearchHybridLayout({ children, searchParams }) {
  console.log(searchParams);
  return <>{children}</>;
}
