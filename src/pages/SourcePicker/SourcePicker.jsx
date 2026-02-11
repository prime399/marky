import React, { useEffect, useState } from "react";

const SourcePicker = () => {
  const [sources, setSources] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "screen" | "window"
  const [loading, setLoading] = useState(true);

  const api = window.electronAPI;

  const loadSources = async () => {
    setLoading(true);
    try {
      const result = await api.invoke("capture:getSources", {
        types: ["screen", "window"],
        thumbnailSize: { width: 320, height: 180 },
      });
      setSources(result || []);
      // Auto-select first screen
      if (result?.length > 0 && !selectedId) {
        const firstScreen = result.find((s) => s.id.startsWith("screen:"));
        setSelectedId(firstScreen?.id || result[0].id);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSources();
    // Refresh every 2 seconds for live thumbnails
    const interval = setInterval(loadSources, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredSources = sources.filter((s) => {
    if (filter === "screen") return s.id.startsWith("screen:");
    if (filter === "window") return s.id.startsWith("window:");
    return true;
  });

  const handleSelect = async () => {
    if (!selectedId) return;
    // Send selected source back to main process
    await api.invoke("message", {
      type: "source-selected",
      sourceId: selectedId,
    });
    // Close this window
    window.close();
  };

  const handleCancel = () => {
    api.invoke("message", { type: "source-cancelled" });
    window.close();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {chrome.i18n.getMessage("screenType") || "Choose what to share"}
        </h2>
        <div style={styles.filters}>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === "all" ? styles.filterActive : {}),
            }}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === "screen" ? styles.filterActive : {}),
            }}
            onClick={() => setFilter("screen")}
          >
            Screens
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === "window" ? styles.filterActive : {}),
            }}
            onClick={() => setFilter("window")}
          >
            Windows
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {loading && sources.length === 0 && (
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

      <div style={styles.footer}>
        <button style={styles.cancelBtn} onClick={handleCancel}>
          Cancel
        </button>
        <button
          style={{
            ...styles.shareBtn,
            ...(selectedId ? {} : styles.shareBtnDisabled),
          }}
          onClick={handleSelect}
          disabled={!selectedId}
        >
          Share
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Satoshi-Medium', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#F6F7FB",
    color: "#29292F",
    padding: "20px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexShrink: 0,
  },
  title: {
    fontSize: "18px",
    fontWeight: "bold",
    margin: 0,
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
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
    height: "160px",
    objectFit: "cover",
    display: "block",
    backgroundColor: "#E8E9ED",
  },
  cardLabel: {
    padding: "10px 12px",
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
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "16px",
    flexShrink: 0,
  },
  cancelBtn: {
    border: "1px solid #D1D5DB",
    background: "#fff",
    padding: "10px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#29292F",
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
};

export default SourcePicker;
