import {
  SpinnerIcon,
  SparklePlaceholder,
  EnhancerVideoIcon,
  EnhancerImageIcon,
} from "./icons";

export function EnhancerPage({
  enhancerMode,
  enhancerInput,
  isEnhancingPrompt,
  canEnhancePrompt,
  hasApiKey,
  enhancerResultMode,
  enhancerResultText,
  enhancerCopyLabel,
  showEnhancerCopy,
  onSetEnhancerMode,
  onSetEnhancerInput,
  onEnhance,
  onAbortEnhancer,
  onCopyEnhancer,
}: {
  enhancerMode: "video" | "image";
  enhancerInput: string;
  isEnhancingPrompt: boolean;
  canEnhancePrompt: boolean;
  hasApiKey: boolean;
  enhancerResultMode: "empty" | "loading" | "text" | "error";
  enhancerResultText: string;
  enhancerCopyLabel: string;
  showEnhancerCopy: boolean;
  onSetEnhancerMode: (mode: "video" | "image") => void;
  onSetEnhancerInput: (val: string) => void;
  onEnhance: () => void;
  onAbortEnhancer: () => void;
  onCopyEnhancer: () => void;
}) {
  return (
    <>
      <section className="enhancer-form-card">
        <div className="enhancer-mode-pills" role="tablist" aria-label="增强器模式">
          <button type="button" role="tab" aria-selected={enhancerMode === "video"}
            className={`enhancer-pill ${enhancerMode === "video" ? "enhancer-pill--active" : ""}`}
            onClick={() => onSetEnhancerMode("video")}>
            <EnhancerVideoIcon /><span>视频</span>
          </button>
          <button type="button" role="tab" aria-selected={enhancerMode === "image"}
            className={`enhancer-pill ${enhancerMode === "image" ? "enhancer-pill--active" : ""}`}
            onClick={() => onSetEnhancerMode("image")}>
            <EnhancerImageIcon /><span>图片</span>
          </button>
        </div>

        <div className="enhancer-input-wrap">
          <textarea
            value={enhancerInput}
            onChange={(e) => onSetEnhancerInput(e.target.value)}
            placeholder={enhancerMode === "video"
              ? "描述你的视频创意，例如：一个女孩在雨中漫步，慢镜头，电影质感"
              : "描述你的图片创意，例如：一只金毛幼犬在草地上奔跑，阳光明媚"}
            rows={5}
            className="enhancer-textarea"
          />
        </div>

        {isEnhancingPrompt ? (
          <div className="enhancer-action-row">
            <button className="btn-primary btn-primary--busy" disabled>
              <SpinnerIcon />增强中
            </button>
            <button className="btn-secondary btn-secondary--danger" onClick={onAbortEnhancer}>中止</button>
          </div>
        ) : (
          <div className="enhancer-action-row">
            <button
              className="btn-primary"
              onClick={() => void onEnhance()}
              disabled={!canEnhancePrompt}
            >
              增强
            </button>
          </div>
        )}

        {!hasApiKey ? (
          <p className="upload-hint-warn">请先在设置中配置模型信息</p>
        ) : null}
      </section>

      <section className="result-card">
        <div className="result-card-head">
          <span className="result-card-title">增强结果</span>
          {showEnhancerCopy ? (
            <button className="result-copy-btn" onClick={() => void onCopyEnhancer()}>
              {enhancerCopyLabel}
            </button>
          ) : null}
        </div>
        <div className={`result-card-body result-body-${enhancerResultMode}`}>
          {enhancerResultMode === "loading" ? (
            <div className="result-loading"><SpinnerIcon /><strong>正在增强中...</strong></div>
          ) : null}
          {enhancerResultMode === "empty" ? (
            <div className="result-empty"><SparklePlaceholder /><p>输入创意后点击增强，结果将在此呈现</p></div>
          ) : null}
          {enhancerResultMode === "error" ? <div className="result-error-state"><p>{enhancerResultText}</p></div> : null}
          {enhancerResultMode === "text" ? <div className="result-text-block">{enhancerResultText}</div> : null}
        </div>
      </section>
    </>
  );
}
