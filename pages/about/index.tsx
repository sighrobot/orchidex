import { Container } from "components/container/container";
import { H2, H3 } from "components/layout";
import Link from "next/link";
import style from "./style.module.scss";

export default function About() {
  return (
    <Container className={style.about} title="About - Orchidex" heading="About">
      <article>
        <p>
          Orchidex is a project by{" "}
          <Link target="_blank" href="https://abe.sh">
            Abe Rubenstein
          </Link>{" "}
          &amp;{" "}
          <a href="https://ktcharliaorchids.com" target="_blank">
            KT Paeth
          </a>
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
            Orchidex is a platform for exploring the world of orchid species and
            hybrids. While detailed knowledge of orchid hybridization is not
            required to enjoy the platform, we hope to provide more basic
            educational content soon.
          </dd>

          <dt>
            <H3>
              Why is this project in <mark>beta</mark>?
            </H3>
          </dt>
          <dd>
            As more people visit and interact with the site for the first time,
            technical and editorial issues may arise. In the spirit of
            discovery, we welcome any and all feedback as we work to keep
            Orchidex running smoothly.
          </dd>

          <dt>
            <H3>Where does the data come from?</H3>
          </dt>
          <dd>
            Please see the <Link href="/data">Data page</Link> for more
            information.
          </dd>

          <dt>
            <H3>How can I contact you?</H3>
          </dt>
          <dd>
            Please feel free to email{" "}
            <Link href="mailto:info@orchidex.org">info@orchidex.org</Link>. We
            welcome questions, comments, feature requests, and any other
            feedback you may have.
          </dd>
        </dl>
      </article>
    </Container>
  );
}
