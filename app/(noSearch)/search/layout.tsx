import { APP_TITLE } from 'lib/constants';

import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Search | ${APP_TITLE}`,
    description:
      'Learn about the people and organizations who grow and discover orchids species and hybrids by searching hundreds of thousands of records on Orchidex.',
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
