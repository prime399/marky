import { createDefaultProject } from "../../core/project/projectSchema";
import { MESSAGE_TYPES } from "../../core/messaging/messageTypes";

export const createVideoProject = async ({
  title = "Untitled Recording",
  instantMode = false,
} = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      return reject(new Error("Chrome extension runtime is not available"));
    }

    const project = createDefaultProject({
      title,
      instantMode,
    });

    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.CREATE_VIDEO_PROJECT,
        title,
        data: project.data,
        project,
        instantMode,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(
            new Error(
              "Extension runtime error: " + chrome.runtime.lastError.message
            )
          );
        }

        if (!response || !response.success) {
          if (response?.message === "User not authenticated") {
            chrome.runtime.sendMessage({ type: "handle-login" });
            return reject(new Error("User not authenticated — login required"));
          }

          return reject(
            new Error(response?.error || "Failed to create video project")
          );
        }

        resolve(response.videoId);
      }
    );
  });
};
