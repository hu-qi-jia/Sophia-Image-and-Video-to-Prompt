import { useState, useRef, useEffect } from "react";
import type { FrameSamplingMode, PanelSizeMode } from "../lib/types";
import {
  SpinnerIcon,
  SparklePlaceholder,
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

function extUrl(path: string): string {
  try {
    return chrome.runtime.getURL(path);
  } catch {
    return "/" + path;
  }
}

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
  onEditStyle,
  onEditContent,
  onCopyStyle,
  onCopyContent,
  onCopyAll,
  styleCopyLabel,
  contentCopyLabel,
  panelSizeMode,
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
  styleCopyLabel: string;
  contentCopyLabel: string;
  onEditStyle: (val: string) => void;
  onEditContent: (val: string) => void;
  onCopyStyle: () => void;
  onCopyContent: () => void;
  onCopyAll: () => void;
  panelSizeMode?: PanelSizeMode;
}) {
  const isImage = mode === "image";
  const mediaLabel = isImage ? "图片" : "视频";
  const acceptHint = isImage ? "JPG / PNG / WebP / GIF" : "MP4 / WebM / MOV";
  const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const isExpanded = tabData.isExpanded;
  const [samplingDropdownOpen, setSamplingDropdownOpen] = useState(false);
  const samplingDropdownRef = useClickOutside(samplingDropdownOpen, () => setSamplingDropdownOpen(false));
  const [isDragOver, setIsDragOver] = useState(false);
  const [resultTab, setResultTab] = useState<"all" | "style" | "content">("all");
  const dropZoneRef = useRef<HTMLElement>(null);

  // Use native DOM events for reliable drag-and-drop (Preact synthetic
  // events may not forward dataTransfer correctly on all browsers).
  useEffect(() => {
    const el = dropZoneRef.current;
    if (!el) return;
    if (tabData.mediaSource.kind !== "none") return;

    let counter = 0;
    let fetchAbort: AbortController | null = null;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter++;
      if (counter === 1) setIsDragOver(true);
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter--;
      if (counter <= 0) {
        counter = 0;
        setIsDragOver(false);
      }
    };

    /** Resolve potentially-relative URL against the current page. */
    function resolveUrl(raw: string): string {
      try { return new URL(raw, window.location.href).href; }
      catch { return raw; }
    }

    /** Extract an image URL from drag data (e.g. dragging an <img> from the page). */
    function extractImageUrl(dt: DataTransfer): string | null {
      // 1) text/html → parse <img src> (also try srcset)
      const html = dt.getData("text/html") || "";
      let m = html.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
      if (!m) m = html.match(/<img[^>]+srcset\s*=\s*["'][^"']*\b(https?:\/\/[^\s"']+)/i);
      if (!m) m = html.match(/<img[^>]+data-src\s*=\s*["']([^"']+)["']/i);
      if (m?.[1]) return resolveUrl(m[1]);
      // 2) text/uri-list → may contain direct image URLs
      const uriList = dt.getData("text/uri-list") || "";
      const uriMatch = uriList.match(/^(https?:\/\/[^\s]+\.(?:jpe?g|png|webp|gif|bmp|svg))\s*$/im);
      if (uriMatch?.[1]) return uriMatch[1];
      // 3) text/plain → check if it looks like an image URL
      const plain = dt.getData("text/plain") || "";
      const plainMatch = plain.match(/^(https?:\/\/[^\s]+\.(?:jpe?g|png|webp|gif|bmp|svg))\s*$/im);
      if (plainMatch?.[1]) return plainMatch[1];
      return null;
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter = 0;
      setIsDragOver(false);

      // A) File drop (local files)
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        if (!allowedTypes.has(file.type)) return;
        if (onFileDrop) onFileDrop(file);
        return;
      }

      // B) Webpage image drag (e.g. <img> element)
      const imageUrl = e.dataTransfer ? extractImageUrl(e.dataTransfer) : null;
      if (!imageUrl) return;

      // Clean up any previous fetch
      if (fetchAbort) fetchAbort.abort();
      fetchAbort = new AbortController();

      fetch(imageUrl, { signal: fetchAbort.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          // Derive filename + ensure correct extension
          let name = imageUrl.split("/").pop()?.split("?")[0] || "image.png";
          if (!/\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(name)) {
            name += blob.type.startsWith("image/") ? "." + blob.type.split("/")[1] : ".png";
          }
          const f = new File([blob], name, { type: blob.type || "image/png" });
          if (onFileDrop) onFileDrop(f);
        })
        .catch(() => {
          // Silently ignore — could be CORS or network error
        });
    };

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
      if (fetchAbort) fetchAbort.abort();
    };
  }, [tabData.mediaSource.kind, allowedTypes, onFileDrop]);

  const isCompact = panelSizeMode === "compact";

  const handleHeaderCopy = () => {
    if (resultTab === "all") onCopyAll();
    else if (resultTab === "style") onCopyStyle();
    else onCopyContent();
  };

  const headerCopyLabel =
    resultTab === "all" ? tabData.copyAllLabel :
    resultTab === "style" ? styleCopyLabel :
    contentCopyLabel;

  return (
    <div className={`iv-split-layout${isCompact ? " iv-split-layout--compact" : " iv-split-layout--standard"}`}>
      {/* ── Left: Media Panel ── */}
      <div className="iv-left-panel">
        <section
          ref={dropZoneRef}
          className={`upload-form-card${isDragOver ? " is-drag-over" : ""}${isExpanded ? " is-expanded" : ""}`}
        >
          {tabData.mediaSource.kind === "none" ? (
            <label
              className="upload-label"
              onClick={onUploadClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onUploadClick(); }}
            >
              <div className="upload-empty">
                <div className="upload-icon-ring">
                  <img src={extUrl("icons/update.png")} alt="上传" draggable={false} />
                </div>
                <p className="upload-title">上传或拖拽{mediaLabel}</p>
                <p className="upload-hint-inline">{acceptHint}</p>
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
              <button type="button" className="frame-sampling-info-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              <div className="frame-sampling-tooltip">
                选择帧采样方式，控制从视频中提取的帧数量和策略
              </div>
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
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onFrameSamplingModeChange(m); setSamplingDropdownOpen(false); }}
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
      </div>

      {/* ── Right: Result Panel ── */}
      <div className="iv-right-panel">
        <section className={`result-card ${isExpanded ? "result-card--expanded" : ""}`}>
          <div className="result-card-head">
            <span className="result-card-title">识别结果</span>
            {(displayStyleText || displayContentText) ? (
              <button
                className={`result-copy-icon-btn${headerCopyLabel === "已复制" ? " is-copied" : ""}`}
                onClick={handleHeaderCopy}
                title={headerCopyLabel === "已复制" ? "已复制" : "复制"}
              >
                {headerCopyLabel === "已复制" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            ) : null}
          </div>
          {(displayStyleText || displayContentText) ? (
            <div className="result-tab-bar">
              <button className={`result-tab-pill${resultTab === "all" ? " result-tab-pill--active" : ""}`} onClick={() => setResultTab("all")}>全部</button>
              <button className={`result-tab-pill${resultTab === "style" ? " result-tab-pill--active" : ""}`} onClick={() => setResultTab("style")}>风格描述</button>
              <button className={`result-tab-pill${resultTab === "content" ? " result-tab-pill--active" : ""}`} onClick={() => setResultTab("content")}>内容描述</button>
            </div>
          ) : null}
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
              <div className="result-empty"><SparklePlaceholder /><p>上传媒体后点击生成</p></div>
            ) : null}
            {tabData.resultMode === "error" ? <div className="result-error-state"><p>{tabData.resultText}</p></div> : null}
            {tabData.resultMode === "text" && (displayStyleText || displayContentText) ? (
              <div className="result-dual-modules">
                {resultTab === "all" ? (
                  <div className="result-module">
                    <textarea
                      className="result-edit-area result-module-area"
                      value={displayResultText || [displayStyleText, displayContentText].filter(Boolean).join("\n\n")}
                      onChange={(e) => onEditResult(e.target.value)}
                      spellCheck={false}
                      placeholder="识别结果..."
                    />
                  </div>
                ) : (
                  <>
                    {(resultTab === "style") ? (
                      <div className="result-module">
                        <textarea
                          className="result-edit-area result-module-area"
                          value={displayStyleText}
                          onChange={(e) => onEditStyle(e.target.value)}
                          spellCheck={false}
                          placeholder="风格/氛围/色调/灯光..."
                        />
                      </div>
                    ) : null}
                    {(resultTab === "content") ? (
                      <div className="result-module">
                        <textarea
                          className="result-edit-area result-module-area"
                          value={displayContentText}
                          onChange={(e) => onEditContent(e.target.value)}
                          spellCheck={false}
                          placeholder="主体/构图/环境..."
                        />
                      </div>
                    ) : null}
                  </>
                )}
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
    </div>
  </div>
  );
}
