'use client';

import { track } from '@vercel/analytics';
import cn from 'classnames';

import Link from 'next/link';

export const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noreferrer noopener',
};

export default function ExternalLink({
  className,
  href,
  trackArgs,
  children,
}: {
  className?: string;
  href: string;
  trackArgs?: Parameters<typeof track>;
  children: React.ReactNode;
}) {
  const handleTrack = trackArgs ? () => track(...trackArgs) : undefined;

  return (
    <Link
      className={className}
      href={href}
      {...EXTERNAL_LINK_PROPS}
      onClick={handleTrack}
    >
      {children}
    </Link>
  );
}
