import { Header } from "components/header";
import { Footer } from "./footer";

export const Container = ({ children }) => {
  return (
    <div className="container">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
