import React, { useContext } from "react";

import CameraWrap from "./layout/CameraWrap";

import { useContentState, useContentSetter } from "../context/ContentState";

const CameraOnly = (props) => {
  const contentState = useContentState();
  const setContentState = useContentSetter();

  return (
    <div className="camera-page">
      {contentState.defaultVideoInput != "none" &&
        contentState.cameraActive &&
        contentState.recordingType === "camera" && (
          <CameraWrap shadowRef={props.shadowRef} />
        )}
    </div>
  );
};

export default CameraOnly;
