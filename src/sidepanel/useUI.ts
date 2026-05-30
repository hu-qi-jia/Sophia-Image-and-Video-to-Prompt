import { useCallback, useRef, useState } from "react";
import type { PanelSizeMode } from "../lib/types";
import { getPanelSizeMode, setPanelSizeMode as persistPanelSizeMode } from "../lib/storage";
import { TOAST_DURATION_MS } from "../lib/constants";

export function useUI() {
  const [subView, setSubView] = useState<"main" | "history" | "settings">("main");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [panelSizeMode, setPanelSizeModeState] = useState<PanelSizeMode>("standard");
  const toastTimerRef = useRef<number | null>(null);
  const panelSizeModeInitRef = useRef(false);

  function showToast(message: string) {
    setStatusMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
  }

  const initPanelSizeMode = useCallback(async () => {
    if (panelSizeModeInitRef.current) return;
    panelSizeModeInitRef.current = true;
    const stored = await getPanelSizeMode();
    setPanelSizeModeState(stored);
  }, []);

  const setPanelSizeMode = useCallback(async (mode: PanelSizeMode) => {
    setPanelSizeModeState(mode);
    await persistPanelSizeMode(mode);
  }, []);

  return {
    subView,
    setSubView,
    statusMessage,
    showToast,
    toastTimerRef,
    panelSizeMode,
    setPanelSizeMode,
    initPanelSizeMode,
  };
}
