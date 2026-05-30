import variablesCss from "../styles/variables.css";

const STANDARD_W = 680;
const STANDARD_H = 540;
const COMPACT_W = 370;
const COMPACT_H = 640;
const FLOATING_SIZE = 52;

const PANEL_CSS = `
:host{all:initial;display:block;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;pointer-events:none;font-family:"PingFang SC","Inter",-apple-system,"Microsoft YaHei",sans-serif}
:host *{margin:0;padding:0;box-sizing:border-box;font:inherit;color:inherit;text-decoration:none;list-style:none;background:none;border:none}

/* ── Floating Panel ── */
._panel{
  position:fixed;
  border-radius:22px;
  background:
    linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.03)),
    rgba(242,242,247,.16);
  -webkit-backdrop-filter:blur(26px) saturate(180%) contrast(1.08);
  backdrop-filter:blur(26px) saturate(180%) contrast(1.08);
  border:1px solid var(--glass-border);
  box-shadow:
    var(--glass-inner-shadow),
    inset 0 -1px 0 rgba(255,255,255,.10),
    var(--glass-shadow);
  color:var(--text-primary);
  pointer-events:auto;
  overflow:hidden;
  opacity:0;
  transform:scale(.92) translateY(8px);
  transition:
    opacity .25s cubic-bezier(.16,1,.3,1),
    transform .25s cubic-bezier(.16,1,.3,1),
    width .3s cubic-bezier(.16,1,.3,1),
    height .3s cubic-bezier(.16,1,.3,1);
  will-change:opacity,transform,width,height;
  display:flex;
  flex-direction:column;
}
._panel._visible{opacity:1;transform:scale(1) translateY(0)}

/* Panel size modes */
._panel[data-size="standard"]{width:${STANDARD_W}px;height:${STANDARD_H}px}
._panel[data-size="compact"]{width:${COMPACT_W}px;height:${COMPACT_H}px}

/* Compact mode titlebar adjustments */
._panel[data-size="compact"] ._tab-nav{gap:10px;padding:3px 8px}
._panel[data-size="compact"] ._tab-btn{width:30px;height:30px;border-radius:7px}
._panel[data-size="compact"] ._tab-btn:hover{border-radius:50%}
._panel[data-size="compact"] ._tab-btn--active{border-radius:50%}
._panel[data-size="compact"] ._tab-btn img{width:15px;height:15px}
._panel[data-size="compact"] ._titlebar-center{display:none}
._panel[data-size="compact"] ._titlebar-right{gap:2px}

/* Inner refraction highlight */
._panel::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:
    radial-gradient(circle at 80% 0%, rgba(255,255,255,.45), transparent 34%),
    linear-gradient(-90deg, rgba(255,255,255,.15), transparent 42%, rgba(255,255,255,.10));
  pointer-events:none;
  z-index:0;
}
._panel::after{
  content:"";
  position:absolute;
  inset:1px;
  border-radius:inherit;
  border:1px solid var(--glass-edge-light);
  pointer-events:none;
  z-index:0;
}

/* ── Title Bar (draggable) ── */
._titlebar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 14px;
  cursor:grab;
  user-select:none;
  -webkit-user-select:none;
  flex-shrink:0;
  position:relative;
  z-index:1;
  border-bottom:1px solid var(--border-light);
}
._titlebar:active{cursor:grabbing}
._titlebar-center{
  position:absolute;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  align-items:center;
  gap:8px;
  pointer-events:none;
}
._titlebar-center h3{
  font-size:13px;
  font-weight:400;
  color:var(--text-primary);
  letter-spacing:-.01em;
  display:flex;
  align-items:center;
  gap:8px;
  white-space:nowrap;
}
._titlebar-center h3 img{width:22px;height:22px;opacity:.85}
._titlebar-left{display:flex;align-items:center;gap:4px;z-index:1;margin-top:2px}
._titlebar-right{display:flex;align-items:center;gap:4px;z-index:1}

/* ── Tab Nav (in titlebar) ── */
._tab-nav{
  display:inline-flex;
  align-items:center;
  gap:20px;
  padding:3px 10px;
  background:rgba(242,242,247,.55);
  -webkit-backdrop-filter:blur(12px) saturate(160%);
  backdrop-filter:blur(12px) saturate(160%);
  border-radius:18px;
}
._tab-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  width:34px;
  height:34px;
  padding:0;
  border:none;
  border-radius:8px;
  background:transparent;
  cursor:pointer;
  outline:none;
  -webkit-tap-highlight-color:transparent;
  transition:background .25s ease,box-shadow .25s ease;
}
._tab-btn:focus{outline:none;box-shadow:none}
._tab-btn:focus:not(:focus-visible){outline:none;box-shadow:none}
._tab-btn img{
  width:17px;
  height:17px;
  object-fit:contain;
  filter:invert(60%) sepia(8%) saturate(200%) hue-rotate(180deg) brightness(85%) contrast(85%);
  transition:filter .25s ease;
  flex-shrink:0;
}
._tab-btn:hover{
  background:var(--glass-bg-active);
  border-radius:50%;
}
._tab-btn:hover img{
  filter:invert(30%) sepia(8%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(90%);
}
._tab-btn--active{
  background:var(--glass-bg-active);
  -webkit-backdrop-filter:var(--glass-blur-sm);
  backdrop-filter:var(--glass-blur-sm);
  box-shadow:0 1px 4px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8);
  border:0.5px solid var(--glass-border-hover);
  border-radius:50%;
}
._tab-btn--active img{
  filter:invert(0%) brightness(0%) contrast(100%);
}
._tab-btn--active:hover{
  background:var(--glass-bg-active);
}

/* ── Action Buttons (in titlebar) ── */
._btn-icon{
  width:34px;height:34px;
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
  outline:none;
  transition:all .15s ease;
  color:var(--text-secondary);
  font-size:14px;
}
._btn-icon:hover{background:var(--bg-hover);color:var(--text-primary)}

/* ── Content Area ── */
._content{
  flex:1;
  overflow:hidden;
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  min-height:0;
  background:transparent;
}
#sophia-root::-webkit-scrollbar{width:4px}
#sophia-root::-webkit-scrollbar-track{background:transparent}
#sophia-root::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:4px}

/* ── Preact Mount Point ── */
#sophia-root{
  width:100%;
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow-y:auto;
  overflow-x:hidden;
  background:transparent;
}

/* ── Loading State ── */
._loading-wrap{
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  height:100%;
}
._loading{text-align:center;color:var(--text-secondary);font-size:13px}
._spinner{
  width:22px;height:22px;
  border:2px solid rgba(0,0,0,.06);
  border-top-color:rgba(0,0,0,.25);
  border-radius:50%;
  animation:_spin .7s linear infinite;
  margin:0 auto 10px
}
@keyframes _spin{to{transform:rotate(360deg)}}
._error{color:var(--danger)}

/* ── Floating Button ── */
._floating-btn{
  position:fixed;
  width:${FLOATING_SIZE}px;
  height:${FLOATING_SIZE}px;
  border-radius:50%;
  user-select:none;
  -webkit-user-select:none;
  background:
    linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.06)),
    rgba(242,242,247,.12);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
  backdrop-filter:blur(22px) saturate(160%);
  border:1px solid var(--glass-border-subtle);
  box-shadow:
    var(--glass-inner-shadow),
    0 4px 24px rgba(0,0,0,.08),
    0 2px 8px rgba(0,0,0,.05);
  cursor:grab;
  pointer-events:auto;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:box-shadow .25s cubic-bezier(.16,1,.3,1);
  will-change:transform,left,top,box-shadow;
  opacity:0;
  z-index:1;
}
._floating-btn._visible{opacity:1}
._floating-btn::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:50%;
  background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.32), transparent 55%);
  pointer-events:none;
}
._floating-btn:hover{
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.42),
    0 8px 32px rgba(0,0,0,.12),
    0 4px 12px rgba(0,0,0,.06);
}
._floating-btn:active{cursor:grabbing;transform:scale(.95)}
._floating-btn img{
  width:26px;
  height:26px;
  opacity:.8;
  transition:opacity .2s;
  pointer-events:none;
}
._floating-btn:hover img{opacity:1}

/* ── iOS-style panel reveal ── */
._panel._ios-open{
  animation:_iosReveal .55s var(--ease-spring) forwards;
}
@keyframes _iosReveal{
  from{transform:scale(.1);opacity:.3}
  to{transform:scale(1);opacity:1}
}

/* ── Dark mode ── */
@media(prefers-color-scheme:dark){
  ._panel{
    background:
      linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02)),
      rgba(28,28,30,.16);
    border-color:var(--glass-border);
    box-shadow:
      var(--glass-inner-shadow-dark),
      var(--glass-shadow);
    color:var(--text-on-dark);
  }
  ._panel::before{opacity:0}
  ._panel::after{display:none}
  ._titlebar-center h3{color:var(--text-on-dark)}
  ._tab-nav{background:rgba(255,255,255,.06)}
  ._tab-btn img{filter:invert(80%) sepia(5%) saturate(150%) hue-rotate(180deg) brightness(110%) contrast(85%)}
  ._tab-btn:hover{background:rgba(255,255,255,.08)}
  ._tab-btn:hover img{filter:invert(90%) sepia(5%) saturate(150%) hue-rotate(180deg) brightness(115%) contrast(90%)}
  ._tab-btn--active{background:rgba(255,255,255,.14);border-color:var(--glass-border-subtle);box-shadow:0 1px 4px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.08);border-radius:50%}
  ._tab-btn--active img{filter:invert(100%) brightness(100%) contrast(100%)}
  ._btn-icon{color:var(--text-on-dark-secondary)}
  ._btn-icon:hover{background:var(--accent-soft);color:var(--text-on-dark)}
  #sophia-root::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15)}
  ._loading{color:var(--text-on-dark-muted)}
  ._spinner{border-color:rgba(255,255,255,.10);border-top-color:rgba(255,255,255,.40)}
  ._floating-btn{
    background:
      linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04)),
      rgba(28,28,30,.22);
    border-color:var(--glass-border-subtle);
    box-shadow:
      var(--glass-inner-shadow-dark),
      0 4px 24px rgba(0,0,0,.28);
  }
  ._floating-btn::before{
    background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.15), transparent 55%);
  }
  ._floating-btn:hover{
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.26),
      0 8px 32px rgba(0,0,0,.38),
      0 4px 12px rgba(0,0,0,.16);
  }
  ._floating-btn img{opacity:.65;filter:brightness(0.9)}
  ._floating-btn:hover img{opacity:1;filter:brightness(1)}
}

/* ── Reduced motion ── */
@media(prefers-reduced-motion:reduce){
  ._panel{transition:none;opacity:1;transform:none}
  ._floating-btn{transition:none;opacity:1}
}

/* ── Print ── */
@media print{._panel,._floating-btn{display:none!important}}
`;

export function getPanelStyles(): string {
  // Replace :root with :host so ALL shadow tree elements (including
  // loader-created siblings of #sophia-root like ._btn-icon, ._tab-nav)
  // can inherit the CSS custom properties.
  const varsForShadowRoot = variablesCss
    .replace(/:root\s*\{/g, ":host {")
    .replace(/\[data-theme="dark"\]\s*\{/g, ':host([data-theme="dark"]) {');
  return varsForShadowRoot + "\n" + PANEL_CSS;
}

export { STANDARD_W, STANDARD_H, COMPACT_W, COMPACT_H, FLOATING_SIZE };
