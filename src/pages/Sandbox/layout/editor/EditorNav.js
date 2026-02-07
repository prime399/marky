import React from "react";
import styles from "../../styles/edit/_EditorNav.module.scss";
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context
import ShellTabs from "../ShellTabs";
import {
  editorShellActions,
  useEditorShellSelector,
} from "../../state/editorStore";

const URL = "/assets/";

const EditorNav = () => {
  const contentState = useSandboxState();
  const setContentState = useSandboxSetter(); // Access the ContentState context
  const activeTab = useEditorShellSelector((state) => state.activeTab);

  const handleCancel = () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      mode: "player",
      start: 0,
      end: 1,
    }));

    contentState.restoreBackup();
  };

  const handleRevert = () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      blob: contentState.originalBlob,
      start: 0,
      end: 1,
    }));
  };

  const saveChanges = async () => {
    if (contentState.isFfmpegRunning) return;

    setContentState((prev) => ({
      ...prev,
      mode: "player",
      hasTempChanges: false,
      start: 0,
      end: 1,
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
            {contentState.reencoding
              ? chrome.i18n.getMessage("sandboxEditorSaveProgressButton")
              : chrome.i18n.getMessage("sandboxEditorSaveButton")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorNav;
