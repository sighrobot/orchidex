import { Padded } from 'components/container/container';
import { H2, H3 } from 'components/layout';
import Link from 'next/link';
import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';
import ExternalLink from 'components/link/external';

import style from './style.module.scss';

export const metadata: Metadata = {
  title: `About - ${APP_TITLE}`,
};

export default function About() {
  return (
    <>
      <Padded>
        <H2 className={style.heading}>About</H2>
      </Padded>

      <div className={style.about}>
        <article>
          <p>
            Orchidex is a project created, directed, and designed by{' '}
            <ExternalLink
              href='https://charliaorchids.com'
              trackArgs={['Click KT Paeth']}
            >
              KT Paeth
            </ExternalLink>{' '}
            with engineering help from{' '}
            <ExternalLink
              href='https://abe.sh'
              trackArgs={['Click Abe Rubenstein']}
            >
              Abe Rubenstein
            </ExternalLink>
            .
          </p>
        </article>

        <article>
          <H2>FAQ</H2>
          <dl>
            <dt>
              <H3>What is the purpose of this site?</H3>
            </dt>
            <dd>
              Orchidex is a platform for exploring the world of orchid species
              and hybrids. While detailed knowledge of orchid hybridization is
              not required to enjoy the platform, we hope to provide more basic
              educational content soon.
            </dd>

            <dt>
              <H3>Where does the data come from?</H3>
            </dt>
            <dd>
              Please see the <Link href='/about/data'>Data page</Link> for more
              information.
            </dd>

            <dt>
              <H3>How can I contact you?</H3>
            </dt>
            <dd>
              Please feel free to email{' '}
              <Link href='mailto:support@orchidex.org'>
                support@orchidex.org
              </Link>
              . We welcome questions, comments, feature requests, and any other
              feedback you may have.
            </dd>
          </dl>
        </article>
      </div>
    </>
  );
}
