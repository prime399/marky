import React, { useContext } from "react";
import * as Toggle from "@radix-ui/react-toggle";

// Components
import TooltipWrap from "./TooltipWrap";

import { MicIcon } from "./SVG";

// Context
import { useContentSetter } from "../../context/ContentState";
import { useContentStateSelector } from "../../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const MicToggle = (props) => {
  const contentState = useContentStateSelector(
    useShallow((s) => ({
      microphonePermission: s.microphonePermission,
      micActive: s.micActive,
      defaultAudioInput: s.defaultAudioInput,
      openToast: s.openToast,
    }))
  );
  const setContentState = useContentSetter();

  return (
    <TooltipWrap
      content={
        contentState.microphonePermission && contentState.micActive
          ? chrome.i18n.getMessage("disableMicrophoneTooltip")
          : contentState.microphonePermission && !contentState.micactive
          ? chrome.i18n.getMessage("enableMicrophoneTooltip")
          : chrome.i18n.getMessage("noMicrophonePermissionsTooltip")
      }
    >
      <div className="ToolbarToggleWrap">
        <Toggle.Root
          className="ToolbarModeItemSingle"
          aria-label="Toggle microphone"
          pressed={contentState.micActive}
          disabled={
            !contentState.microphonePermission ||
            contentState.defaultAudioInput === "none"
          }
          onPressedChange={(pressed) => {
            setContentState((prevContentState) => ({
              ...prevContentState,
              micActive: pressed,
            }));

            chrome.storage.local.set({
              micActive: pressed,
            });

            chrome.runtime.sendMessage({
              type: "set-mic-active-tab",
              active: pressed,
              defaultAudioInput: contentState.defaultAudioInput,
            });

            // Show toast
            contentState.openToast(
              pressed
                ? chrome.i18n.getMessage("micOnToast")
                : chrome.i18n.getMessage("micOffToast"),
              () => {}
            );
          }}
        >
          <MicIcon />
        </Toggle.Root>
      </div>
    </TooltipWrap>
  );
};

export default MicToggle;
