import { Header } from "components/header";
import { Footer } from "./footer";

export const Container = ({ children }) => {
  return (
    <div className="container">
      <div>
        <Header />
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  );
};
