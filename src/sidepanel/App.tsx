import { useState, useEffect, useRef } from "react";
import { useAppState } from "./useAppState";
import { useClickOutside } from "./useClickOutside";
import { ImageVideoPage } from "./ImageVideoPage";
import { EnhancerPage } from "./EnhancerPage";
import { HistoryView } from "./HistoryView";
import { SettingsView } from "./SettingsView";
import { type TabId, IMAGE_ACCEPT, VIDEO_ACCEPT } from "./types";
import type { PanelSizeMode } from "../lib/types";
import { getShadowRoot, getMountPoint, getPanel } from "../lib/shadow-dom";
import { logError, safeRuntimeSendMessage } from "../lib/error-utils";

export function App() {
  const { state, refs, actions } = useAppState();

  const panelSizeMode: PanelSizeMode = state.panelSizeMode;
  const isCompact = panelSizeMode === "compact";
  const isStandard = panelSizeMode === "standard";

  const applyPanelSizeToDOM = (mode: PanelSizeMode) => {
    try {
      const panel = getPanel();
      if (panel) {
        panel.setAttribute("data-size", mode === "collapsed" ? "compact" : mode);
      }
    } catch (error) {
      logError("applyPanelSizeToDOM", error);
    }
    void safeRuntimeSendMessage({ type: "SOPHIA_SET_SIZE_MODE", sizeMode: mode });
  };

  const handleToggleSizeMode = () => {
    const next: PanelSizeMode = isStandard ? "compact" : "standard";
    actions.setPanelSizeMode(next);
  };

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const toggleRef = useRef(handleToggleSizeMode);
  toggleRef.current = handleToggleSizeMode;

  // Ref to hold the latest setPanelSizeMode for event listener
  const setPanelSizeModeRef = useRef(actions.setPanelSizeMode);
  setPanelSizeModeRef.current = actions.setPanelSizeMode;

  useEffect(() => {
    const mountPoint = getMountPoint();
    if (!mountPoint) return;

    const onTabChange = (e: Event) => {
      const tab = (e as CustomEvent).detail as TabId;
      if (tab) actionsRef.current.handleTabChange(tab);
    };

    const onAction = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      if (action === "toggle-size") toggleRef.current();
      else if (action === "history") actionsRef.current.setSubView("history");
      else if (action === "settings") actionsRef.current.setSubView("settings");
    };

    /**
     * Listen for size mode changes from loader.ts shell.
     * This syncs the internal React state when the shell changes mode independently,
     * e.g., when clicking the collapsed handle to expand.
     */
    const onSetSizeMode = (e: Event) => {
      const mode = (e as CustomEvent<PanelSizeMode>).detail;
      if (mode && mode !== "collapsed") {
        setPanelSizeModeRef.current(mode);
      }
    };

    mountPoint.addEventListener("sophia-tab-change", onTabChange);
    mountPoint.addEventListener("sophia-action", onAction);
    mountPoint.addEventListener("sophia-set-size-mode", onSetSizeMode);
    return () => {
      mountPoint.removeEventListener("sophia-tab-change", onTabChange);
      mountPoint.removeEventListener("sophia-action", onAction);
      mountPoint.removeEventListener("sophia-set-size-mode", onSetSizeMode);
    };
  }, []);

  useEffect(() => {
    applyPanelSizeToDOM(panelSizeMode);
  }, [panelSizeMode]);

  useEffect(() => {
    try {
      const panel = getPanel();
      if (!panel) return;

      panel.querySelectorAll("._tab-btn").forEach(btn => {
        const tab = (btn as HTMLElement).dataset.tab;
        btn.classList.toggle("_tab-btn--active", tab === state.activeTab);
      });

      const tabNav = panel.querySelector("._tab-nav") as HTMLElement | null;
      if (tabNav) {
        tabNav.style.opacity = state.subView === "main" ? "1" : "0.4";
        tabNav.style.pointerEvents = state.subView === "main" ? "auto" : "none";
      }
    } catch (error) {
      logError("updateTabUI", error);
    }
  }, [state.activeTab, state.subView]);

  const isMain = state.subView === "main";
  const isHistory = state.subView === "history";
  const isSettings = state.subView === "settings";

  return (
    <main className={`sophia-shell ${isCompact ? "sophia-shell--compact" : "sophia-shell--standard"}`}>
      <input ref={refs.imageFileRef} className="hidden-file-input" type="file" accept={IMAGE_ACCEPT} onChange={(e) => void actions.handleLocalUpload(e, "image")} />
      <input ref={refs.videoFileRef} className="hidden-file-input" type="file" accept={VIDEO_ACCEPT} onChange={(e) => void actions.handleLocalUpload(e, "video")} />

      {/* ── Main content (tabs) — always mounted, hidden when subView changes ── */}
      <div className="page-content" style={{ display: isMain ? "flex" : "none" }}>
        <div style={{ display: state.activeTab === "image" ? "contents" : "none" }}>
          <ImageVideoPage
            mode="image"
            tabData={state.ivTabData.image}
            isAnalyzing={state.isAnalyzing}
            canAnalyze={state.canAnalyze}
            hasApiKey={state.hasApiKey}
            displayResultText={state.displayResultText}
            showCopy={state.showCopy}
            currentMediaPreview={state.currentMediaPreview}
            currentMediaAspectRatio={state.currentMediaAspectRatio}
            panelSizeMode={panelSizeMode}
            imageMode={state.imageMode}
            onUploadClick={actions.handleUploadClick}
            onAnalyze={actions.handleAnalyze}
            onClear={actions.handleClear}
            onAbort={actions.handleAbort}
            onCopy={actions.handleCopy}
            onEditResult={(val) => actions.updateIVTab("image", { editedResultText: val })}
            onToggleExpanded={() => actions.updateIVTab("image", { isExpanded: !state.ivTabData.image.isExpanded })}
            onFileDrop={(file) => actions.handleFileDrop(file, "image")}
            onImageModeChange={actions.setImageMode}
            displayStyleText={state.displayStyleText}
            displayContentText={state.displayContentText}
            displayBoundText={state.displayBoundText}
styleCopyLabel={state.styleCopyLabel}
            contentCopyLabel={state.contentCopyLabel}
            onEditStyle={(val) => actions.updateIVTab("image", { editedStyleText: val })}
            onEditContent={(val) => actions.updateIVTab("image", { editedContentText: val })}
            onCopyStyle={actions.handleCopyStyle}
            onCopyContent={actions.handleCopyContent}
            onCopyAll={actions.handleCopyAll}
          />
        </div>

        <div style={{ display: state.activeTab === "video" ? "contents" : "none" }}>
          <ImageVideoPage
            mode="video"
            tabData={state.ivTabData.video}
            isAnalyzing={state.isAnalyzing}
            canAnalyze={state.canAnalyze}
            hasApiKey={state.hasApiKey}
            displayResultText={state.displayResultText}
            showCopy={state.showCopy}
            currentMediaPreview={state.currentMediaPreview}
            currentMediaAspectRatio={state.currentMediaAspectRatio}
            frameSamplingMode={state.settings.frameSamplingMode}
            panelSizeMode={panelSizeMode}
            onUploadClick={actions.handleUploadClick}
            onAnalyze={actions.handleAnalyze}
            onClear={actions.handleClear}
            onAbort={actions.handleAbort}
            onCopy={actions.handleCopy}
            onEditResult={(val) => actions.updateIVTab("video", { editedResultText: val })}
            onToggleExpanded={() => actions.updateIVTab("video", { isExpanded: !state.ivTabData.video.isExpanded })}
            onFrameSamplingModeChange={actions.handleFrameSamplingModeChange}
            onFileDrop={(file) => actions.handleFileDrop(file, "video")}
            displayStyleText={state.displayStyleText}
            displayContentText={state.displayContentText}
            displayBoundText={state.displayBoundText}
styleCopyLabel={state.styleCopyLabel}
            contentCopyLabel={state.contentCopyLabel}
            onEditStyle={(val) => actions.updateIVTab("video", { editedStyleText: val })}
            onEditContent={(val) => actions.updateIVTab("video", { editedContentText: val })}
            onCopyStyle={actions.handleCopyStyle}
            onCopyContent={actions.handleCopyContent}
            onCopyAll={actions.handleCopyAll}
          />
        </div>

        <div style={{ display: state.activeTab === "enhancer" ? "contents" : "none" }}>
          <EnhancerPage
            enhancerMode={state.enhancerMode}
            enhancerInput={state.enhancerInput}
            isEnhancingPrompt={state.isEnhancingPrompt}
            canEnhancePrompt={state.canEnhancePrompt}
            hasApiKey={state.hasApiKey}
            enhancerResultMode={state.enhancerResultMode}
            enhancerResultText={state.enhancerResultText}
            enhancerCopyLabel={state.enhancerCopyLabel}
            showEnhancerCopy={state.showEnhancerCopy}
            onSetEnhancerMode={(mode) => { actions.setEnhancerMode(mode); actions.resetEnhancerResult(); }}
            onSetEnhancerInput={actions.setEnhancerInput}
            onEnhance={actions.handleEnhancePrompt}
            onAbortEnhancer={actions.handleAbortEnhancer}
            onCopyEnhancer={() => void actions.handleCopyEnhancerResult()}
            panelSizeMode={panelSizeMode}
          />
        </div>
      </div>

      {/* ── History view — always mounted, hidden when not active ── */}
      <div style={{ display: isHistory ? "contents" : "none" }}>
        <HistoryView
          historyItems={state.historyItems}
          copiedHistoryId={state.copiedHistoryId}
          editingCardId={state.editingCardId}
          editingText={state.editingText}
          onBack={() => actions.setSubView("main")}
          onCopyHistory={(item) => void actions.handleCopyHistory(item)}
          onDeleteHistory={(item) => void actions.handleDeleteHistory(item)}
          onEditStart={actions.handleEditStart}
          onEditClose={actions.handleEditClose}
          onEditCopy={() => void actions.handleEditCopy()}
          onEditingTextChange={actions.setEditingText}
          getHistoryTypeLabel={actions.getHistoryTypeLabel}
        />
      </div>

      {/* ── Settings view — always mounted, hidden when not active ── */}
      <div style={{ display: isSettings ? "contents" : "none" }}>
        <SettingsView
          settings={state.settings}
          panelSizeMode={panelSizeMode}
          onBack={() => actions.setSubView("main")}
          onSelectModel={(modelId) => actions.handleSelectModel(modelId)}
          onAddModel={(model) => void actions.handleAddModel(model)}
          onUpdateModel={(model) => void actions.handleUpdateModel(model)}
          onDeleteModel={(modelId) => void actions.handleDeleteModel(modelId)}
          onPanelModeChange={(mode) => void actions.handlePanelModeChange(mode)}
        />
      </div>

      {state.statusMessage ? <div className="toast-modern">{state.statusMessage}</div> : null}
    </main>
  );
}
