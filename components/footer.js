import React from "react";

export const Footer = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShow(true);
    }
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    }
  };

  if (show) {
    return (
      <footer>
        <button onClick={() => history.back()}>
          <div>&#5130;</div>
        </button>
        <button onClick={() => history.forward()}>
          <div>&#5125;</div>
        </button>
        <button id="share" onClick={handleShare}>
          <img src="https://raw.githubusercontent.com/leungwensen/svg-icon/master/dist/svg/zero/share.svg" />
        </button>
        <button disabled></button>
        <button disabled></button>
      </footer>
    );
  }

  return null;
};
