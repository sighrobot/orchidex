import { Header } from "components/header";
import { Footer } from "./footer";

export const Container = ({ children }) => {
  return (
    <div className="container">
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
