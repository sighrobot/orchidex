import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Genus dominance - Learn | ${APP_TITLE}`,
    description: `A visualization depicting the dominance over time of genera used in
              orchid hybridization, as registered by the Royal Horticultural
              Society.`,
    openGraph: { images: ['/learn/genus-dominance.png'] },
  };
}

export default function GenusDominanceLayout({ children }) {
  return <>{children}</>;
}
