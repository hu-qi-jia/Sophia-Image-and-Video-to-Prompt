/**
 * Sophia Preact App — Lazy-loaded entry point
 *
 * Dynamically imported by loader.ts when the user first opens the drawer.
 * Mounts the App component into the Shadow DOM.
 */

import { render, h } from "preact";
import { App } from "../sidepanel/App";
import sharedCss from "../styles/shared.css";
import sidepanelCss from "../sidepanel/sidepanel.css";
import { getShadowRoot, getMountPoint } from "../lib/shadow-dom";

const shadowRoot = getShadowRoot();
const mountPoint = getMountPoint();

if (shadowRoot && mountPoint) {
  const fixedCss = (sharedCss + "\n" + sidepanelCss).replace(/:root\s*\{/g, ":host {");

  const styleEl = document.createElement("style");
  styleEl.textContent = fixedCss;
  shadowRoot.appendChild(styleEl);

  try {
    render(h(App, null), mountPoint);
  } catch (err) {
    console.error("[Sophia] Failed to render app:", err);
    mountPoint.innerHTML = '<div style="padding:24px;color:#FF3B30;font-size:14px;text-align:center;">应用加载失败，请刷新页面重试</div>';
    mountPoint.style.display = "block";
  }
}
