'use client';

import { track } from '@vercel/analytics';

import Link from 'next/link';

export const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noreferrer noopener',
};

export default function ExternalLink({
  href,
  trackArgs,
  children,
}: {
  href: string;
  trackArgs?: Parameters<typeof track>;
  children: React.ReactNode;
}) {
  const handleTrack = trackArgs ? () => track(...trackArgs) : undefined;

  return (
    <Link href={href} {...EXTERNAL_LINK_PROPS} onClick={handleTrack}>
      {children}
    </Link>
  );
}
