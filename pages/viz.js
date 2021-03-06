import { Container } from "components/container";
import React from "react";

const Viz = () => {
  React.useEffect(() => {
    var divElement = document.getElementById("viz1615064721059");
    var vizElement = divElement.getElementsByTagName("object")[0];
    if (divElement.offsetWidth > 800) {
      vizElement.style.minWidth = "400px";
      vizElement.style.maxWidth = "1609px";
      vizElement.style.width = "100%";
      vizElement.style.height = "2027px";
    } else if (divElement.offsetWidth > 500) {
      vizElement.style.minWidth = "400px";
      vizElement.style.maxWidth = "1609px";
      vizElement.style.width = "100%";
      vizElement.style.height = "2027px";
    } else {
      vizElement.style.width = "100%";
      vizElement.style.height = "727px";
    }
    var scriptElement = document.createElement("script");
    scriptElement.src = "https://public.tableau.com/javascripts/api/viz_v1.js";
    vizElement.parentNode.insertBefore(scriptElement, vizElement);
  }, []);

  return (
    <Container>
      <div
        className="tableauPlaceholder"
        id="viz1615064721059"
        style={{ position: "relative" }}
      >
        <object className="tableauViz" style={{ display: "none" }}>
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />{" "}
          <param name="embed_code_version" value="3" />{" "}
          <param name="site_root" value="" />
          <param name="name" value="orchids&#47;Dashboard1" />
          <param name="tabs" value="no" />
          <param name="toolbar" value="yes" />
          <param
            name="static_image"
            value="https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;or&#47;orchids&#47;Dashboard1&#47;1.png"
          />{" "}
          <param name="animate_transition" value="yes" />
          <param name="display_static_image" value="yes" />
          <param name="display_spinner" value="yes" />
          <param name="display_overlay" value="yes" />
          <param name="display_count" value="yes" />
          <param name="language" value="en" />
        </object>
      </div>
    </Container>
  );
};

export default Viz;
