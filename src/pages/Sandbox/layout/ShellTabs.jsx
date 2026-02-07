import React from "react";
import styles from "../styles/global/_ShellTabs.module.scss";
import { editorShellTestUtils } from "../state/editorStore";

const tabs = [
  {
    id: editorShellTestUtils.EDIT_TAB,
    labelKey: "editLabel",
    fallbackLabel: "Edit",
  },
  {
    id: editorShellTestUtils.PREVIEW_TAB,
    labelKey: "previewLabel",
    fallbackLabel: "Preview",
  },
];

const getLabel = (labelKey, fallbackLabel) => {
  const text = chrome?.i18n?.getMessage?.(labelKey);
  return text || fallbackLabel;
};

const ShellTabs = ({ activeTab, onTabChange }) => (
  <div className={styles.wrap}>
    <div className={styles.tabs} role="tablist" aria-label="Editor view">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabButton} ${isActive ? styles.active : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {getLabel(tab.labelKey, tab.fallbackLabel)}
          </button>
        );
      })}
    </div>
  </div>
);

export default ShellTabs;
