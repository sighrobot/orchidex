import React from "react";

export const Footer = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShow(true);
    }
  }, []);

  if (show) {
    return (
      <footer>
        <button onClick={() => history.back()}>&larr;</button>
        <button onClick={() => history.forward()}>&rarr;</button>
      </footer>
    );
  }

  return null;
};
