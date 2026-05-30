const GLOBAL_KEY_SHADOW = "__sophia_shadow__";
const GLOBAL_KEY_MOUNT = "__sophia_mount__";

type GlobalWindow = Record<string, unknown>;

function getGlobal(): GlobalWindow {
  return window as unknown as GlobalWindow;
}

export function setShadowRoot(shadow: ShadowRoot): void {
  getGlobal()[GLOBAL_KEY_SHADOW] = shadow;
}

export function setMountPoint(el: HTMLElement): void {
  getGlobal()[GLOBAL_KEY_MOUNT] = el;
}

export function getShadowRoot(): ShadowRoot | null {
  return getGlobal()[GLOBAL_KEY_SHADOW] as ShadowRoot | null;
}

export function getMountPoint(): HTMLElement | null {
  return getGlobal()[GLOBAL_KEY_MOUNT] as HTMLElement | null;
}

export function getPanel(): HTMLElement | null {
  const shadow = getShadowRoot();
  if (!shadow) return null;
  return shadow.querySelector("._panel") as HTMLElement | null;
}
