import React, { useEffect, useContext, useRef, useState } from "react";

import { useContentSetter } from "../../context/ContentState";
import { useContentStateSelector } from "../../state/contentStore";

const CameraWrap = (props) => {
  const cameraFlipped = useContentStateSelector((s) => s.cameraFlipped);
  const setContentState = useContentSetter();

  return (
    <div>
      <iframe
        style={{
          width: "80vw",
          outline: "none",
          border: "none",
          pointerEvents: "none",
          zIndex: 0,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: "auto",
        }}
        className={cameraFlipped ? "camera-flipped" : ""}
        src={chrome.runtime.getURL("camera.html")}
        allow="camera; microphone"
      ></iframe>
    </div>
  );
};

export default CameraWrap;
