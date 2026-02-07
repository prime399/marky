const { assertServiceContract } = require("./interfaces");
const {
  createLocalProjectRepository,
} = require("./localProjectRepository");

const noopAssetService = {
  async createUploadTarget() {
    throw new Error("Local asset uploads are not configured yet.");
  },
  async completeUpload() {
    return { success: true };
  },
  async getPlaybackUrl() {
    return null;
  },
};

const noopExportService = {
  async startExport(projectId) {
    return { jobId: `local-export-${projectId}-${Date.now()}` };
  },
  async getExportStatus() {
    return { status: "pending" };
  },
  async cancelExport() {
    return { success: true };
  },
};

const localAuthService = {
  async getSession() {
    return { authenticated: false, provider: "local" };
  },
  async refreshSession() {
    return { authenticated: false, provider: "local" };
  },
};

const localEntitlementService = {
  async getEntitlements() {
    return { tier: "free", features: [] };
  },
};

const createLocalServices = (options = {}) => {
  const services = {
    projectRepository: createLocalProjectRepository(options),
    assetService: noopAssetService,
    exportService: noopExportService,
    authService: localAuthService,
    entitlementService: localEntitlementService,
  };

  return {
    projectRepository: assertServiceContract(
      "projectRepository",
      services.projectRepository,
    ),
    assetService: assertServiceContract("assetService", services.assetService),
    exportService: assertServiceContract(
      "exportService",
      services.exportService,
    ),
    authService: assertServiceContract("authService", services.authService),
    entitlementService: assertServiceContract(
      "entitlementService",
      services.entitlementService,
    ),
  };
};

module.exports = {
  createLocalServices,
};
