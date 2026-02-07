import React, { useContext, useState } from "react";

// Components
import PlayerNav from "./PlayerNav";
import CropNav from "../editor/CropNav";
import AudioNav from "../editor/AudioNav";
import TrimUI from "../editor/TrimUI";
import RightPanel from "./RightPanel";
import Content from "./Content";

import styles from "../../styles/player/_Player.module.scss";

// Context
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context
import { useSandboxStateSelector } from "../../state/sandboxStore";
import {
  editorShellTestUtils,
  useEditorShellSelector,
} from "../../state/editorStore";

const Player = () => {
  const contentState = useSandboxState();
  const mode = useSandboxStateSelector((state) => state.mode) || contentState.mode;
  const activeTab = useEditorShellSelector((state) => state.activeTab);
  const showTimeline = activeTab === editorShellTestUtils.EDIT_TAB;

  return (
    <div className={styles.layout}>
      {mode === "crop" && <CropNav />}
      {mode === "player" && <PlayerNav />}
      {mode === "audio" && <AudioNav />}
      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <Content />
          {showTimeline && <TrimUI />}
        </div>
        <RightPanel />
      </div>
    </div>
  );
};

export default Player;
