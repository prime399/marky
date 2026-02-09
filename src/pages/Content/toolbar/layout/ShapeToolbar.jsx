import React, { useEffect, useState, useContext, useRef } from "react";

import * as Toolbar from "@radix-ui/react-toolbar";
import ToolTrigger from "../components/ToolTrigger";

// Icons
import {
  RectangleIcon,
  CircleIcon,
  TriangleIcon,
  RectangleFilledIcon,
  CircleFilledIcon,
  TriangleFilledIcon,
} from "../components/SVG";

// Context
import { useContentSetter } from "../../context/ContentState";
import { useContentStateSelector } from "../../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const ShapeToolbar = (props) => {
  const { shape, shapeFill } = useContentStateSelector(
    useShallow((s) => ({
      shape: s.shape,
      shapeFill: s.shapeFill,
    }))
  );
  const setContentState = useContentSetter();

  return (
    <div
      aria-label="Cursor options"
      tabIndex="0"
      className={"shapeToolbar " + props.visible}
    >
      <Toolbar.ToggleGroup
        type="single"
        className="ToolbarToggleGroup"
        value={shape}
        onValueChange={(value) => {
          if (value)
            setContentState((prevContentState) => ({
              ...prevContentState,
              shape: value,
            }));
          chrome.storage.local.set({ shape: value });
        }}
      >
        <div className="ToolbarToggleWrap">
          <Toolbar.ToggleItem className="ToolbarToggleItem" value="rectangle">
            {shapeFill ? (
              <RectangleFilledIcon />
            ) : (
              <RectangleIcon />
            )}
          </Toolbar.ToggleItem>
        </div>
        <div className="ToolbarToggleWrap">
          <Toolbar.ToggleItem className="ToolbarToggleItem" value="circle">
            {shapeFill ? <CircleFilledIcon /> : <CircleIcon />}
          </Toolbar.ToggleItem>
        </div>
        <div className="ToolbarToggleWrap">
          <Toolbar.ToggleItem className="ToolbarToggleItem" value="triangle">
            {shapeFill ? <TriangleFilledIcon /> : <TriangleIcon />}
          </Toolbar.ToggleItem>
        </div>
      </Toolbar.ToggleGroup>
      <Toolbar.Separator className="ToolbarSeparator" />
      <ToolTrigger
        type="button"
        value="fill"
        content={chrome.i18n.getMessage("toggleFillTooltip")}
        onClick={() => {
          setContentState((prevContentState) => ({
            ...prevContentState,
            shapeFill: !shapeFill,
          }));
          chrome.storage.local.set({ shapeFill: !shapeFill });
        }}
      >
        {shape === "rectangle" && shapeFill ? (
          <RectangleIcon />
        ) : shape === "circle" && shapeFill ? (
          <CircleIcon />
        ) : shape === "triangle" && shapeFill ? (
          <TriangleIcon />
        ) : shape === "rectangle" && !shapeFill ? (
          <RectangleFilledIcon />
        ) : shape === "circle" && !shapeFill ? (
          <CircleFilledIcon />
        ) : shape === "triangle" && !shapeFill ? (
          <TriangleFilledIcon />
        ) : null}
      </ToolTrigger>
    </div>
  );
};

export default ShapeToolbar;
