import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/app.scss";
import Content from "./Content";
import AppProviders from "../../core/providers/AppProviders";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppProviders>
    <Content />
  </AppProviders>,
);
