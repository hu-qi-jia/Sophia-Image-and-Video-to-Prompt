/**
 * Sophia Content Script Loader
 *
 * Injects a floating panel with Liquid Glass styling.
 * Supports standard (680x540), compact (370x640), and collapsed (floating circle) modes.
 * The collapsed state is a draggable circular button; clicking it opens the
 * panel with an iOS-style spring-reveal animation.
 * On first click, lazy-loads the full Preact app (sophia-app.js).
 */

import { getPanelStyles, STANDARD_W, STANDARD_H, COMPACT_W, COMPACT_H, FLOATING_SIZE } from "./panel-styles";
import { setShadowRoot, setMountPoint } from "../lib/shadow-dom";

const HOST_ID = "sophia-float-host";
const APP_URL = chrome.runtime.getURL("assets/sophia-app.js");
const ICON_URL = chrome.runtime.getURL("icons/newlogo.png");
const IMG_ICON_URL = chrome.runtime.getURL("icons/image.svg");
const VID_ICON_URL = chrome.runtime.getURL("icons/video.svg");
const TXT_ICON_URL = chrome.runtime.getURL("icons/text.svg");

type PanelSizeMode = "standard" | "compact" | "collapsed";

// ── State ─────────────────────────────────────────────────────────

let isOpen = false;
let appLoaded = false;
let appLoading = false;
let shadow: ShadowRoot | null = null;
let panelEl: HTMLDivElement | null = null;
let floatingBtn: HTMLDivElement | null = null;
let sizeMode: PanelSizeMode = "standard";

// Initialization state machine

let isInitialized = false;

// Panel drag state
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Floating button drag state
let isFloatingDragging = false;
let floatingDragMoved = false;
let floatingDragOffsetX = 0;
let floatingDragOffsetY = 0;

// Panel position (persisted per session)
let panelX = -1;
let panelY = -1;

// Floating button position (persisted per session)
let floatingX = -1;
let floatingY = -1;

// iOS reveal flag (set when opening from floating button)
let iosReveal = false;

// ── Position helpers ──────────────────────────────────────────────

function getPanelWidth(): number {
  if (sizeMode === "compact") return COMPACT_W;
  return STANDARD_W;
}

function getPanelHeight(): number {
  return STANDARD_H;
}

function getDefaultPosition(): { x: number; y: number } {
  const w = getPanelWidth();
  const h = getPanelHeight();
  return {
    x: Math.max(16, window.innerWidth - w - 24),
    y: Math.max(16, Math.round((window.innerHeight - h) / 2)),
  };
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(0, x), window.innerWidth - 40),
    y: Math.min(Math.max(0, y), window.innerHeight - 40),
  };
}

// ── Drag ──────────────────────────────────────────────────────────

