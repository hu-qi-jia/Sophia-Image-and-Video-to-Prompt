/**
 * Sophia Content Script Loader (~5KB)
 *
 * Instantly injects a lightweight drawer handle into every page.
 * On first click, lazy-loads the full Preact app (sophia-app.js).
 */

const HOST_ID = "sophia-drawer-host";
const APP_URL = chrome.runtime.getURL("assets/sophia-app.js");
const ICON_URL = chrome.runtime.getURL("icons/icon48.png");

// ── CSS ───────────────────────────────────────────────────────────

const STYLES = `
:host{all:initial;display:block;position:fixed;top:0;right:0;width:420px;max-width:100vw;height:100vh;z-index:2147483646;pointer-events:none;font-family:"PingFang SC","Inter",-apple-system,"Microsoft YaHei",sans-serif}
:host *{all:revert}
._drawer{position:fixed;top:0;right:0;width:420px;max-width:100vw;height:100vh;background:transparent;color:#e0e0e0;pointer-events:auto;overflow-y:auto;overflow-x:hidden;animation:_slide .3s cubic-bezier(.16,1,.3,1)}
@keyframes _slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
._header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
._header h3{margin:0;font-size:14px;color:#fff;font-weight:600}
._close{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.08);border:none;color:#888;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s}
._close:hover{background:rgba(255,255,255,.15);color:#fff}
._body{display:flex;align-items:center;justify-content:center;height:calc(100vh - 52px)}
._loading{text-align:center;color:#666;font-size:13px}
._spinner{width:24px;height:24px;border:2px solid rgba(255,255,255,.1);border-top-color:#6366f1;border-radius:50%;animation:_spin .8s linear infinite;margin:0 auto 12px}
@keyframes _spin{to{transform:rotate(360deg)}}
._error{color:#ef4444}
._handle{position:fixed;top:50%;right:0;transform:translateY(-50%);width:36px;height:72px;border-radius:12px 0 0 12px;background:rgba(255,255,255,.06);border:.5px solid rgba(255,255,255,.1);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);cursor:pointer;pointer-events:auto;display:flex;align-items:center;justify-content:center;transition:background .2s}
._handle:hover{background:rgba(255,255,255,.12)}
._handle img{width:20px;height:20px;opacity:.7;transition:opacity .2s}
._handle:hover img{opacity:1}
@media(prefers-reduced-motion:reduce){._drawer{animation:none}}
@media print{._drawer,._handle{display:none!important}}
`;

// ── State ─────────────────────────────────────────────────────────

let open = false;
let appLoaded = false;
let appLoading = false;
let shadow: ShadowRoot | null = null;

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  if (!shadow) return;
  shadow.querySelectorAll("._drawer, ._handle").forEach((el) => el.remove());

  if (open) {
    const drawer = document.createElement("div");
    drawer.className = "_drawer";

    if (appLoaded) {
      const root = shadow.getElementById("sophia-root");
      if (root) {
        root.style.display = "block";
        drawer.appendChild(root);
      }
      shadow.appendChild(drawer);
    } else {
      drawer.innerHTML =
        '<div class="_header"><h3>Sophia</h3><button class="_close" title="关闭">&times;</button></div>' +
        '<div class="_body"><div class="_loading"><div class="_spinner"></div><div>正在加载应用...</div></div></div>';
      shadow.appendChild(drawer);
      drawer.querySelector("._close")?.addEventListener("click", () => {
        open = false;
        render();
      });
      if (!appLoading) {
        appLoading = true;
        loadApp();
      }
    }
  } else {
    const root = shadow.getElementById("sophia-root");
    if (root) root.style.display = "none";
    const handle = document.createElement("div");
    handle.className = "_handle";
    handle.title = "打开 Sophia";
    handle.innerHTML = '<img src="' + ICON_URL + '" alt="Sophia">';
    shadow.appendChild(handle);
    handle.addEventListener("click", () => {
      open = true;
      render();
    });
  }
}

// ── Lazy-load Preact app ──────────────────────────────────────────

async function loadApp(): Promise<void> {
  try {
    const g = window as unknown as Record<string, unknown>;
    g.__sophia_shadow__ = shadow;
    g.__sophia_mount__ = shadow!.getElementById("sophia-root");
    await import(/* webpackIgnore: true */ APP_URL);
    appLoaded = true;
    if (open) render();
  } catch (err) {
    console.error("[Sophia] Failed to load app:", err);
    const body = shadow!.querySelector("._body");
    if (body) body.innerHTML = '<div class="_loading _error">加载失败，请刷新页面重试</div>';
  }
}

// ── Main injection ────────────────────────────────────────────────

function inject(): void {
  if (document.getElementById(HOST_ID)) return;
  if (!document.body) return;
  if (location.protocol === "chrome:" || location.protocol === "chrome-extension:" || location.protocol === "about:") return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);

  shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = STYLES;
  shadow.appendChild(style);

  const mount = document.createElement("div");
  mount.id = "sophia-root";
  mount.style.display = "none";
  shadow.appendChild(mount);

  render();

  chrome.runtime.onMessage.addListener((msg: { type: string; open?: boolean }) => {
    if (msg.type === "VIDEO2PROMPT_TOGGLE_DRAWER") { open = !open; render(); }
    if (msg.type === "VIDEO2PROMPT_SET_GLOBAL_DRAWER") { open = msg.open ?? false; render(); }
  });

  chrome.runtime.sendMessage(
    { type: "VIDEO2PROMPT_GET_DRAWER_STATE" },
    (response: { drawerOpen?: boolean } | undefined) => {
      if (chrome.runtime.lastError) return;
      if (response?.drawerOpen) { open = true; render(); }
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inject);
} else {
  inject();
}
