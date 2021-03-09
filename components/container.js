import { Header } from "components/header";
import Head from "next/head";
import { Footer } from "./footer";

export const Container = ({ title, children }) => {
  return (
    <div className="container">
      <Head>
        <title>{title}</title>
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
