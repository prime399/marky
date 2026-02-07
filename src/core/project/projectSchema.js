const PROJECT_SCHEMA_VERSION = 1;

const SYNC_STATUS = Object.freeze({
  LOCAL_ONLY: "local_only",
  SYNC_PENDING: "sync_pending",
  SYNCED: "synced",
  SYNC_ERROR: "sync_error",
  CONFLICT: "conflict",
});

const createDefaultProject = ({
  id,
  title = "Untitled Recording",
  instantMode = false,
  now = Date.now(),
} = {}) => ({
  id: id || `local-${now}`,
  schemaVersion: PROJECT_SCHEMA_VERSION,
  title,
  createdAt: now,
  updatedAt: now,
  syncStatus: SYNC_STATUS.LOCAL_ONLY,
  syncError: null,
  scenes: {},
  sceneOrder: [],
  settings: {
    instantMode: Boolean(instantMode),
  },
  data: {
    aspectRatio: {
      width: 16,
      height: 9,
      source: "preset",
      preset: "Youtube (16:9)",
    },
    hasRecordingSession: true,
    baseResolution: 720,
    duration: 12,
    fps: 30,
    lastUsedBackdrop: { categoryId: 5, backdropId: 8 },
    lastUsedStylePrefs: {
      screen: {
        padding: 0.8,
        cornerRadius: 0,
        darkMode: false,
        statusBar: false,
        url: "",
        shadow: 0,
        borderThickness: 0,
      },
      camera: {
        padding: 0.8,
        roundness: 1,
      },
      shadowStrength: 0.5,
    },
    lastUsedLayout: {
      type: "cameraVideo",
      layout: "bubble1",
    },
    lastUsedMockup: {
      id: "macbookPro16",
      category: "laptop",
      model: "16-inch",
      color: "silver",
    },
    lastUsedKeyframe: {
      cameraZoom: true,
      cameraScale: 0.8,
      preset: "CINEMATIC",
    },
    captionSettings: {
      enabled: false,
      size: 100,
      position: 82,
      style: "modern-glass",
      defaultSource: "screen",
      textDirection: "ltr",
      wordByWord: false,
    },
    audioSettings: {
      enabled: false,
      track: "none",
      volume: 0.5,
      loop: true,
    },
    scenes: {},
    sceneOrder: [],
  },
});

const migrateProject = (project) => {
  if (!project) {
    return createDefaultProject();
  }

  const schemaVersion = Number(project.schemaVersion || 0);

  if (schemaVersion >= PROJECT_SCHEMA_VERSION) {
    return {
      ...project,
      syncStatus: project.syncStatus || SYNC_STATUS.LOCAL_ONLY,
      syncError: project.syncError || null,
    };
  }

  const migrated = {
    ...project,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    syncStatus: project.syncStatus || SYNC_STATUS.LOCAL_ONLY,
    syncError: project.syncError || null,
    scenes: project.scenes || project.data?.scenes || {},
    sceneOrder: project.sceneOrder || project.data?.sceneOrder || [],
    settings: project.settings || {
      instantMode: Boolean(project.instantMode || project.data?.instantMode),
    },
    updatedAt: project.updatedAt || Date.now(),
  };

  return migrated;
};

module.exports = {
  PROJECT_SCHEMA_VERSION,
  SYNC_STATUS,
  createDefaultProject,
  migrateProject,
};
