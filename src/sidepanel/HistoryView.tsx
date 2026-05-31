import { memo } from "react";
import type { PromptHistoryItem } from "../lib/types";
import { formatHistoryTime } from "./types";
import {
  WandIcon,
  VideoIcon,
  ImageIcon,
  ClockIcon,
  EditIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  BackIcon,
} from "./icons";

interface HistoryViewProps {
  historyItems: PromptHistoryItem[];
  copiedHistoryId: string | null;
  editingCardId: string | null;
  editingText: string;
  onBack: () => void;
  onCopyHistory: (item: PromptHistoryItem) => void;
  onDeleteHistory: (item: PromptHistoryItem) => void;
  onEditStart: (item: PromptHistoryItem) => void;
  onEditClose: () => void;
  onEditCopy: () => void;
  onEditingTextChange: (val: string) => void;
  getHistoryTypeLabel: (item: PromptHistoryItem) => string;
}

export const HistoryView = memo(function HistoryView({
  historyItems,
  copiedHistoryId,
  editingCardId,
  editingText,
  onBack,
  onCopyHistory,
  onDeleteHistory,
  onEditStart,
  onEditClose,
  onEditCopy,
  onEditingTextChange,
  getHistoryTypeLabel,
}: HistoryViewProps) {
  return (
    <section className="subview-screen">
      <div className="subview-topbar">
        <div className="subview-title-row">
          <button className="back-button back-button-box" onClick={onBack}>
            <BackIcon />
          </button>
          <div className="subview-title-group">
            <h2 className="subview-title">历史记录</h2>
            <p className="subview-subtitle">最近生成的记录</p>
          </div>
        </div>
      </div>
      <section className="history-panel">
        {historyItems.length === 0 ? (
          <div className="history-empty-state">
            <strong>暂无历史记录</strong>
            <p>生成结果后会自动保存到这里</p>
          </div>
        ) : (
          <div className="history-masonry">
            {historyItems.map((item) => {
              const isCopied = copiedHistoryId === item.id;
              const isEditing = editingCardId === item.id;
              const isEnhancer = item.sourceType === "enhancer";
              const backPreview = item.promptText || "";
              const typeLabel = getHistoryTypeLabel(item);
              const ar = item.aspectRatio;
              const isPortrait = ar != null && ar < 0.85;
              const isLandscape = ar != null && ar > 1.4;
              const cardOrientation = isPortrait
                ? " history-card--portrait"
                : isLandscape
                  ? " history-card--landscape"
                  : ar != null
                    ? " history-card--square"
                    : "";

              return (
                <article className={`history-card${cardOrientation}${isEditing ? " is-editing" : ""}`} key={item.id}>
                  {isEditing ? (
                    <div className="history-card-edit-view">
                      <div className="history-card-edit-top">
                        {item.thumbnailDataUrl ? (
                          <div className="history-card-edit-thumb">
                            <img src={item.thumbnailDataUrl} alt="" />
                          </div>
                        ) : (
                          <div className="history-card-edit-thumb history-card-edit-thumb--placeholder">
                            {isEnhancer ? <WandIcon /> : item.mediaType === "video" ? <VideoIcon /> : <ImageIcon />}
                          </div>
                        )}
                        <div className="history-card-edit-info">
                          <span className="history-card-type-badge">
                            {isEnhancer ? <WandIcon /> : item.mediaType === "video" ? <VideoIcon /> : <ImageIcon />}
                            {typeLabel}
                          </span>
                          <div className="history-card-date">
                            <ClockIcon />
                            {formatHistoryTime(item.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="history-card-edit-prompt">
                        <label>提示词</label>
                        <textarea
                          value={editingText}
                          onChange={(e) => onEditingTextChange(e.target.value)}
                          rows={5}
                        />
                      </div>
                      <div className="history-card-edit-actions">
                        <button
                          className={`history-card-btn ${isCopied ? "history-card-btn--copied" : ""}`}
                          title="复制"
                          onClick={onEditCopy}
                        >
                          {isCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                        <button
                          className="history-card-btn history-card-btn--close"
                          title="收起"
                          onClick={onEditClose}
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="history-card-inner">
                      <div className="history-card-front">
                        {isEnhancer ? (
                          <div className="history-card-text">
                            <p>{item.videoSummary || item.promptText}</p>
                          </div>
                        ) : item.thumbnailDataUrl ? (
                          <div className="history-card-media">
                            <img src={item.thumbnailDataUrl} alt="" loading="lazy" />
                          </div>
                        ) : (
                          <div className="history-card-text">
                            <p>{item.videoSummary || item.promptText}</p>
                          </div>
                        )}
                      </div>

                      <div className="history-card-back">
                        <div className="history-card-type-row">
                          <span className="history-card-type-badge">
                            {isEnhancer ? <WandIcon /> : item.mediaType === "video" ? <VideoIcon /> : <ImageIcon />}
                            {typeLabel}
                          </span>
                        </div>
                        <div className="history-card-date">
                          <ClockIcon />
                          {formatHistoryTime(item.createdAt)}
                        </div>
                        <p className="history-card-prompt">{backPreview}</p>
                        <div className="history-card-actions">
                          <button
                            className="history-card-btn history-card-btn--edit"
                            title="编辑"
                            onClick={(e) => { e.stopPropagation(); onEditStart(item); }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`history-card-btn ${isCopied ? "history-card-btn--copied" : ""}`}
                            title="复制"
                            onClick={(e) => { e.stopPropagation(); onCopyHistory(item); }}
                          >
                            {isCopied ? <CheckIcon /> : <CopyIcon />}
                          </button>
                          <button
                            className="history-card-btn history-card-btn--delete"
                            title="删除"
                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(item); }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
});
