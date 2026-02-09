import React, { useEffect, useContext, useState } from "react";

import * as Tooltip from "@radix-ui/react-tooltip";

// Context
import { useContentStateSelector } from "../../state/contentStore";

const TooltipWrap = (props) => {
  const hideUI = useContentStateSelector((s) => s.hideUI);
  const classname = props.name ? props.name : "";
  const [override, setOverride] = useState("");

  useEffect(() => {
    // Check if hideUI is set
    if (hideUI) {
      setOverride("override");
    } else {
      setOverride("");
    }
  }, [hideUI]);

  return (
    <div className={classname} style={props.style}>
      {props.content == "" ? (
        <div>{props.children}</div>
      ) : (
        <Tooltip.Provider>
          <Tooltip.Root delayDuration={700} defaultOpen={false}>
            <Tooltip.Trigger asChild>{props.children}</Tooltip.Trigger>
            <Tooltip.Portal
              container={
                document.getElementsByClassName("screenity-shadow-dom")[0]
              }
            >
              <Tooltip.Content
                className={
                  "TooltipContent" +
                  " " +
                  props.override +
                  " " +
                  props.hide +
                  " " +
                  override
                }
                style={{
                  display: override === "override" ? "none" : "block",
                  whiteSpace: "pre-line",
                  maxWidth: "240px",
                  lineHeight: "1.4",
                  ...props.tooltipStyle,
                }}
                side={props.side || "left"}
                sideOffset={props.sideOffset || 8}
              >
                {props.content}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}
    </div>
  );
};

export default TooltipWrap;
