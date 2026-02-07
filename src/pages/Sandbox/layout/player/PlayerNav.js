import React from "react";
import styles from "../../styles/player/_Nav.module.scss";
import ShellTabs from "../ShellTabs";
import {
  editorShellActions,
  useEditorShellSelector,
} from "../../state/editorStore";

// Icons
import { ReactSVG } from "react-svg";

const URL = "/assets/";

const StarIcon = URL + "editor/icons/help-nav.svg";
const UnlockIcon = URL + "editor/icons/unlock.svg";

const PlayerNav = () => {
  const activeTab = useEditorShellSelector((state) => state.activeTab);

  return (
    <div className={styles.nav}>
      <div className={styles.navWrap}>
        <div
          onClick={() => {
            chrome.runtime.sendMessage({ type: "open-home" });
          }}
          aria-label="home"
          className={styles.navLeft}
        >
          <img src={URL + "editor/logo.svg"} alt="Screenity Logo" />
        </div>
        <div className={styles.navCenter}>
          <ShellTabs
            activeTab={activeTab}
            onTabChange={editorShellActions.setActiveTab}
            inline
          />
        </div>
        <div className={styles.navRight}>
          <button
            className="button simpleButton blueButton"
            onClick={() => {
              chrome.runtime.sendMessage({ type: "open-help" });
            }}
          >
            <ReactSVG src={StarIcon} />
            {chrome.i18n.getMessage("getHelpNav")}
          </button>
          <button
            className="button primaryButton"
            onClick={() => {
              chrome.runtime.sendMessage({ type: "pricing" });
            }}
          >
            <ReactSVG src={UnlockIcon} />{" "}
            {chrome.i18n.getMessage("unlockMoreFeatures") ||
              "Unlock more features"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerNav;
