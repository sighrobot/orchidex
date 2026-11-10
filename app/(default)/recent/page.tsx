import { permanentRedirect } from 'next/navigation';

// Retired page. Searching hybrids lists every hybrid registration, newest
// first, which covers what this showed.
export default function LegacyRecentPage() {
  permanentRedirect('/search?type=hybrid');
}
