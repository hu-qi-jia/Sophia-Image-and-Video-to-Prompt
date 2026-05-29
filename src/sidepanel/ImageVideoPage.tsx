import { useState } from "react";
import type { FrameSamplingMode } from "../lib/types";
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
  frameSamplingMode,
  onUploadClick,
  onAnalyze,
  onClear,
  onAbort,
  onCopy,
  onEditResult,
  onToggleExpanded,
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
  frameSamplingMode?: FrameSamplingMode;
  onUploadClick: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  onAbort: () => void;
  onCopy: () => void;
  onEditResult: (val: string) => void;
  onToggleExpanded: () => void;
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
    if (!allowedTypes.has(file.type)) return;
    if (onFileDrop) onFileDrop(file);
  };

  return (
    <>
      <section className={`upload-form-card${isDragOver ? " is-drag-over" : ""}${isExpanded || tabData.resultMode === "text" ? " is-expanded" : ""}`}>
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
      </section>

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
