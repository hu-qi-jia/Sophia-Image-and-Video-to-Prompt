/**
 * Sophia Preact App — Lazy-loaded entry point
 *
 * Dynamically imported by loader.ts when the user first opens the drawer.
 * Mounts the App component into the Shadow DOM using Preact with LiquidGlass effect.
 */

import { render, h, Fragment } from "preact";
import LiquidGlass from "liquid-glass-react";
import { App } from "../sidepanel/App";
import sharedCss from "../styles/shared.css";
import sidepanelCss from "../sidepanel/sidepanel.css";

// Get references from loader.ts
const g = window as unknown as Record<string, unknown>;
const shadowRoot = g.__sophia_shadow__ as ShadowRoot | null;
const mountPoint = g.__sophia_mount__ as HTMLElement | null;

if (shadowRoot && mountPoint) {
  // Fix CSS variables for Shadow DOM: replace :root with :host
  const fixedCss = (sharedCss + "\n" + sidepanelCss).replace(/:root\s*\{/g, ":host {");

  // Inject fixed CSS into Shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = fixedCss;
  shadowRoot.appendChild(styleEl);

  // Create a wrapper component with LiquidGlass effect
  function DrawerApp() {
    return h(LiquidGlass, {
      cornerRadius: 20,
      displacementScale: 60,
      blurAmount: 0.5,
      saturation: 140,
      aberrationIntensity: 0.6,
      elasticity: 0.15,
      mode: "standard" as const,
      style: {
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column" as const,
      },
    }, h(App, null));
  }

  // Mount the Preact app with LiquidGlass wrapper
  render(h(DrawerApp, null), mountPoint);
}
