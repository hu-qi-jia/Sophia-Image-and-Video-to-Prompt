import { useState } from "react";
import styled from "styled-components";
import type { FrameSamplingMode } from "../lib/types";
// import { IMAGE_CATEGORIES } from "../lib/types";
import {
  SpinnerIcon,
  SparklePlaceholder,
  ExpandIcon,
} from "./icons";
import { useClickOutside } from "./useClickOutside";
import {
  type IVTabData,
  FRAME_MODE_COPY,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from "./types";

const UploadFormCard = styled.section`
  border-radius: var(--radius-xl);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all var(--duration-lift) var(--ease-out);
  min-height: 160px;
  max-height: 280px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 0.5px solid var(--glass-border);
  box-shadow:
    var(--glass-shadow),
    var(--glass-inner-shadow),
    var(--glass-edge-light);
  animation: hero-rise 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--glass-shine);
    pointer-events: none;
    z-index: 0;
  }

  &.is-drag-over {
    transform: translateY(-1px);
    border-color: var(--glass-border-hover);
    box-shadow:
      var(--glass-shadow-hover),
      var(--glass-inner-shadow),
      var(--glass-edge-light);
  }

  /* ── Upload Label (empty state container) ── */
  .upload-label {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 20px 24px;
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
    position: relative;
    z-index: 1;
  }

  /* ── Empty State Layout ── */
  .upload-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .upload-icon-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.35s var(--ease-out);

    img {
      width: 96px;
      height: 96px;
      object-fit: contain;
      opacity: 0.8;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
      transition: all 0.35s var(--ease-out);
    }
  }

  &:hover .upload-icon-ring,
  &.is-drag-over .upload-icon-ring {
    img { opacity: 1; transform: scale(1.05); }
  }

  .upload-title {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.015em;
    line-height: 1.3;
  }

  /* ── Action Row: button + hint inline ── */
  .upload-action-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }

  .upload-action-divider {
    width: 1px;
    height: 14px;
    background: var(--glass-border);
    flex-shrink: 0;
  }

  .upload-hint-inline {
    font-size: var(--text-xxs);
    color: var(--text-placeholder);
    margin: 0;
    font-weight: var(--font-medium);
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .upload-btn-premium {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: var(--btn-padding-sm);
    min-height: var(--btn-height-sm);
    border: none;
    border-radius: var(--btn-radius-pill);
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    line-height: 1;
    white-space: nowrap;
    letter-spacing: 0.02em;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .upload-btn-premium:hover {
    transform: translateY(-1px) scale(1.02);
    background: var(--accent-hover);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .upload-btn-premium:active {
    transform: scale(0.97) translateY(0);
  }

  .upload-btn-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .upload-error {
    color: var(--danger);
    font-size: var(--text-xxs);
    margin: 0;
    text-align: center;
    font-weight: var(--font-semibold);
    letter-spacing: 0.01em;
    position: relative;
    z-index: 1;
    padding: 0 24px 10px;
  }

  /* ── Loaded State: Preview ── */
  .upload-preview {
    width: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 14px 14px 0;
    box-sizing: border-box;
    min-height: 0;
    position: relative;
    z-index: 1;

    img, video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: var(--radius-md);
    }
  }

  /* ── Expanded (compact) State ── */
  &.is-expanded {
    max-height: 88px;
    min-height: 72px;
    border-radius: var(--radius-lg);

    .upload-preview {
      padding: 6px 6px 0;
      img, video {
        max-height: 48px;
        min-height: 48px;
        max-width: 64px;
        border-radius: var(--radius-sm);
      }
    }

    .upload-actions {
      padding: 6px 12px;
      gap: 6px;

      .btn-primary, .btn-secondary {
        font-size: var(--text-xxs);
        padding: 3px 10px;
        min-height: 26px;
        height: auto;
      }
    }
  }

  /* ── Loaded State: Actions ── */
  .upload-actions {
    display: flex;
    gap: 8px;
    padding: 10px 16px;
    width: 100%;
    box-sizing: border-box;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .upload-actions--text-only {
    gap: 14px;
  }

  .btn-text-link {
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--accent);
    cursor: pointer;
    line-height: 1;
    transition: opacity 0.15s ease;
  }
  .btn-text-link:hover { opacity: 0.75; }
  .btn-text-link:active { opacity: 0.55; }
  .btn-text-link:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-text-link--muted { color: var(--text-tertiary); }
  .btn-text-link--muted:hover { color: var(--text-secondary); }

  .upload-hint-warn {
    font-size: var(--text-xxs);
    color: var(--danger);
    text-align: center;
    padding: 0 16px 10px;
    margin: 0;
    font-weight: var(--font-semibold);
    letter-spacing: 0.01em;
    position: relative;
    z-index: 1;
  }
`;

/*
const CategorySelector = styled.div`
  display: flex;
  gap: 6px;
  padding: 4px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 100px;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    flex-shrink: 0;

    &:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    &.is-selected {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .category-icon {
      font-size: 14px;
      line-height: 1;
    }
  }
`;
*/

export function ImageVideoPage({
  mode,
  tabData,
  isAnalyzing,
  canAnalyze,
  hasApiKey,
  displayResultText,
  showCopy,
  currentMediaPreview,
  currentMediaAspectRatio,
  // selectedCategory,
  frameSamplingMode,
  onUploadClick,
  onAnalyze,
  onClear,
  onAbort,
  onCopy,
  onEditResult,
  onToggleExpanded,
  // onCategoryChange,
  onFrameSamplingModeChange,
  onFileDrop,
  displayStyleText,
  displayContentText,
  showStyleCopy,
  showContentCopy,
  onEditStyle,
  onEditContent,
  onCopyStyle,
  onCopyContent,
  onCopyAll,
}: {
  mode: "image" | "video";
  tabData: IVTabData;
  isAnalyzing: boolean;
  canAnalyze: boolean;
  hasApiKey: boolean;
  displayResultText: string;
  showCopy: boolean;
  currentMediaPreview: React.ReactNode;
  currentMediaAspectRatio: string | undefined;
  // selectedCategory?: ImageCategory;
  frameSamplingMode?: FrameSamplingMode;
  onUploadClick: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  onAbort: () => void;
  onCopy: () => void;
  onEditResult: (val: string) => void;
  onToggleExpanded: () => void;
  // onCategoryChange?: (category: ImageCategory) => void;
  onFrameSamplingModeChange?: (mode: FrameSamplingMode) => void;
  onFileDrop?: (file: File) => void;
  displayStyleText: string;
  displayContentText: string;
  showStyleCopy: boolean;
  showContentCopy: boolean;
  onEditStyle: (val: string) => void;
  onEditContent: (val: string) => void;
  onCopyStyle: () => void;
  onCopyContent: () => void;
  onCopyAll: () => void;
}) {
  const isImage = mode === "image";
  const mediaLabel = isImage ? "图片" : "视频";
  const acceptHint = isImage ? "JPG / PNG / WebP / GIF" : "MP4 / WebM / MOV";
  const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const isExpanded = tabData.isExpanded;
  const [samplingDropdownOpen, setSamplingDropdownOpen] = useState(false);
  const samplingDropdownRef = useClickOutside(samplingDropdownOpen, () => setSamplingDropdownOpen(false));
  const [showSamplingInfo, setShowSamplingInfo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedModule, setExpandedModule] = useState<"style" | "content" | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      return;
    }
    if (onFileDrop) {
      onFileDrop(file);
    }
  };

  return (
    <>
      <UploadFormCard className={`${isDragOver ? "is-drag-over" : ""} ${isExpanded || tabData.resultMode === "text" ? "is-expanded" : ""}`}>
        {tabData.mediaSource.kind === "none" ? (
          <label
            className="upload-label"
            onClick={onUploadClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onUploadClick(); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-empty">
              <div className="upload-icon-ring">
                <img src="/icons/update.png" alt="上传" draggable={false} />
              </div>
              <p className="upload-title">上传文件 & 拖拽{mediaLabel}到此处</p>
              <p className="upload-hint-inline">支持格式 {acceptHint}</p>
            </div>
            {tabData.uploadError ? <p className="upload-error">{tabData.uploadError}</p> : null}
          </label>
        ) : (
          <>
            <div className="upload-preview" style={currentMediaAspectRatio ? { aspectRatio: currentMediaAspectRatio } : undefined}>
              {currentMediaPreview}
            </div>
            <div className={`upload-actions${isExpanded && tabData.resultMode === "text" ? " upload-actions--text-only" : ""}`}>
              <button
                className={`${isExpanded && tabData.resultMode === "text" ? "btn-text-link" : "btn-primary btn-dark"}${isAnalyzing ? " btn-primary--busy" : ""}`}
                onClick={onAnalyze}
                disabled={!canAnalyze}
              >
                {isAnalyzing ? "识别中" : tabData.resultMode === "text" ? "重新生成" : "生成"}
              </button>
              <button className={isExpanded && tabData.resultMode === "text" ? "btn-text-link btn-text-link--muted" : "btn-secondary"} onClick={onClear} disabled={isAnalyzing}>清除</button>
              {isAnalyzing ? (
                <button className="btn-secondary" onClick={onAbort}>中止</button>
              ) : null}
            </div>
            {!hasApiKey ? <p className="upload-hint-warn">请先在设置中配置模型信息</p> : null}
          </>
        )}
      </UploadFormCard>

      {/* 图片分类选择器 — 暂时隐藏，默认使用通用提示词 (auto)
      {isImage && tabData.mediaSource.kind !== "none" ? (
        <CategorySelector>
          {IMAGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-chip${selectedCategory === cat.id ? " is-selected" : ""}`}
              onClick={() => onCategoryChange?.(cat.id)}
              title={cat.description}
            >
              <span className="category-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </CategorySelector>
      ) : null}
      */}

      {!isImage && frameSamplingMode && onFrameSamplingModeChange ? (
        <div className="frame-sampling-row">
          <div className="frame-sampling-header">
            <span className="frame-sampling-title">帧采样</span>
            <button
              type="button"
              className="frame-sampling-info-btn"
              onMouseEnter={() => setShowSamplingInfo(true)}
              onMouseLeave={() => setShowSamplingInfo(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            {showSamplingInfo ? (
              <div className="frame-sampling-tooltip">
                选择帧采样方式，控制从视频中提取的帧数量和策略
              </div>
            ) : null}
          </div>
          <div className="frame-sampling-dropdown" ref={samplingDropdownRef}>
            <button
              type="button"
              className={`frame-sampling-trigger ${samplingDropdownOpen ? "is-open" : ""}`}
              onClick={() => setSamplingDropdownOpen((c) => !c)}
            >
              <span className="frame-sampling-label">{FRAME_MODE_COPY[frameSamplingMode].label}</span>
              <svg className="frame-sampling-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {samplingDropdownOpen ? (
              <div className="frame-sampling-menu">
                {(Object.keys(FRAME_MODE_COPY) as FrameSamplingMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`frame-sampling-opt ${frameSamplingMode === m ? "is-selected" : ""}`}
                    onClick={() => { onFrameSamplingModeChange(m); setSamplingDropdownOpen(false); }}
                  >
                    <span className="frame-sampling-opt-label">{FRAME_MODE_COPY[m].label}</span>
                    <span className="frame-sampling-opt-desc">{FRAME_MODE_COPY[m].description}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className={`result-card ${isExpanded ? "result-card--expanded" : ""}`}>
        <div className="result-card-head">
          <span className="result-card-title">识别结果</span>
        </div>
        <div className={`result-card-body result-body-${tabData.resultMode}`}>
          {tabData.resultMode === "loading" ? (
            <div className="result-loading">
              <SpinnerIcon />
              {tabData.streamText ? (
                <pre className="result-stream-text">{tabData.streamText}</pre>
              ) : null}
            </div>
          ) : null}
          {tabData.resultMode === "empty" ? (
            <div className="result-empty"><SparklePlaceholder /><p>提取结果将在此呈现</p></div>
          ) : null}
          {tabData.resultMode === "error" ? <div className="result-error-state"><p>{tabData.resultText}</p></div> : null}
          {tabData.resultMode === "text" && (displayStyleText || displayContentText) ? (
            <div className="result-dual-modules">
              <div className={`result-module${expandedModule === "style" ? " result-module--expanded" : ""}${expandedModule === "content" ? " result-module--collapsed" : ""}`}>
                <div className="result-module-head">
                  <span className="result-module-title">风格描述</span>
                  <div className="result-module-actions-inline">
                    {showStyleCopy ? (
                      <button className="result-module-icon-btn" onClick={onCopyStyle} title="复制风格">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    ) : null}
                    <button className="result-module-icon-btn" onClick={() => setExpandedModule(expandedModule === "style" ? null : "style")} title={expandedModule === "style" ? "收起" : "展开"}>
                      <ExpandIcon expanded={expandedModule === "style"} />
                    </button>
                  </div>
                </div>
                <textarea
                  className="result-edit-area result-module-area"
                  value={displayStyleText}
                  onChange={(e) => onEditStyle(e.target.value)}
                  spellCheck={false}
                  placeholder="风格/氛围/色调/灯光..."
                />
              </div>
              <div className={`result-module${expandedModule === "content" ? " result-module--expanded" : ""}${expandedModule === "style" ? " result-module--collapsed" : ""}`}>
                <div className="result-module-head">
                  <span className="result-module-title">内容描述</span>
                  <div className="result-module-actions-inline">
                    {showContentCopy ? (
                      <button className="result-module-icon-btn" onClick={onCopyContent} title="复制内容">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    ) : null}
                    <button className="result-module-icon-btn" onClick={() => setExpandedModule(expandedModule === "content" ? null : "content")} title={expandedModule === "content" ? "收起" : "展开"}>
                      <ExpandIcon expanded={expandedModule === "content"} />
                    </button>
                  </div>
                </div>
                <textarea
                  className="result-edit-area result-module-area"
                  value={displayContentText}
                  onChange={(e) => onEditContent(e.target.value)}
                  spellCheck={false}
                  placeholder="主体/构图/环境..."
                />
              </div>
              {(showStyleCopy || showContentCopy) ? (
                <div className="result-module-actions">
                  <button className={`result-copy-all-btn${tabData.copyAllLabel === "已复制" ? " is-copied" : ""}`} onClick={onCopyAll}>{tabData.copyAllLabel}</button>
                </div>
              ) : null}
            </div>
          ) : tabData.resultMode === "text" ? (
            <textarea
              className="result-edit-area"
              value={displayResultText}
              onChange={(e) => onEditResult(e.target.value)}
              spellCheck={false}
            />
          ) : null}
        </div>
      </section>
    </>
  );
}
