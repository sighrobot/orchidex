import { Header } from 'components/header';

export const Container = ({ children }) => {
  return (
    <div className="container">
      <Header />
      <main>{children}</main>
    </div>
  );
};
