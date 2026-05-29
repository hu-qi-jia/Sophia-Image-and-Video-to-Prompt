import { useState } from "react";
import styled from "styled-components";
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
          <StyledHeader>
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
          </StyledHeader>

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
        />
      ) : null}

      {state.statusMessage ? <div className="toast-modern">{state.statusMessage}</div> : null}
    </main>
  );
}

const StyledHeader = styled.header`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: 0;
  z-index: 10;
  background: transparent;
  border-bottom: none;

  .header-brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-brand .brand-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .header-nav-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
  }

  .tab-nav {
    display: flex;
    gap: 12px;
    background: rgba(0, 0, 0, 0.04);
    -webkit-backdrop-filter: var(--glass-blur-sm);
    backdrop-filter: var(--glass-blur-sm);
    border-radius: var(--radius-pill);
    padding: 5px 8px;
    border: 1px solid var(--glass-border);
  }

  .tab-nav-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.3s var(--ease-out);

    svg {
      width: 17px;
      height: 17px;
    }

    .tab-icon-img {
      width: 17px;
      height: 17px;
      object-fit: contain;
      filter: invert(60%) sepia(8%) saturate(200%) hue-rotate(180deg) brightness(85%) contrast(85%);
      transition: filter 0.3s var(--ease-out);
    }

    &:hover .tab-icon-img {
      filter: invert(30%) sepia(8%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(90%);
    }

    &:hover {
      color: var(--text-secondary);
      background: rgba(0, 0, 0, 0.03);
    }
  }

  .tab-nav-btn--active .tab-icon-img {
    filter: invert(0%) brightness(0%) contrast(100%);
  }

  .tab-tooltip {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(-6px);
    background: var(--bg-card-solid);
    color: var(--text-primary);
    font-size: var(--text-xxs);
    font-weight: var(--font-medium);
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow-elevated);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  }

  .tab-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-bottom-color: var(--glass-border);
  }

  .tab-nav-btn:hover .tab-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .tab-nav-btn--active {
    color: var(--text-primary);
    background: var(--glass-bg-hover);
    -webkit-backdrop-filter: var(--glass-blur-sm);
    backdrop-filter: var(--glass-blur-sm);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), var(--glass-inner-shadow);
    border: 1px solid var(--glass-border-hover);
    transform: translateY(-1px);
  }

  .tab-nav-btn--active:hover {
    color: var(--text-primary);
    background: var(--glass-bg-hover);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .header-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all var(--duration-fast) var(--ease-out);

    svg {
      width: 17px;
      height: 17px;
    }

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }

  .action-menu-dropdown {
    position: absolute;
    top: calc(100% + 2px);
    right: 0;
    min-width: 160px;
    background: var(--bg-card-solid);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--glass-shadow-elevated);
    padding: var(--space-1);
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 100;
    animation: menu-dropdown-in 0.2s var(--ease-out);
  }

  @keyframes menu-dropdown-in {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 10px var(--space-3);
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: all var(--duration-fast) var(--ease-out);
    text-align: left;

    svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    &:active {
      transform: scale(0.98);
    }
  }
`;
