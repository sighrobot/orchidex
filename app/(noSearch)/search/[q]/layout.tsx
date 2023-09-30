import { APP_TITLE } from 'lib/constants';
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const q = decodeURIComponent(params.q);
  return {
    title: `${q} - Search | ${APP_TITLE}`,
    description: `Search hundreds of thousands of records on Orchidex for "${q}" and learn about the people and organizations who grow and discover orchids species and hybrids.`,
  };
}

export default async function SearchLayout({ children }) {
  return <>{children}</>;
}
