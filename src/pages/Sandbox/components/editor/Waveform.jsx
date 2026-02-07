import React, { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import styles from "../../styles/edit/_Waveform.module.scss";
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context

const WaveformGenerator = (props) => {
  const contentState = useSandboxState();
  const setContentState = useSandboxSetter(); // Access the ContentState context
  const wavesurferRef = useRef(null);
  const waveformContainerRef = useRef(null);
  const customCursorRef = useRef(null);
  const ghostCursorRef = useRef(null);
  const [showGhost, setShowGhost] = useState(false);
  const mouseDown = useRef(false);

  async function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert Blob to ArrayBuffer"));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  const loadWaveform = async (blob) => {
    try {
      if (!waveformContainerRef.current) return;
      wavesurferRef.current = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: "#C4C5CE",
        progressColor: "#9596A2",
        interpolation: "cubic",
        height: "auto",
        cursorWidth: 0,
      });
      const audioArrayBuffer = await blobToArrayBuffer(blob);

      wavesurferRef.current.loadBlob(
        new Blob([audioArrayBuffer], { type: "audio/wav" })
      );

      wavesurferRef.current.on("seeking", (currentTime) => {
        if (!waveformContainerRef.current || !customCursorRef.current) return;
        const containerRect =
          waveformContainerRef.current.getBoundingClientRect();
        const cursorX =
          containerRect.width *
          (currentTime / wavesurferRef.current.getDuration());
        customCursorRef.current.style.left = `${cursorX}px`;
        setContentState((prevContentState) => ({
          ...prevContentState,
          time: currentTime,
          updatePlayerTime: true,
        }));
      });
    } catch (error) {
      console.error("Error loading waveform:", error);
    }
  };

  const handleMouseEnter = () => {
    if (mouseDown.current) return;
    setShowGhost(true);
  };

  const handleMouseMove = (e) => {
    if (!waveformContainerRef.current || !ghostCursorRef.current) return;
    const containerRect = waveformContainerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - containerRect.left;
    const cursorStyle = ghostCursorRef.current.style;
    cursorStyle.left = `${cursorX}px`;
  };

  const handleMouseLeave = () => {
    setShowGhost(false);
  };

  const handleMouseDown = (e) => {
    if (waveformContainerRef.current.contains(e.target)) return;
    mouseDown.current = true;
    setShowGhost(false);
  };

  const handleMouseUp = () => {
    mouseDown.current = false;
  };

  useEffect(() => {
    if (!contentState.blob) return;
    loadWaveform(contentState.blob);
    const container = waveformContainerRef.current;
    if (!container) return;
    container.addEventListener("mouseover", handleMouseEnter);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    if (wavesurferRef.current) {
      wavesurferRef.current.on("seek", (position) => {
        if (!waveformContainerRef.current || !customCursorRef.current) return;
        const containerRect =
          waveformContainerRef.current.getBoundingClientRect();
        const cursorX = containerRect.width * position;
        customCursorRef.current.style.left = `${
          cursorX + containerRect.left
        }px`;
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      container.removeEventListener("mouseover", handleMouseEnter);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [contentState.blob]);

  useEffect(() => {
    if (!contentState.blob) return;
    if (contentState.updatePlayerTime) return;
    if (waveformContainerRef.current === null) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = async () => {
      if (!waveformContainerRef.current || !customCursorRef.current) return;
      const containerRect =
        waveformContainerRef.current.getBoundingClientRect();
      const cursorX =
        containerRect.width * (contentState.time / video.duration);
      customCursorRef.current.style.left = `${cursorX}px`;

      URL.revokeObjectURL(video.src);
      video.remove();
    };
    video.src = URL.createObjectURL(contentState.blob);
  }, [contentState.time, contentState.blob, contentState.updatePlayerTime]);

  return (
    <div style={{ height: "100%" }}>
      <div className={styles.cursor} ref={customCursorRef}></div>
      <div
        className={styles.ghostCursor}
        style={showGhost ? { opacity: 1 } : { opacity: 0 }}
        ref={ghostCursorRef}
      ></div>
      <div className={styles.waveform} ref={waveformContainerRef}></div>
    </div>
  );
};

export default WaveformGenerator;
