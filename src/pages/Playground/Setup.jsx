import React, { useEffect, useState, useCallback, useRef } from "react";
import { enumerateCurrentDevices } from "../utils/mediaDeviceFallback";

const isElectron = !!(window.electronAPI);
const api = window.electronAPI;

/**
 * Playground — main recording hub for Electron.
 * Two views: "sourcePicker" (choose screen/window + devices), "recording" (in progress).
 * After recording completes, navigates to editor in the same window.
 */
const Setup = () => {
  const [view, setView] = useState("sourcePicker");
  const [sources, setSources] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loadingSources, setLoadingSources] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [paused, setPaused] = useState(false);

  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState("none");
  const [selectedVideoId, setSelectedVideoId] = useState("none");
  const permissionRequested = useRef(false);

  // Load fonts
  useEffect(() => {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    // Prefer relative URL in Electron; prefer extension URL in extension contexts.
    style.href = isElectron
      ? "assets/fonts/fonts.css"
      : window.chrome?.runtime?.getURL?.("assets/fonts/fonts.css") ||
        "assets/fonts/fonts.css";
    document.body.appendChild(style);
    return () => document.body.removeChild(style);
  }, []);

  // Request mic+camera permission once, then enumerate devices
  useEffect(() => {
    if (permissionRequested.current) return;
    permissionRequested.current = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permission denied — enumerateDevices will return empty labels
      }
      refreshDevices();
    })();
  }, []);

  const refreshDevices = useCallback(async () => {
    const all = await enumerateCurrentDevices();
    setAudioDevices(all.filter((d) => d.kind === "audioinput"));
    setVideoDevices(all.filter((d) => d.kind === "videoinput"));
  }, []);

  // Listen for device hotplug
  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  // Load persisted device preferences on mount
  useEffect(() => {
    chrome.storage.local.get(
      ["defaultAudioInput", "defaultVideoInput"],
      (result) => {
        if (result.defaultAudioInput) setSelectedAudioId(result.defaultAudioInput);
        if (result.defaultVideoInput) setSelectedVideoId(result.defaultVideoInput);
      }
    );
  }, []);

  const handleAudioChange = (e) => {
    const id = e.target.value;
    setSelectedAudioId(id);
    const device = audioDevices.find((d) => d.deviceId === id);
    chrome.storage.local.set({
      defaultAudioInput: id === "none" ? "none" : id,
      defaultAudioInputLabel: device?.label || "",
      micActive: id !== "none",
    });
  };

  const handleVideoChange = (e) => {
    const id = e.target.value;
    setSelectedVideoId(id);
    const device = videoDevices.find((d) => d.deviceId === id);
    chrome.storage.local.set({
      defaultVideoInput: id === "none" ? "none" : id,
      defaultVideoInputLabel: device?.label || "",
      cameraActive: id !== "none",
    });
  };

  // Listen for recording-complete from main process → navigate to editor
  useEffect(() => {
    if (!isElectron) return;
    const unsub = api.on("message", (msg) => {
      if (msg.type === "navigate-to-editor") {
        const editorPage = msg.editorType || "sandbox";
        window.location.href = `${editorPage}.html`;
      }
      if (msg.type === "recording-cancelled") {
        setView("sourcePicker");
        setRecordingTime(0);
        setPaused(false);
      }
    });
    return unsub;
  }, []);

  // Timer during recording
  useEffect(() => {
    if (view !== "recording" || paused) return;
    const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [view, paused]);

  // --- Source picker logic ---
  const loadSources = useCallback(async () => {
    if (!isElectron) return;
    setLoadingSources(true);
    try {
      const result = await api.invoke("capture:getSources", {
        types: ["screen", "window"],
        thumbnailSize: { width: 320, height: 180 },
      });
      setSources(result || []);
      if (result?.length > 0 && !selectedId) {
        const firstScreen = result.find((s) => s.id.startsWith("screen:"));
        setSelectedId(firstScreen?.id || result[0].id);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
    }
    setLoadingSources(false);
  }, [selectedId]);

  // Auto-refresh sources while picker is open
  useEffect(() => {
    if (view !== "sourcePicker") return;
    loadSources();
    const interval = setInterval(loadSources, 2000);
    return () => clearInterval(interval);
  }, [view]);

  const handleSourceShare = async () => {
    if (!selectedId) return;
    await api.invoke("message", {
      type: "source-selected",
      sourceId: selectedId,
    });
    setRecordingTime(0);
    setPaused(false);
    setView("recording");
  };

  const handleStopRecording = async () => {
    await api.invoke("message", { type: "stop-recording-tab" });
    // Main process will send navigate-to-editor
  };

  const handlePauseResume = async () => {
    if (paused) {
      await api.invoke("message", { type: "resume-recording-tab" });
      setPaused(false);
    } else {
      await api.invoke("message", { type: "pause-recording-tab" });
      setPaused(true);
    }
  };

  const handleCancelRecording = async () => {
    await api.invoke("message", { type: "cancel-recording" });
    setView("sourcePicker");
    setRecordingTime(0);
    setPaused(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const filteredSources = sources.filter((s) => {
    if (filter === "screen") return s.id.startsWith("screen:");
    if (filter === "window") return s.id.startsWith("window:");
    return true;
  });

  // --- SOURCE PICKER VIEW ---
  if (view === "sourcePicker") {
    return (
      <div style={styles.page}>
        <div style={styles.pickerContainer}>
          <div style={styles.pickerHeader}>
            <h2 style={styles.pickerTitle}>Choose what to share</h2>
            <div style={styles.filters}>
              {["all", "screen", "window"].map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.filterBtn,
                    ...(filter === f ? styles.filterActive : {}),
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "screen" ? "Screens" : "Windows"}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.grid}>
            {loadingSources && sources.length === 0 && (
              <div style={styles.loading}>Loading sources...</div>
            )}
            {filteredSources.map((source) => (
              <div
                key={source.id}
                style={{
                  ...styles.card,
                  ...(selectedId === source.id ? styles.cardSelected : {}),
                }}
                onClick={() => setSelectedId(source.id)}
              >
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  style={styles.thumbnail}
                />
                <div style={styles.cardLabel}>
                  {source.appIcon && (
                    <img src={source.appIcon} style={styles.appIcon} alt="" />
                  )}
                  <span style={styles.cardName}>{source.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.pickerFooter}>
            <div style={styles.deviceSelectors}>
              <label style={styles.deviceLabel}>
                Microphone
                <select
                  style={styles.deviceSelect}
                  value={selectedAudioId}
                  onChange={handleAudioChange}
                >
                  <option value="none">None</option>
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.deviceLabel}>
                Camera
                <select
                  style={styles.deviceSelect}
                  value={selectedVideoId}
                  onChange={handleVideoChange}
                >
                  <option value="none">None</option>
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              style={{
                ...styles.shareBtn,
                ...(selectedId ? {} : styles.shareBtnDisabled),
              }}
              onClick={handleSourceShare}
              disabled={!selectedId}
            >
              Start Recording
            </button>
          </div>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  // --- RECORDING VIEW ---
  return (
    <div style={styles.page}>
      <div style={styles.recordingCenter}>
        <div style={styles.recordingIndicator}>
          <span style={{
            ...styles.recordingDot,
            ...(paused ? styles.recordingDotPaused : {}),
          }} />
          {paused ? "Paused" : "Recording"}
        </div>
        <div style={styles.timer}>{formatTime(recordingTime)}</div>
        <div style={styles.recordingControls}>
          <button style={styles.controlBtn} onClick={handlePauseResume}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button style={styles.stopBtn} onClick={handleStopRecording}>
            Stop
          </button>
          <button style={styles.discardBtn} onClick={handleCancelRecording}>
            Discard
          </button>
        </div>
      </div>
      <style>{pageStyles}</style>
    </div>
  );
};

const pageStyles = `
  body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    min-height: 100%;
    background-color: #F6F7FB;
    font-family: 'Satoshi-Medium', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  },

  // --- Source Picker ---
  pickerContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    padding: "20px",
    boxSizing: "border-box",
  },
  pickerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexShrink: 0,
  },
  pickerTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    margin: 0,
    color: "#29292F",
  },
  filters: {
    display: "flex",
    gap: "4px",
    backgroundColor: "#E8E9ED",
    borderRadius: "8px",
    padding: "3px",
  },
  filterBtn: {
    border: "none",
    background: "transparent",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#6E7684",
    fontFamily: "inherit",
  },
  filterActive: {
    backgroundColor: "#fff",
    color: "#29292F",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
    flex: 1,
    overflowY: "auto",
    padding: "4px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  cardSelected: {
    borderColor: "#4C7DE2",
    boxShadow: "0 0 0 2px rgba(76,125,226,0.2)",
  },
  thumbnail: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    display: "block",
    backgroundColor: "#E8E9ED",
  },
  cardLabel: {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  appIcon: {
    width: "16px",
    height: "16px",
    flexShrink: 0,
  },
  cardName: {
    fontSize: "13px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  loading: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "40px",
    color: "#6E7684",
  },
  pickerFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "10px",
    marginTop: "16px",
    flexShrink: 0,
  },
  deviceSelectors: {
    display: "flex",
    gap: "12px",
  },
  deviceLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: "12px",
    color: "#6E7684",
    fontFamily: "inherit",
    gap: "4px",
  },
  deviceSelect: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    background: "#fff",
    fontSize: "13px",
    fontFamily: "inherit",
    color: "#29292F",
    minWidth: "180px",
    cursor: "pointer",
  },
  shareBtn: {
    border: "none",
    background: "#4C7DE2",
    color: "#fff",
    padding: "10px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    fontWeight: "bold",
  },
  shareBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  // --- Recording ---
  recordingCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  recordingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#6E7684",
    fontWeight: "bold",
  },
  recordingDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#E53935",
    display: "inline-block",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  recordingDotPaused: {
    backgroundColor: "#F59E0B",
    animation: "none",
  },
  timer: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#29292F",
    fontFamily: "'Satoshi-Bold', monospace",
    letterSpacing: "2px",
  },
  recordingControls: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  controlBtn: {
    border: "1px solid #D1D5DB",
    background: "#fff",
    padding: "10px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#29292F",
  },
  stopBtn: {
    border: "none",
    background: "#E53935",
    color: "#fff",
    padding: "10px 28px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    fontWeight: "bold",
  },
  discardBtn: {
    border: "1px solid #D1D5DB",
    background: "#fff",
    padding: "10px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#9CA3AF",
  },
};

export default Setup;
