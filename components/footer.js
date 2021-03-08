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
          <div>&larr;</div>
        </button>
        <button onClick={() => history.forward()}>
          <div>&rarr;</div>
        </button>
        <button id="share" onClick={handleShare}>
          <img src="https://raw.githubusercontent.com/leungwensen/svg-icon/master/dist/svg/zero/share.svg" />
        </button>
      </footer>
    );
  }

  return null;
};
