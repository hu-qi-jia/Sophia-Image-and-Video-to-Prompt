/**
 * Sophia Preact App — Lazy-loaded entry point
 *
 * Dynamically imported by loader.ts when the user first opens the drawer.
 * Mounts the App component into the Shadow DOM using Preact.
 */

import { render, h } from "preact";
import { App } from "../sidepanel/App";
import sharedCss from "../styles/shared.css";
import sidepanelCss from "../sidepanel/sidepanel.css";

// Get references from loader.ts
const g = window as unknown as Record<string, unknown>;
const shadowRoot = g.__sophia_shadow__ as ShadowRoot | null;
const mountPoint = g.__sophia_mount__ as HTMLElement | null;

if (shadowRoot && mountPoint) {
  // Inject full CSS into Shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = sharedCss + "\n" + sidepanelCss;
  shadowRoot.appendChild(styleEl);

  // Mount the Preact app
  render(h(App, null), mountPoint);
}
