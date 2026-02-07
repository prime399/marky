import React, { useContext, useState } from "react";

// Components
import PlayerNav from "./PlayerNav";
import CropNav from "../editor/CropNav";
import AudioNav from "../editor/AudioNav";
import RightPanel from "./RightPanel";
import Content from "./Content";

import styles from "../../styles/player/_Player.module.scss";

// Context
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context
import { useSandboxStateSelector } from "../../state/sandboxStore";

const Player = () => {
  const contentState = useSandboxState();
  const mode = useSandboxStateSelector((state) => state.mode) || contentState.mode;

  return (
    <div className={styles.layout}>
      {mode === "crop" && <CropNav />}
      {mode === "player" && <PlayerNav />}
      {mode === "audio" && <AudioNav />}
      <div className={styles.content}>
        <Content />
        <RightPanel />
      </div>
    </div>
  );
};

export default Player;
