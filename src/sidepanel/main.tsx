/**
 * Sidepanel entry — DEV ONLY
 *
 * This file is built by Vite into sidepanel.html for local development (`npm run dev`).
 * In production, the App component is mounted by src/content/app.tsx into a Shadow DOM
 * via Preact's render(). This file is NOT part of the production extension build.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "../styles/shared.css";
import "./sidepanel.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

