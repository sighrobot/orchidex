import React from "react";

export const Footer = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShow(true);
    }
  }, []);

  if (show) {
    return <footer>pwa</footer>;
  }

  return null;
};
