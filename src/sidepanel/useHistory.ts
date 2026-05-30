import { useRef, useState } from "react";
import { deletePromptHistoryItem, savePromptHistoryItem } from "../lib/storage";
import type { PromptHistoryItem } from "../lib/types";
import { compressThumbnailDataUrl, createHistoryId } from "./types";
import { logError } from "../lib/error-utils";
import { COPY_FEEDBACK_DURATION_MS } from "../lib/constants";

export interface PersistHistoryOptions {
  sourceType: string;
  mediaType: "image" | "video";
  sourceUrl?: string;
  pageTitle?: string;
  thumbnailDataUrl?: string;
  aspectRatio?: number;
  promptText: string;
  videoSummary?: string;
  promptResult?: unknown;
  dedupeKey: string;
}

export function useHistory() {
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const lastSavedHistoryKeyRef = useRef<string | null>(null);

  async function persistHistoryRecord(options: PersistHistoryOptions) {
    if (!options.promptText.trim() || lastSavedHistoryKeyRef.current === options.dedupeKey) return;
    lastSavedHistoryKeyRef.current = options.dedupeKey;
    const nextHistory = await savePromptHistoryItem({
      id: createHistoryId(),
      createdAt: Date.now(),
      sourceType: options.sourceType as "web" | "local" | "enhancer",
      mediaType: options.mediaType,
      sourceUrl: options.sourceUrl,
      pageTitle: options.pageTitle,
      thumbnailDataUrl: await compressThumbnailDataUrl(options.thumbnailDataUrl),
      aspectRatio: options.aspectRatio,
      promptText: options.promptText,
      videoSummary: options.videoSummary,
      promptResult: options.promptResult as PromptHistoryItem["promptResult"],
    });
    setHistoryItems(nextHistory);
  }

  function getHistoryCopyText(item: PromptHistoryItem): string {
    return item.promptResult ? JSON.stringify(item.promptResult, null, 2) : item.promptText;
  }

  function getHistoryTypeLabel(item: PromptHistoryItem): string {
    if (item.sourceType === "enhancer") return "提示词增强";
    if (item.mediaType === "video") return "视频识词";
    return "图片识词";
  }

  async function handleCopyHistory(item: PromptHistoryItem) {
    try {
      await navigator.clipboard.writeText(getHistoryCopyText(item));
      setCopiedHistoryId(item.id);
      window.setTimeout(() => setCopiedHistoryId((c) => (c === item.id ? null : c)), COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      logError("handleCopyHistory", error);
      setCopiedHistoryId(null);
    }
  }

  async function handleDeleteHistory(item: PromptHistoryItem) {
    setHistoryItems(await deletePromptHistoryItem(item.id));
  }

  function handleEditStart(item: PromptHistoryItem) {
    setEditingCardId(item.id);
    setEditingText(getHistoryCopyText(item));
  }

  function handleEditClose() {
    setEditingCardId(null);
    setEditingText("");
  }

  async function handleEditCopy() {
    try {
      await navigator.clipboard.writeText(editingText);
      setCopiedHistoryId("edit");
      window.setTimeout(() => setCopiedHistoryId((c) => (c === "edit" ? null : c)), COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      logError("handleEditCopy", error);
    }
  }

  return {
    historyItems,
    setHistoryItems,
    copiedHistoryId,
    editingCardId,
    editingText,
    setEditingText,
    persistHistoryRecord,
    getHistoryTypeLabel,
    handleCopyHistory,
    handleDeleteHistory,
    handleEditStart,
    handleEditClose,
    handleEditCopy,
  };
}
