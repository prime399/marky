const {
  createDefaultProject,
  migrateProject,
  SYNC_STATUS,
} = require("../project/projectSchema");

const PROJECTS_KEY = "localProjectsV1";

const createChromeStorageAdapter = (storageArea) => ({
  async get(key) {
    const result = await storageArea.get([key]);
    return result[key];
  },
  async set(key, value) {
    await storageArea.set({ [key]: value });
  },
});

const createMemoryStorageAdapter = (seed = {}) => {
  const state = { ...seed };
  return {
    async get(key) {
      return state[key];
    },
    async set(key, value) {
      state[key] = value;
    },
  };
};

const createLocalProjectRepository = ({ storage } = {}) => {
  const resolvedStorage =
    storage ||
    (typeof chrome !== "undefined" &&
    chrome.storage?.local &&
    typeof chrome.storage.local.get === "function"
      ? createChromeStorageAdapter(chrome.storage.local)
      : createMemoryStorageAdapter());

  const readAll = async () => {
    const projects = (await resolvedStorage.get(PROJECTS_KEY)) || {};
    return projects;
  };

  const writeAll = async (projects) => {
    await resolvedStorage.set(PROJECTS_KEY, projects);
    return projects;
  };

  return {
    async loadProject(projectId) {
      const projects = await readAll();
      return projects[projectId] ? migrateProject(projects[projectId]) : null;
    },

    async saveProject(project) {
      const now = Date.now();
      const defaults = createDefaultProject();
      const merged = { ...defaults };
      for (const key of Object.keys(project)) {
        if (project[key] !== undefined) {
          merged[key] = project[key];
        }
      }
      merged.updatedAt = now;
      const normalized = migrateProject(merged);
      if (!normalized.syncStatus) {
        normalized.syncStatus = SYNC_STATUS.LOCAL_ONLY;
      }

      const projects = await readAll();
      projects[normalized.id] = normalized;
      await writeAll(projects);
      return normalized;
    },

    async listProjects() {
      const projects = await readAll();
      return Object.values(projects)
        .map(migrateProject)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
  };
};

module.exports = {
  PROJECTS_KEY,
  createChromeStorageAdapter,
  createMemoryStorageAdapter,
  createLocalProjectRepository,
};
