import React, { useState, useRef, useContext, useEffect } from "react";
import { Rnd } from "react-rnd";

// Context
import { useContentSetter } from "../context/ContentState";
import { useContentStateSelector } from "../state/contentStore";
import useContentStore from "../state/contentStore";
import { useShallow } from "zustand/react/shallow";

const ResizableBox = () => {
  const regionRef = useRef(null);
  const parentRef = useRef(null);
  const cropRef = useRef(null);
  const recordingRef = useRef(null);
  const { recording, recordingType, customRegion, regionWidth, regionHeight, regionX, regionY, fromRegion, drawingMode, blurMode } =
    useContentStateSelector(
      useShallow((s) => ({
        recording: s.recording,
        recordingType: s.recordingType,
        customRegion: s.customRegion,
        regionWidth: s.regionWidth,
        regionHeight: s.regionHeight,
        regionX: s.regionX,
        regionY: s.regionY,
        fromRegion: s.fromRegion,
        drawingMode: s.drawingMode,
        blurMode: s.blurMode,
      }))
    );
  const setContentState = useContentSetter();

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  // Check for contentState.regionDimensions to update the Rnd component width and height
  useEffect(() => {
    if (recordingType != "region") return;
    if (!customRegion) return;
    if (regionRef.current === null) return;
    if (
      regionWidth === 0 ||
      regionWidth === undefined
    )
      return;
    if (
      regionHeight === 0 ||
      regionHeight === undefined
    )
      return;
    if (regionX === undefined) return;
    if (regionY === undefined) return;
    if (fromRegion) return;

    // Get parent element dimensions
    const parentWidth = parentRef.current.offsetWidth;
    const parentHeight = parentRef.current.offsetHeight;

    // Calculate maximum size that fits within parent element
    const maxWidth = parentWidth - regionX;
    const maxHeight = parentHeight - regionY;
    const newWidth = Math.min(regionWidth, maxWidth);
    const newHeight = Math.min(regionHeight, maxHeight);

    // Update content state with new size
    setContentState((prevContentState) => ({
      ...prevContentState,
      regionWidth: newWidth,
      regionHeight: newHeight,
      fromRegion: true,
    }));

    chrome.storage.local.set({
      regionWidth: newWidth,
      regionHeight: newHeight,
    });

    regionRef.current.updateSize({
      width: newWidth,
      height: newHeight,
      x: regionX,
      y: regionY,
    });
    setCropTarget();
  }, [
    recordingType,
    customRegion,
    regionWidth,
    regionHeight,
    regionX,
    regionY,
  ]);

  const setCropTarget = async () => {
    const target = await CropTarget.fromElement(cropRef.current);
    setContentState((prevContentState) => ({
      ...prevContentState,
      cropTarget: target,
    }));
  };

  const handleResize = (e, direction, ref, delta, position) => {
    // Get numeric values of width and height
    const width = parseInt(ref.style.width, 10);
    const height = parseInt(ref.style.height, 10);

    // Update content state
    setContentState((prevContentState) => ({
      ...prevContentState,
      regionWidth: width,
      regionHeight: height,
      regionX: position.x,
      regionY: position.y,
      fromRegion: true,
    }));

    chrome.storage.local.set({
      regionWidth: width,
      regionHeight: height,
      regionX: position.x,
      regionY: position.y,
    });
    setCropTarget();
  };

  const handleMove = (e, d) => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      regionX: d.x,
      regionY: d.y,
      fromRegion: true,
    }));
    chrome.storage.local.set({
      regionX: d.x,
      regionY: d.y,
    });
    setCropTarget();
  };

  useEffect(() => {
    setCropTarget();
  }, []);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleContextMenu = (e) => {
      if (e.target.className.includes("resize-handle")) {
        e.preventDefault();
      }
    };

    parent.addEventListener("contextmenu", handleContextMenu);
    return () => {
      parent.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents:
          recordingRef.current ||
          drawingMode ||
          blurMode
            ? "none"
            : "auto",
      }}
      className={recordingRef.current ? "region-recording" : ""}
      onClick={(e) => {
        // showExtension false, as long as not clicking on the region
        if (
          e.target.className.indexOf("resize-handle") === -1 &&
          e.target.className.indexOf("react-draggable") === -1 &&
          e.target.className.indexOf("region-rect") === -1
        ) {
          // setContentState((prevContentState) => ({
          //   ...prevContentState,
          //   showExtension: false,
          // }));
        }
      }}
      ref={parentRef}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents:
            recordingRef.current ||
            drawingMode ||
            blurMode
              ? "none"
              : "auto",
        }}
      >
        <div className="box-hole" />
      </div>
      <Rnd
        ref={regionRef}
        style={{
          position: "relative",
          zIndex: 2,
          pointerEvents:
            recordingRef.current ||
            drawingMode ||
            blurMode
              ? "none"
              : "auto",
        }}
        default={{
          x: regionX,
          y: regionY,
          width: regionWidth,
          height: regionHeight,
        }}
        minWidth={50}
        minHeight={50}
        resizeHandleWrapperClass="resize-handle-wrapper"
        resizeHandleComponent={{
          topLeft: <div className="resize-handle top-left" />,
          top: <div className="resize-handle top" />,
          topRight: <div className="resize-handle top-right" />,
          right: <div className="resize-handle right" />,
          bottomRight: <div className="resize-handle bottom-right" />,
          bottom: <div className="resize-handle bottom" />,
          bottomLeft: <div className="resize-handle bottom-left" />,
          left: <div className="resize-handle left" />,
        }}
        bounds="parent"
        onResizeStop={handleResize}
        onDragStop={handleMove}
        disableDragging={
          recording ||
          drawingMode ||
          blurMode
        } // Disable dragging when recording
        enableResizing={
          !recording &&
          !drawingMode &&
          !blurMode
        } // Disable resizing when recording
      >
        <div
          ref={cropRef}
          className="region-rect"
          style={{
            width: "100%",
            height: "100%",
            outline: recordingRef.current ? "none" : "2px dashed #D9D9D9",
            outlineOffset: "2px", // Pushes it inside the box to avoid it being visible in recordings
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.2)",
            borderRadius: "5px",
            zIndex: 2,
            boxSizing: "border-box",
            pointerEvents:
              recordingRef.current ||
              drawingMode ||
              blurMode
                ? "none"
                : "auto",
          }}
        />
      </Rnd>
    </div>
  );
};

export default ResizableBox;
