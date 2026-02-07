import React, { useContext, useEffect } from "react";
import * as S from "@radix-ui/react-switch";

// Styles
import styles from "../../styles/edit/_Switch.module.scss";

// Context
import { useSandboxState, useSandboxSetter } from "../../context/ContentState"; // Import the ContentState context

const Switch = () => {
  const contentState = useSandboxState();
  const setContentState = useSandboxSetter();

  return (
    <form>
      <div className={styles.SwitchRow}>
        <label
          className={styles.Label}
          htmlFor="replaceAudio"
          style={{ paddingRight: 15 }}
        >
          {chrome.i18n.getMessage("replaceAudioEditor")}
        </label>
        <S.Root
          className={styles.SwitchRoot}
          checked={contentState.replaceAudio}
          onCheckedChange={(checked) => {
            setContentState((prevContentState) => ({
              ...prevContentState,
              replaceAudio: checked,
            }));
          }}
        >
          <S.Thumb className={styles.SwitchThumb} />
        </S.Root>
      </div>
    </form>
  );
};

export default Switch;
