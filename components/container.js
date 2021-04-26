import { Header } from "components/header";
import Head from "next/head";
import { Footer } from "./footer";

export const Container = ({ title, children, description }) => {
  return (
    <div className="container">
      <Head>
        <title>{title}</title>

        <meta name="twitter:title" content={title} />
        <meta property="og:title" content={title} />

        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
      </Head>
      <div>
        <div>
          <Header />
          <main>{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
};
