import React, { useState, useEffect, useContext } from "react";

import * as Toolbar from "@radix-ui/react-toolbar";

import TooltipWrap from "../../toolbar/components/TooltipWrap";

import { CameraCloseIcon, Pip } from "../../toolbar/components/SVG";

import { useContentSetter } from "../../context/ContentState";
import { useContentStateSelector } from "../../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const CameraToolbar = () => {
  const { recording, surface } = useContentStateSelector(
    useShallow((s) => ({
      recording: s.recording,
      surface: s.surface,
    }))
  );
  const setContentState = useContentSetter();

  return (
    <Toolbar.Root className="camera-toolbar">
      <Toolbar.Button
        className="CameraToolbarButton"
        onClick={() => {
          setContentState((prevContentState) => ({
            ...prevContentState,
            cameraActive: false,
          }));
          chrome.storage.local.set({ cameraActive: false });
        }}
      >
        <CameraCloseIcon />
      </Toolbar.Button>
      {recording && surface === "monitor" && (
        <TooltipWrap
          content={chrome.i18n.getMessage("togglePictureinPictureModeTooltip")}
        >
          <Toolbar.Button
            className="CameraToolbarButton CameraMore"
            onClick={() => {
              chrome.runtime.sendMessage({ type: "toggle-pip" });
            }}
          >
            <Pip />
          </Toolbar.Button>
        </TooltipWrap>
      )}
    </Toolbar.Root>
  );
};

export default CameraToolbar;
