import { useEffect } from "react";
import { defaultSettings, getPromptHistory, getSettings } from "../lib/storage";
import type { PromptHistoryItem, RuntimeMessage, StoredSettings } from "../lib/types";
import { useSettings } from "./useSettings";
import { useHistory } from "./useHistory";
import { useUI } from "./useUI";
import { useIVTabs } from "./useIVTabs";
import { useEnhancer } from "./useEnhancer";
import { safeRuntimeSendMessage, isExtensionContextValid, logError } from "../lib/error-utils";

export function useAppState() {
  // ── Compose hooks ──────────────────────────────────────────────
  const ui = useUI();
  const settingsHook = useSettings(ui.showToast);
  const historyHook = useHistory();
  const ivTabsHook = useIVTabs(
    settingsHook.settings,
    settingsHook.activeModel,
    settingsHook.hasApiKey,
    historyHook.persistHistoryRecord,
    ui.setSubView,
  );
  const enhancerHook = useEnhancer(
    settingsHook.activeModel,
    settingsHook.hasApiKey,
    historyHook.persistHistoryRecord,
    ui.setSubView,
  );

  // ── Initialization & Chrome listeners ──────────────────────────
  useEffect(() => {
    void (async () => {
      const [nextSettings, nextHistory, , context] = await Promise.all([
        getSettings(),
        getPromptHistory(),
        ui.initPanelSizeMode(),
        safeRuntimeSendMessage<{ activeTabId: number | null; state: import("../lib/types").AnalysisState | null }>({
          type: "VIDEO2PROMPT_GET_PANEL_CONTEXT",
        }),
      ]);

      settingsHook.setSettings(nextSettings);
      historyHook.setHistoryItems(nextHistory);

      if (context) {
        ivTabsHook.setActiveTabId(context.activeTabId);
        if (context.state) {
          ivTabsHook.syncFromBackgroundState(context.state);
        } else {
          ivTabsHook.resetIVTabResult("image");
          ivTabsHook.resetIVTabResult("video");
        }
      }
    })();

    const handleMessage = (message: RuntimeMessage) => {
      if (!isExtensionContextValid()) return;
      if (message.type === "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED") {
        ivTabsHook.syncFromBackgroundState(message.state);
        if (message.state.tabId) ivTabsHook.setActiveTabId(message.state.tabId);
        return;
      }
      if (message.type === "VIDEO2PROMPT_FOCUS_API_KEY") {
        ui.setSubView("settings");
      }
    };

    const handleStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      if (changes["video2prompt:settings"]) {
        const next = changes["video2prompt:settings"].newValue as Partial<StoredSettings> | undefined;
        settingsHook.setSettings({ ...defaultSettings, ...(next ?? {}) });
      }
      if (changes["video2prompt:history"]) {
        historyHook.setHistoryItems((changes["video2prompt:history"].newValue as PromptHistoryItem[] | undefined) ?? []);
      }
    };

    if (isExtensionContextValid()) {
      try { chrome.runtime.onMessage.addListener(handleMessage); } catch (error) { logError("add onMessage listener", error); }
      try { chrome.storage.onChanged.addListener(handleStorageChanged); } catch (error) { logError("add onChanged listener", error); }
    }

    return () => {
      if (isExtensionContextValid()) {
        try { chrome.runtime.onMessage.removeListener(handleMessage); } catch (error) { logError("remove onMessage listener", error); }
        try { chrome.storage.onChanged.removeListener(handleStorageChanged); } catch (error) { logError("remove onChanged listener", error); }
      }
      for (const tab of ["image", "video"] as const) {
        if (ivTabsHook.localObjectUrlRefs.current[tab]) {
          URL.revokeObjectURL(ivTabsHook.localObjectUrlRefs.current[tab]!);
          ivTabsHook.localObjectUrlRefs.current[tab] = null;
        }
      }
      if (ui.toastTimerRef.current) window.clearTimeout(ui.toastTimerRef.current);
    };
  }, []);

  // ── Return same interface as before ────────────────────────────
  return {
    state: {
      settings: settingsHook.settings,
      historyItems: historyHook.historyItems,
      activeTabId: ivTabsHook.activeTabId,
      ivTabData: ivTabsHook.ivTabData,
      activeTab: ivTabsHook.activeTab,
      subView: ui.subView,
      statusMessage: ui.statusMessage,
      enhancerMode: enhancerHook.enhancerMode,
      enhancerInput: enhancerHook.enhancerInput,
      enhancerResultMode: enhancerHook.enhancerResultMode,
      enhancerResultText: enhancerHook.enhancerResultText,
      enhancerCopyLabel: enhancerHook.enhancerCopyLabel,
      isEnhancingPrompt: enhancerHook.isEnhancingPrompt,
      copiedHistoryId: historyHook.copiedHistoryId,
      editingCardId: historyHook.editingCardId,
      editingText: historyHook.editingText,
      currentIVTab: ivTabsHook.currentIVTab,
      currentData: ivTabsHook.currentData,
      hasApiKey: settingsHook.hasApiKey,
      hasMedia: ivTabsHook.hasMedia,
      isAnalyzing: ivTabsHook.isAnalyzing,
      canAnalyze: ivTabsHook.canAnalyze,
      showCopy: ivTabsHook.showCopy,
      showStyleCopy: ivTabsHook.showStyleCopy,
      showContentCopy: ivTabsHook.showContentCopy,
      styleCopyLabel: ivTabsHook.currentData.styleCopyLabel,
      contentCopyLabel: ivTabsHook.currentData.contentCopyLabel,
      canEnhancePrompt: enhancerHook.canEnhancePrompt,
      showEnhancerCopy: enhancerHook.showEnhancerCopy,
      displayResultText: ivTabsHook.displayResultText,
      displayStyleText: ivTabsHook.displayStyleText,
      displayContentText: ivTabsHook.displayContentText,
      displayBoundText: ivTabsHook.displayBoundText,
      currentMediaPreview: ivTabsHook.currentMediaPreview,
      currentMediaAspectRatio: ivTabsHook.currentMediaAspectRatio,
      panelSizeMode: ui.panelSizeMode,
      imageMode: ivTabsHook.imageMode,
    },
    refs: {
      imageFileRef: ivTabsHook.imageFileRef,
      videoFileRef: ivTabsHook.videoFileRef,
    },
    actions: {
      setActiveTab: ivTabsHook.setActiveTab,
      setSubView: ui.setSubView,
      setEnhancerMode: enhancerHook.setEnhancerMode,
      setEnhancerInput: enhancerHook.setEnhancerInput,
      setEditingText: historyHook.setEditingText,
      updateIVTab: ivTabsHook.updateIVTab,
      handleAnalyze: ivTabsHook.handleAnalyze,
      handleClear: ivTabsHook.handleClear,
      handleAbort: ivTabsHook.handleAbort,
      handleUploadClick: ivTabsHook.handleUploadClick,
      handleLocalUpload: ivTabsHook.handleLocalUpload,
      handleFileDrop: ivTabsHook.handleFileDrop,
      handleCopy: ivTabsHook.handleCopy,
      handleCopyStyle: ivTabsHook.handleCopyStyle,
      handleCopyContent: ivTabsHook.handleCopyContent,
      handleCopyAll: ivTabsHook.handleCopyAll,
      handleCopyHistory: historyHook.handleCopyHistory,
      getHistoryTypeLabel: historyHook.getHistoryTypeLabel,
      handleDeleteHistory: historyHook.handleDeleteHistory,
      handleEditStart: historyHook.handleEditStart,
      handleEditClose: historyHook.handleEditClose,
      handleEditCopy: historyHook.handleEditCopy,
      handleSelectModel: settingsHook.handleSelectModel,
      handleAddModel: settingsHook.handleAddModel,
      handleUpdateModel: settingsHook.handleUpdateModel,
      handleDeleteModel: settingsHook.handleDeleteModel,
      handlePanelModeChange: settingsHook.handlePanelModeChange,
      handleFrameSamplingModeChange: settingsHook.handleFrameSamplingModeChange,
      resetEnhancerResult: enhancerHook.resetEnhancerResult,
      handleEnhancePrompt: enhancerHook.handleEnhancePrompt,
      handleAbortEnhancer: enhancerHook.handleAbortEnhancer,
      handleCopyEnhancerResult: enhancerHook.handleCopyEnhancerResult,
      handleTabChange: ivTabsHook.handleTabChange,
      setPanelSizeMode: ui.setPanelSizeMode,
      setImageMode: ivTabsHook.setImageMode,
    },
  };
}
