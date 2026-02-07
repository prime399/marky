import React from "react";
import styles from "../../styles/player/_Content.module.scss";

// Components
import VideoPlayer from "../../components/player/VideoPlayer";
import CropperWrap from "../../components/editor/CropperWrap";
import HelpButton from "../../components/player/HelpButton";
import ProBanner from "../../components/global/ProBanner";

// Context
import { useSandboxStateSelector } from "../../state/sandboxStore";

const Content = () => {
  const mode = useSandboxStateSelector((state) => state.mode);
  const bannerSupport = useSandboxStateSelector((state) => state.bannerSupport);
  return (
    <div className={styles.content}>
      <div className={styles.wrap}>
        {mode === "audio" && <VideoPlayer />}
        {mode === "player" && <VideoPlayer />}
        {mode === "crop" && <CropperWrap />}
      </div>
      <HelpButton />
      {bannerSupport && <ProBanner />}
    </div>
  );
};

export default Content;
