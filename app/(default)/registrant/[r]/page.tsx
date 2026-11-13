import { permanentRedirect } from 'next/navigation';

// Retired URL: registrants and originators share one page under /people.
export default async function LegacyRegistrantPage({
  params,
}: {
  params: Promise<{ r: string }>;
}) {
  const { r } = await params;
  permanentRedirect(`/people/${encodeURIComponent(decodeURIComponent(r))}`);
}
