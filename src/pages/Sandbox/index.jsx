import React from "react";
import { createRoot } from "react-dom/client";

import Sandbox from "./Sandbox";
import ContentState from "./context/ContentState";
import AppProviders from "../../core/providers/AppProviders";

// Find the container to render into
const container = window.document.querySelector("#app-container");

if (container) {
  const root = createRoot(container);
  root.render(
    <AppProviders>
      <ContentState>
        <Sandbox />
      </ContentState>
    </AppProviders>
  );
}

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
