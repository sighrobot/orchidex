import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { capitalize } from 'lib/utils';

export const primaryMetadata = (
  rawGenus: string,
  rawCross?: string,
): Metadata => {
  const genus = capitalize(decodeURIComponent(rawGenus).toLowerCase());
  const cross = rawCross
    ? capitalize(decodeURIComponent(rawCross).toLowerCase())
    : genus;
  const name = cross === genus ? genus : `${genus} × ${cross}`;

  return {
    title: `${name} primary hybrids | Learn @ ${APP_TITLE}`,
    description:
      cross === genus
        ? `Every cross between two ${genus} species: which have been registered as primary hybrids, and which haven't yet.`
        : `Every cross between a ${genus} species and a ${cross} species: which have been registered as primary hybrids, and which haven't yet.`,
    openGraph: { images: ['/learn/primary-hybrids.png'] },
  };
};
