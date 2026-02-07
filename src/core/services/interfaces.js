/**
 * Service contract placeholders for adapter-based architecture.
 * Implementations should satisfy these async method signatures.
 */
const serviceContracts = {
  projectRepository: ["loadProject", "saveProject", "listProjects"],
  assetService: ["createUploadTarget", "completeUpload", "getPlaybackUrl"],
  exportService: ["startExport", "getExportStatus", "cancelExport"],
  authService: ["getSession", "refreshSession"],
  entitlementService: ["getEntitlements"],
};

const assertServiceContract = (name, service) => {
  const requiredMethods = serviceContracts[name] || [];
  const missing = requiredMethods.filter(
    (method) => typeof service?.[method] !== "function",
  );

  if (missing.length) {
    throw new Error(
      `Service "${name}" is missing methods: ${missing.join(", ")}`,
    );
  }

  return service;
};

module.exports = {
  serviceContracts,
  assertServiceContract,
};
