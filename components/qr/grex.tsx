import { makeHrefGrex } from 'components/link/grex';
import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import QR from './';

export default function QRGrex({ grex }: { grex: Grex }) {
  return <QR value={`${APP_URL}${makeHrefGrex(grex)}`} />;
}
