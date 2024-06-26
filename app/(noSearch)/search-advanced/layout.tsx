import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Advanced search - ${APP_TITLE}` };
}

export default function SearchAdvancedLayout({ children }) {
  return <>{children}</>;
}
