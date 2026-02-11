import React from "react";
import { createRoot } from "react-dom/client";
import SourcePicker from "./SourcePicker";

const container = document.getElementById("app-container");
const root = createRoot(container);
root.render(<SourcePicker />);
