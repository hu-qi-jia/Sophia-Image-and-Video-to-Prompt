import { useState } from "react";
import { useAppState } from "./useAppState";
import { useClickOutside } from "./useClickOutside";
import { ImageVideoPage } from "./ImageVideoPage";
import { EnhancerPage } from "./EnhancerPage";
import { HistoryView } from "./HistoryView";
import { SettingsView } from "./SettingsView";
import { type TabId, IMAGE_ACCEPT, VIDEO_ACCEPT } from "./types";

export function App() {
  const { state, refs, actions } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside(menuOpen, () => setMenuOpen(false));

  return (
    <main className="sophia-shell">
      <input ref={refs.imageFileRef} className="hidden-file-input" type="file" accept={IMAGE_ACCEPT} onChange={(e) => void actions.handleLocalUpload(e, "image")} />
      <input ref={refs.videoFileRef} className="hidden-file-input" type="file" accept={VIDEO_ACCEPT} onChange={(e) => void actions.handleLocalUpload(e, "video")} />

      {state.subView === "main" ? (
        <>
          <header className="app-header">
            <div className="header-brand">
              <img src="icons/logo_new1.png" alt="Sophia" className="brand-icon" />
            </div>
            <div className="header-nav-wrap">
              <nav className="tab-nav" role="tablist">
                <button
                  role="tab"
                  aria-selected={state.activeTab === "image"}
                  className={`tab-nav-btn ${state.activeTab === "image" ? "tab-nav-btn--active" : ""}`}
                  onClick={() => actions.handleTabChange("image")}
                  title="图片视图"
                >
                  <img src="icons/image.svg" alt="图片视图" className="tab-icon-img" />
                  <span className="tab-tooltip">图片视图</span>
                </button>
                <button
                  role="tab"
                  aria-selected={state.activeTab === "video"}
                  className={`tab-nav-btn ${state.activeTab === "video" ? "tab-nav-btn--active" : ""}`}
                  onClick={() => actions.handleTabChange("video")}
                  title="视频视图"
                >
                  <img src="icons/video.svg" alt="视频视图" className="tab-icon-img" />
                  <span className="tab-tooltip">视频视图</span>
                </button>
                <button
                  role="tab"
                  aria-selected={state.activeTab === "enhancer"}
                  className={`tab-nav-btn ${state.activeTab === "enhancer" ? "tab-nav-btn--active" : ""}`}
                  onClick={() => actions.handleTabChange("enhancer")}
                  title="提示词增强"
                >
                  <img src="icons/text.svg" alt="提示词增强" className="tab-icon-img" />
                  <span className="tab-tooltip">提示词增强</span>
                </button>
              </nav>
            </div>
            <div className="header-actions" ref={menuRef}>
              <button
                className="header-action-btn"
                aria-label="菜单"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              {menuOpen && (
                <div className="action-menu-dropdown">
                  <button
                    className="menu-item"
                    onClick={() => {
                      actions.setSubView("history");
                      setMenuOpen(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 3-6.7" />
                      <path d="M3 3v4h4" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <span>历史记录</span>
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      actions.setSubView("settings");
                      setMenuOpen(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
                    </svg>
                    <span>设置</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="page-content">
            {state.activeTab === "image" ? (
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
                onUploadClick={actions.handleUploadClick}
                onAnalyze={actions.handleAnalyze}
                onClear={actions.handleClear}
                onAbort={actions.handleAbort}
                onCopy={actions.handleCopy}
                onEditResult={(val) => actions.updateIVTab("image", { editedResultText: val })}
                onToggleExpanded={() => actions.updateIVTab("image", { isExpanded: !state.ivTabData.image.isExpanded })}
                onFileDrop={(file) => actions.handleFileDrop(file, "image")}
                displayStyleText={state.displayStyleText}
                displayContentText={state.displayContentText}
                showStyleCopy={state.showStyleCopy}
                showContentCopy={state.showContentCopy}
                onEditStyle={(val) => actions.updateIVTab("image", { editedStyleText: val })}
                onEditContent={(val) => actions.updateIVTab("image", { editedContentText: val })}
                onCopyStyle={actions.handleCopyStyle}
                onCopyContent={actions.handleCopyContent}
                onCopyAll={actions.handleCopyAll}
              />
            ) : null}

            {state.activeTab === "video" ? (
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
                showStyleCopy={state.showStyleCopy}
                showContentCopy={state.showContentCopy}
                onEditStyle={(val) => actions.updateIVTab("video", { editedStyleText: val })}
                onEditContent={(val) => actions.updateIVTab("video", { editedContentText: val })}
                onCopyStyle={actions.handleCopyStyle}
                onCopyContent={actions.handleCopyContent}
                onCopyAll={actions.handleCopyAll}
              />
            ) : null}

            {state.activeTab === "enhancer" ? (
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
              />
            ) : null}
          </div>
        </>
      ) : null}

      {state.subView === "history" ? (
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
      ) : null}

      {state.subView === "settings" ? (
        <SettingsView
          settings={state.settings}
          onBack={() => actions.setSubView("main")}
          onSelectModel={(modelId) => actions.handleSelectModel(modelId)}
          onAddModel={(model) => void actions.handleAddModel(model)}
          onUpdateModel={(model) => void actions.handleUpdateModel(model)}
          onDeleteModel={(modelId) => void actions.handleDeleteModel(modelId)}
          onPanelModeChange={(mode) => void actions.handlePanelModeChange(mode)}
        />
      ) : null}

      {state.statusMessage ? <div className="toast-modern">{state.statusMessage}</div> : null}
    </main>
  );
}