function onDragStart(e: MouseEvent): void {
  if (!panelEl) return;
  isDragging = true;
  const rect = panelEl.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  document.addEventListener("mousemove", onDragMove, { passive: true });
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent): void {
  if (!isDragging || !panelEl) return;
  const pos = clampPosition(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
  panelEl.style.left = pos.x + "px";
  panelEl.style.top = pos.y + "px";
  panelX = pos.x;
  panelY = pos.y;
}

function onDragEnd(): void {
  isDragging = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
}

// ── Floating button drag ───────────────────────────────────────────

function getFloatingDefaultPosition(): { x: number; y: number } {
  return {
    x: Math.max(16, window.innerWidth - FLOATING_SIZE - 16),
    y: Math.max(16, Math.round((window.innerHeight - FLOATING_SIZE) / 2)),
  };
}

function onFloatingDragStart(e: MouseEvent): void {
  if (!floatingBtn) return;
  isFloatingDragging = true;
  floatingDragMoved = false;
  const rect = floatingBtn.getBoundingClientRect();
  floatingDragOffsetX = e.clientX - rect.left;
  floatingDragOffsetY = e.clientY - rect.top;
  document.addEventListener("mousemove", onFloatingDragMove, { passive: true });
  document.addEventListener("mouseup", onFloatingDragEnd);
}

function onFloatingDragMove(e: MouseEvent): void {
  if (!isFloatingDragging || !floatingBtn) return;
  const dx = Math.abs(e.clientX - floatingDragOffsetX - floatingX);
  const dy = Math.abs(e.clientY - floatingDragOffsetY - floatingY);
  if (dx > 2 || dy > 2) floatingDragMoved = true;
  const pos = clampPosition(e.clientX - floatingDragOffsetX, e.clientY - floatingDragOffsetY);
  floatingBtn.style.left = pos.x + "px";
  floatingBtn.style.top = pos.y + "px";
  floatingX = pos.x;
  floatingY = pos.y;
}

function onFloatingDragEnd(): void {
  isFloatingDragging = false;
  document.removeEventListener("mousemove", onFloatingDragMove);
  document.removeEventListener("mouseup", onFloatingDragEnd);
}

// ── Size mode ─────────────────────────────────────────────────────

/**
 * Notify Preact app to sync its internal panelSizeMode state.
 * This is critical when the shell (loader.ts) changes the mode independently,
 * such as when clicking the collapsed handle to expand.
 */
function notifySizeModeToApp(mode: PanelSizeMode): void {
  if (!shadow) return;
  const root = shadow.getElementById("sophia-root");
  if (root) {
    root.dispatchEvent(new CustomEvent("sophia-set-size-mode", { 
      detail: mode, 
      bubbles: true 
    }));
  }
}

function applySizeMode(mode: PanelSizeMode): void {
  sizeMode = mode;

  // Notify Preact app of mode change
  notifySizeModeToApp(mode);

  if (mode === "collapsed") {
    isOpen = false;
    if (!shadow) return;
    ensureElements();
    render();
    return;
  }

  if (!panelEl) return;

  panelEl.setAttribute("data-size", mode);

  if (isOpen) {
    const w = getPanelWidth();
    if (panelX + w > window.innerWidth - 16) {
      panelX = Math.max(16, window.innerWidth - w - 24);
    }
    panelEl.style.left = panelX + "px";
  }
}

// ── Render ────────────────────────────────────────────────────────

function ensureElements(): void {
  if (!shadow) return;

  if (!floatingBtn) {
    floatingBtn = document.createElement("div");
    floatingBtn.className = "_floating-btn";
    floatingBtn.title = "展开 Sophia";
    floatingBtn.innerHTML = '<img src="' + ICON_URL + '" alt="Sophia" draggable="false">';
    floatingBtn.addEventListener("mousedown", onFloatingDragStart);
    floatingBtn.addEventListener("click", () => {
      // Ignore click if the user was dragging
      if (floatingDragMoved) { floatingDragMoved = false; return; }
      const rect = floatingBtn!.getBoundingClientRect();
      const btnCX = rect.left + rect.width / 2;
      const btnCY = rect.top + rect.height / 2;
      const pw = getPanelWidth();
      const ph = getPanelHeight();
      // Position panel so its center aligns with the button center
      panelX = Math.min(Math.max(0, btnCX - pw / 2), window.innerWidth - pw);
      panelY = Math.min(Math.max(0, btnCY - ph / 2), window.innerHeight - ph);
      // Set transform-origin to the button center (relative to panel)
      if (panelEl) {
        panelEl.style.transformOrigin = `${btnCX - panelX}px ${btnCY - panelY}px`;
      }
      iosReveal = true;
      isOpen = true;
      sizeMode = "standard";
      notifySizeModeToApp("standard");
      render();
    });
    shadow.appendChild(floatingBtn);
  }

  if (!panelEl) {
    panelEl = document.createElement("div");
    panelEl.className = "_panel";
    panelEl.setAttribute("data-size", sizeMode);
    panelEl.innerHTML =
      '<div class="_titlebar">' +
        '<div class="_titlebar-left">' +
          '<div class="_tab-nav" role="tablist">' +
            '<div class="_tab-btn _tab-btn--active" data-tab="image" role="tab" title="图片识图"><img src="' + IMG_ICON_URL + '" alt="图片识图"></div>' +
            '<div class="_tab-btn" data-tab="video" role="tab" title="视频识图"><img src="' + VID_ICON_URL + '" alt="视频识图"></div>' +
            '<div class="_tab-btn" data-tab="enhancer" role="tab" title="提示词增强"><img src="' + TXT_ICON_URL + '" alt="提示词增强"></div>' +
          '</div>' +
        '</div>' +
        '<div class="_titlebar-center">' +
          '<h3><img src="' + ICON_URL + '" alt="">Sophia</h3>' +
        '</div>' +
        '<div class="_titlebar-right">' +
          '<div class="_btn-icon" data-action="toggle-size" title="切换模式"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div>' +
          '<div class="_btn-icon" data-action="history" title="历史记录"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v4h4"/><path d="M12 7v5l3 2"/></svg></div>' +
          '<div class="_btn-icon" data-action="settings" title="设置"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></svg></div>' +
          '<div class="_btn-icon" data-action="collapse" title="收纳到侧边栏"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>' +
        '</div>' +
      '</div>' +
      '<div class="_content">' +
        '<div class="_loading-wrap"><div class="_loading"><div class="_spinner"></div><div>正在加载...</div></div></div>' +
      '</div>';

    // Bind event listeners
    const titlebar = panelEl.querySelector("._titlebar") as HTMLElement;
    titlebar.addEventListener("mousedown", onDragStart);

    panelEl.querySelectorAll("._tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tab = (btn as HTMLElement).dataset.tab;
        if (!tab) return;
        panelEl!.querySelectorAll("._tab-btn").forEach(b => b.classList.remove("_tab-btn--active"));
        btn.classList.add("_tab-btn--active");
        const root = shadow!.getElementById("sophia-root");
        if (root) root.dispatchEvent(new CustomEvent("sophia-tab-change", { detail: tab, bubbles: true }));
      });
    });

    panelEl.querySelector('[data-action="collapse"]')?.addEventListener("click", () => {
      applySizeMode("collapsed");
    });

    panelEl.querySelector('[data-action="toggle-size"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const root = shadow!.getElementById("sophia-root");
      if (root) root.dispatchEvent(new CustomEvent("sophia-action", { detail: "toggle-size", bubbles: true }));
    });

    panelEl.querySelector('[data-action="history"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const root = shadow!.getElementById("sophia-root");
      if (root) root.dispatchEvent(new CustomEvent("sophia-action", { detail: "history", bubbles: true }));
    });

    panelEl.querySelector('[data-action="settings"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const root = shadow!.getElementById("sophia-root");
      if (root) root.dispatchEvent(new CustomEvent("sophia-action", { detail: "settings", bubbles: true }));
    });

    shadow.appendChild(panelEl);
  }
}

