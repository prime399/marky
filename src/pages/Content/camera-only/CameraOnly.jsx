import React, { useContext } from "react";

import CameraWrap from "./layout/CameraWrap";

import { useContentStateSelector } from "../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const CameraOnly = (props) => {
  const { defaultVideoInput, cameraActive, recordingType } =
    useContentStateSelector(
      useShallow((s) => ({
        defaultVideoInput: s.defaultVideoInput,
        cameraActive: s.cameraActive,
        recordingType: s.recordingType,
      }))
    );

  return (
    <div className="camera-page">
      {defaultVideoInput != "none" &&
        cameraActive &&
        recordingType === "camera" && (
          <CameraWrap shadowRef={props.shadowRef} />
        )}
    </div>
  );
};

export default CameraOnly;
