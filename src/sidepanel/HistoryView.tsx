import { memo, useState } from "react";
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

type PromptTab = "all" | "style" | "content";

function getPromptTabContent(item: PromptHistoryItem, tab: PromptTab): string {
  const result = item.promptResult as Record<string, unknown> | undefined;
  const styleText = (result?.styleText as string) || "";
  const contentText = (result?.contentText as string) || "";
  const boundText = (result?.boundText as string) || "";

  if (tab === "style") return styleText || "暂无风格描述";
  if (tab === "content") return contentText || "暂无内容描述";
  // 全部：风格描述 + 内容描述 + 绑定特征
  return [styleText, contentText, boundText].filter(Boolean).join("\n\n") || item.promptText || "";
}

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
              return (
                <HistoryCard
                  key={item.id}
                  item={item}
                  isCopied={copiedHistoryId === item.id}
                  isEditing={editingCardId === item.id}
                  isEnhancer={item.sourceType === "enhancer"}
                  typeLabel={getHistoryTypeLabel(item)}
                  cardOrientation={
                    item.aspectRatio != null && item.aspectRatio < 0.85
                      ? " history-card--portrait"
                      : item.aspectRatio != null && item.aspectRatio > 1.4
                        ? " history-card--landscape"
                        : item.aspectRatio != null
                          ? " history-card--square"
                          : ""
                  }
                  onEditStart={onEditStart}
                  onCopyHistory={onCopyHistory}
                  onDeleteHistory={onDeleteHistory}
                  onEditClose={onEditClose}
                  onEditCopy={onEditCopy}
                  editingText={editingText}
                  onEditingTextChange={onEditingTextChange}
                />
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
});

interface HistoryCardProps {
  item: PromptHistoryItem;
  isCopied: boolean;
  isEditing: boolean;
  isEnhancer: boolean;
  typeLabel: string;
  cardOrientation: string;
  onEditStart: (item: PromptHistoryItem) => void;
  onCopyHistory: (item: PromptHistoryItem) => void;
  onDeleteHistory: (item: PromptHistoryItem) => void;
  onEditClose: () => void;
  onEditCopy: () => void;
  editingText: string;
  onEditingTextChange: (val: string) => void;
}

const PROMPT_TABS: { key: PromptTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "style", label: "风格描述" },
  { key: "content", label: "内容描述" },
];

const HistoryCard = memo(function HistoryCard({
  item,
  isCopied,
  isEditing,
  isEnhancer,
  typeLabel,
  cardOrientation,
  onEditStart,
  onCopyHistory,
  onDeleteHistory,
  onEditClose,
  onEditCopy,
  editingText,
  onEditingTextChange,
}: HistoryCardProps) {
  const [activeTab, setActiveTab] = useState<PromptTab>("all");

  return (
    <article className={`history-card${cardOrientation}${isEditing ? " is-editing" : ""}`}>
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
            <div className="history-card-tabs">
              {PROMPT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`history-card-tab${activeTab === tab.key ? " is-active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab.key); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="history-card-prompt">{getPromptTabContent(item, activeTab)}</p>
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
});
