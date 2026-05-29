import styled from "styled-components";
import {
  SpinnerIcon,
  SparklePlaceholder,
  EnhancerVideoIcon,
  EnhancerImageIcon,
} from "./icons";

const EnhancerFormCard = styled.section`
  position: relative;
  border-radius: var(--radius-2xl);
  padding: var(--space-3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all var(--duration-lift) var(--ease-out);
  min-height: 0;
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

  .enhancer-mode-pills {
    display: flex;
    gap: 0;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    border-bottom: 0.5px solid var(--glass-border);
    margin-bottom: var(--space-2);
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .enhancer-pill {
    min-height: 30px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: var(--font-normal);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0 var(--space-3) var(--space-2);
    transition: all var(--duration-fast) var(--ease-out);
    flex: 1;
    letter-spacing: 0.01em;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      color: var(--text-primary);
    }
  }

  .enhancer-pill--active {
    color: var(--text-primary);
    background: transparent;
    box-shadow: none;
    border-bottom: 2px solid var(--accent);
    border-left: none;
    border-right: none;
    border-top: none;
    font-weight: var(--font-medium);

    &:hover {
      color: var(--text-primary);
    }
  }

  .enhancer-input-wrap {
    display: grid;
    gap: var(--space-1);
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .enhancer-textarea {
    width: 100%;
    min-height: 120px;
    resize: vertical;
    border: 0.5px solid var(--glass-border);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.3);
    color: var(--text-primary);
    padding: var(--space-4);
    font-size: var(--text-sm);
    line-height: 1.8;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
    font-family: inherit;
    box-sizing: border-box;
    will-change: height;
    contain: content;

    &::placeholder {
      color: var(--text-placeholder);
      font-weight: var(--font-normal);
      letter-spacing: 0;
    }

    &:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
      background: rgba(255, 255, 255, 0.5);
    }
  }

  .enhancer-action-row {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-2);
    width: 100%;
    padding-top: 0;
    position: relative;
    z-index: 1;
  }

  .upload-hint-warn {
    margin: var(--space-3) 0 0;
    color: var(--text-secondary);
    font-size: var(--text-xs);
    text-align: center;
    font-weight: var(--font-medium);
    letter-spacing: 0.01em;
    position: relative;
    z-index: 1;
  }
`;

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
      <EnhancerFormCard>
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
      </EnhancerFormCard>

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
