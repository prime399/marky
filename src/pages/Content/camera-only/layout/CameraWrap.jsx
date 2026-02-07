import React, { useEffect, useContext, useRef, useState } from "react";

import { useContentState, useContentSetter } from "../../context/ContentState";

const CameraWrap = (props) => {
  const contentState = useContentState();
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
        className={contentState.cameraFlipped ? "camera-flipped" : ""}
        src={chrome.runtime.getURL("camera.html")}
        allow="camera; microphone"
      ></iframe>
    </div>
  );
};

export default CameraWrap;
