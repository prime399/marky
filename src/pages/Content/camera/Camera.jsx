import React, { useContext, useEffect } from "react";

import CameraWrap from "./layout/CameraWrap";

import { useContentStateSelector } from "../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const Camera = (props) => {
  const contentState = useContentStateSelector(
    useShallow((s) => ({
      isSubscribed: s.isSubscribed,
      instantMode: s.instantMode,
      multiMode: s.multiMode,
      recording: s.recording,
      onboarding: s.onboarding,
      defaultVideoInput: s.defaultVideoInput,
      cameraActive: s.cameraActive,
    }))
  );

  return (
    <div
      className="camera-page"
      style={{
        visibility:
          (contentState.isSubscribed &&
            (!contentState.instantMode || contentState.multiMode)) ||
          !contentState.recording ||
          contentState.onboarding
            ? "hidden"
            : "visible",
        pointerEvents:
          (contentState.isSubscribed &&
            (!contentState.instantMode || contentState.multiMode)) ||
          !contentState.recording ||
          contentState.onboarding
            ? "none"
            : "auto",
      }}
    >
      {contentState.defaultVideoInput != "none" &&
        contentState.cameraActive && <CameraWrap shadowRef={props.shadowRef} />}
    </div>
  );
};

export default Camera;