function render(): void {
  if (!shadow) return;
  ensureElements();
  if (!panelEl || !floatingBtn) return;

  // Synchronous state application - no race conditions
  if (isOpen) {
    // ── Panel OPEN: show panel, hide floating button ──

    // Hide floating button immediately (synchronously)
    floatingBtn.classList.remove("_visible");
    floatingBtn.style.display = "none";

    // Calculate position if needed
    if (panelX < 0) {
      const pos = getDefaultPosition();
      panelX = pos.x;
      panelY = pos.y;
    }

    // Apply position and size
    panelEl.style.left = panelX + "px";
    panelEl.style.top = panelY + "px";
    panelEl.setAttribute("data-size", sizeMode);

    // Show panel — iOS reveal or standard entrance
    panelEl.style.display = "flex";
    if (iosReveal) {
      iosReveal = false;
      requestAnimationFrame(() => {
        panelEl!.classList.add("_ios-open");
        // After animation completes, swap to _visible state cleanly
        setTimeout(() => {
          panelEl!.classList.remove("_ios-open");
          panelEl!.classList.add("_visible");
        }, 300);
      });
    } else {
      requestAnimationFrame(() => { panelEl!.classList.add("_visible"); });
    }

    // Load app if needed
    if (appLoaded) {
      const loading = panelEl.querySelector("._loading-wrap");
      if (loading) loading.remove();
      const root = shadow.getElementById("sophia-root");
      if (root) {
        root.style.display = "block";
        if (root.parentElement !== panelEl) {
          const content = panelEl.querySelector("._content");
          if (content) content.appendChild(root);
        }
      }
    } else if (!appLoading) {
      appLoading = true;
      loadApp();
    }
  } else {
    // ── Panel CLOSED: hide panel, show floating button ──

    // Hide panel
    panelEl.classList.remove("_visible");
    panelEl.classList.remove("_ios-open");
    panelEl.style.display = "none";

    const root = shadow.getElementById("sophia-root");
    if (root) root.style.display = "none";

    // Set default floating position if needed
    if (floatingX < 0) {
      const pos = getFloatingDefaultPosition();
      floatingX = pos.x;
      floatingY = pos.y;
    }

    // Show floating button IMMEDIATELY and synchronously
    floatingBtn.style.left = floatingX + "px";
    floatingBtn.style.top = floatingY + "px";
    floatingBtn.style.display = "flex";
    floatingBtn.classList.add("_visible");
    floatingBtn.style.opacity = "1";
  }
}

