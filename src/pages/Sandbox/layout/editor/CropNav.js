import React from "react";
import styles from "../../styles/edit/_EditorNav.module.scss";
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context
import ShellTabs from "../ShellTabs";
import {
  editorShellActions,
  useEditorShellSelector,
} from "../../state/editorStore";

const URL = "/assets/";

const CropNav = () => {
  const contentState = useSandboxState();
  const setContentState = useSandboxSetter(); // Access the ContentState context
  const activeTab = useEditorShellSelector((state) => state.activeTab);

  const handleCancel = () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      mode: "player",
      start: 0,
      end: 1,
      width: contentState.prevWidth,
      height: contentState.prevHeight,
      left: 0,
      top: 0,
      fromCropper: false,
    }));

    contentState.clearBackup();
  };

  const handleRevert = () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      blob: contentState.originalBlob,
      start: 0,
      end: 1,
      width: contentState.prevWidth,
      height: contentState.prevHeight,
      left: 0,
      top: 0,
      fromCropper: false,
    }));
  };

  const saveChanges = async () => {
    await contentState.handleCrop(
      contentState.left,
      contentState.top,
      contentState.width,
      contentState.height
    );

    setContentState((prev) => ({
      ...prev,
      // mode: "player",
      fromCropper: true,
      hasTempChanges: false,
    }));

    contentState.clearBackup();
  };

  return (
    <div className={styles.editorNav}>
      <div className={styles.navWrap}>
        <div
          className={styles.editorNavLeft}
          onClick={() => {
            chrome.runtime.sendMessage({ type: "open-home" });
          }}
        >
          <img src={URL + "editor/logo.svg"} alt="Logo" />
        </div>
        <div className={styles.editorNavCenter}>
          <ShellTabs
            activeTab={activeTab}
            onTabChange={editorShellActions.setActiveTab}
            inline
          />
        </div>
        <div className={styles.editorNavRight}>
          <button
            className="button simpleButton blackButton"
            onClick={handleCancel}
            disabled={contentState.isFfmpegRunning}
          >
            {chrome.i18n.getMessage("sandboxEditorCancelButton")}
          </button>
          <button
            className="button secondaryButton"
            onClick={handleRevert}
            disabled={contentState.isFfmpegRunning}
          >
            {chrome.i18n.getMessage("sandboxEditorRevertButton")}
          </button>
          <button
            className="button primaryButton"
            onClick={saveChanges}
            disabled={contentState.isFfmpegRunning}
          >
            {contentState.isFfmpegRunning ? (
              contentState.processingProgress > 0 ? (
                <>
                  {chrome.i18n.getMessage("sandboxEditorSaveProgressButton") ||
                    "Saving"}{" "}
                  {Math.round(contentState.processingProgress)}%
                </>
              ) : (
                chrome.i18n.getMessage("sandboxEditorSaveProgressButton") ||
                "Saving..."
              )
            ) : (
              chrome.i18n.getMessage("sandboxEditorSaveButton") ||
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropNav;
