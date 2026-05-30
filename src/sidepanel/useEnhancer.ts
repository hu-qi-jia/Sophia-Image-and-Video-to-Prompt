import { useRef, useState } from "react";
import { enhancePrompt } from "../lib/clients/aiClient";
import type { ModelProvider } from "../lib/types";
import type { PersistHistoryOptions } from "./useHistory";
import { logError } from "../lib/error-utils";
import { COPY_FEEDBACK_DURATION_MS } from "../lib/constants";

type PersistFn = (opts: PersistHistoryOptions) => Promise<void>;

export function useEnhancer(
  activeModel: ModelProvider | null,
  hasApiKey: boolean,
  persistHistoryRecord: PersistFn,
  setSubView: (v: "main" | "settings") => void,
) {
  const [enhancerMode, setEnhancerMode] = useState<"video" | "image">("video");
  const [enhancerInput, setEnhancerInput] = useState("");
  const [enhancerResultMode, setEnhancerResultMode] = useState<"empty" | "loading" | "text" | "error">("empty");
  const [enhancerResultText, setEnhancerResultText] = useState("增强结果将在此呈现");
  const [enhancerCopyLabel, setEnhancerCopyLabel] = useState("复制");
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const enhancerAbortRef = useRef<AbortController | null>(null);

  const canEnhancePrompt = enhancerInput.trim().length > 0 && !isEnhancingPrompt;
  const showEnhancerCopy = enhancerResultMode === "text" && enhancerResultText.trim().length > 0;

  function resetEnhancerResult() {
    setEnhancerResultMode("empty");
    setEnhancerResultText("增强结果将在此呈现");
    setEnhancerCopyLabel("复制");
  }

  async function handleEnhancePrompt() {
    if (!enhancerInput.trim() || isEnhancingPrompt) return;
    if (!hasApiKey) { setSubView("settings"); return; }

    setIsEnhancingPrompt(true);
    setEnhancerResultMode("loading");
    setEnhancerResultText("正在增强中...");
    setEnhancerCopyLabel("复制");

    const controller = new AbortController();
    enhancerAbortRef.current = controller;

    try {
      const result = await enhancePrompt({
        apiKey: activeModel!.apiKey, baseUrl: activeModel!.baseUrl, modelName: activeModel!.modelName,
        providerType: activeModel!.providerType, mode: enhancerMode, idea: enhancerInput, signal: controller.signal,
      });
      setEnhancerResultMode("text");
      setEnhancerResultText(result);
      await persistHistoryRecord({
        sourceType: "enhancer", mediaType: enhancerMode, sourceUrl: `prompt-enhancer://${enhancerMode}`,
        pageTitle: enhancerMode === "video" ? "视频提示词增强" : "图片提示词增强",
        promptText: result, videoSummary: enhancerInput.trim(), dedupeKey: `enhancer:${enhancerMode}:${result}`,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") { resetEnhancerResult(); return; }
      setEnhancerResultMode("error");
      setEnhancerResultText(error instanceof Error ? error.message : "无法增强此提示词，请重试。");
    } finally {
      setIsEnhancingPrompt(false);
      enhancerAbortRef.current = null;
    }
  }

  function handleAbortEnhancer() {
    if (enhancerAbortRef.current) { enhancerAbortRef.current.abort(); enhancerAbortRef.current = null; }
  }

  async function handleCopyEnhancerResult() {
    if (!showEnhancerCopy) return;
    try { await navigator.clipboard.writeText(enhancerResultText); setEnhancerCopyLabel("已复制"); window.setTimeout(() => setEnhancerCopyLabel("复制"), COPY_FEEDBACK_DURATION_MS); } catch (error) { logError("handleCopyEnhancerResult", error); setEnhancerCopyLabel("复制"); }
  }

  return {
    enhancerMode, setEnhancerMode, enhancerInput, setEnhancerInput,
    enhancerResultMode, enhancerResultText, enhancerCopyLabel, isEnhancingPrompt,
    canEnhancePrompt, showEnhancerCopy,
    resetEnhancerResult, handleEnhancePrompt, handleAbortEnhancer, handleCopyEnhancerResult,
  };
}