// ── Lazy-load Preact app ──────────────────────────────────────────

async function loadApp(): Promise<void> {
  try {
    setShadowRoot(shadow!);
    setMountPoint(shadow!.getElementById("sophia-root")!);
    await import(/* webpackIgnore: true */ APP_URL);
    appLoaded = true;
    if (isOpen) render();
  } catch (err) {
    console.error("[Sophia] Failed to load app:", err);
    const content = shadow!.querySelector("._content");
    if (content) content.innerHTML = '<div class="_loading-wrap"><div class="_loading _error">加载失败，请刷新页面重试</div></div>';
  }
}

// ── Main injection ────────────────────────────────────────────────

/**
 * Unified initialization function.
 * Does NOT query background for drawer state.
 * Always starts collapsed so the panel never auto-opens on new tabs.
 */
async function initializeState(): Promise<{ sizeMode: PanelSizeMode; isOpen: boolean }> {
  // Get stored size mode from storage
  const storageResult = await chrome.storage.local.get("video2prompt:panelSizeMode");
  const storedMode = storageResult["video2prompt:panelSizeMode"] as PanelSizeMode | undefined;
  const resolvedSizeMode: PanelSizeMode =
    storedMode === "standard" || storedMode === "compact" || storedMode === "collapsed"
      ? storedMode
      : "collapsed";

  // Always start collapsed on new tabs — the user clicks the handle
  // or the extension icon to open the panel explicitly.
  return { sizeMode: resolvedSizeMode, isOpen: false };
}

function inject(): void {
  if (document.getElementById(HOST_ID)) return;
  if (!document.body) return;
  if (location.protocol === "chrome:" || location.protocol === "chrome-extension:" || location.protocol === "about:") return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);

  shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = getPanelStyles();
  shadow.appendChild(style);

  const mount = document.createElement("div");
  mount.id = "sophia-root";
  mount.style.display = "none";
  shadow.appendChild(mount);

  // Mark as initialized to prevent duplicate initialization
  isInitialized = false;

  // Safety timeout: if initialization hangs, force fallback render
  const initTimeout = setTimeout(() => {
    if (!isInitialized) {
      console.warn("[Sophia] Initialization timed out — forcing fallback render");
      ensureElements();
      isInitialized = true;
      render();
    }
  }, 3000);

  // Unified initialization - wait for all async operations
  initializeState().then(({ sizeMode: initSizeMode, isOpen: initOpen }) => {
    clearTimeout(initTimeout);
    // Apply the resolved state atomically
    sizeMode = initSizeMode;
    isOpen = initOpen;

    // Create DOM elements
    ensureElements();

    // Mark as initialized
    isInitialized = true;

    // Initial render with final state
    render();
  }).catch((err) => {
    clearTimeout(initTimeout);
    console.error("[Sophia] Initialization failed:", err);
    // Fallback: render with defaults
    ensureElements();
    isInitialized = true;
    render();
  });

  // Message listener for runtime updates
  // Gated behind isInitialized to prevent race conditions during page load
  chrome.runtime.onMessage.addListener((msg: { type: string; open?: boolean; sizeMode?: PanelSizeMode; state?: unknown }) => {
    // Ignore messages until initialization is complete
    if (!isInitialized) return;

    // Handle toggle
    if (msg.type === "VIDEO2PROMPT_TOGGLE_DRAWER") {
      isOpen = !isOpen;
      render();
    }

    // Handle global drawer state change
    if (msg.type === "VIDEO2PROMPT_SET_GLOBAL_DRAWER") {
      isOpen = msg.open ?? false;
      render();
    }

    // Handle size mode change
    if (msg.type === "SOPHIA_SET_SIZE_MODE" && msg.sizeMode) {
      applySizeMode(msg.sizeMode);
      // Only call render() for collapsed mode (panel → floating button transition).
      // For standard/compact mode changes while the panel is already open,
      // the Preact app handles its own re-render. Calling render() here would
      // cause redundant DOM manipulation that can blank the page.
      if (msg.sizeMode === "collapsed") {
        render();
      }
    }

    // Forward analysis state updates to extension pages (sidepanel)
    if (msg.type === "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED" && msg.state) {
      chrome.runtime.sendMessage(msg).catch(() => {});
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inject);
} else {
  inject();
}
