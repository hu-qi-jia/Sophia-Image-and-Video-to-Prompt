import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { analyzeImageStream, analyzeVideoFrames } from "../lib/clients/aiClient";
import { extractFrames } from "../lib/media/frameExtractor";
import { readFileAsDataUrl } from "../lib/media/imageUtils";
import { createAnalysisState } from "../lib/storage";
import type { ModelProvider, StoredSettings, RuntimeMessage } from "../lib/types";
import { logError, safeRuntimeSendMessage } from "../lib/error-utils";
import { COPY_FEEDBACK_DURATION_MS } from "../lib/constants";
import {
  type TabId,
  type IVTabData,
  type PanelContextResponse,
  type StartAnalysisResponse,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  createInitialIVTabData,
  buildLocalVideoInfo,
  buildLocalImageInfo,
  createVideoElement,
  createImageElement,
  getMediaAspectRatio,
  isApiKeyRequiredState,
} from "./types";
import type { PersistHistoryOptions } from "./useHistory";

type PersistFn = (opts: PersistHistoryOptions) => Promise<void>;

export function useIVTabs(
  settings: StoredSettings,
  activeModel: ModelProvider | null,
  hasApiKey: boolean,
  persistHistoryRecord: PersistFn,
  setSubView: (v: "main" | "settings") => void,
) {
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [ivTabData, setIvTabData] = useState<Record<"image" | "video", IVTabData>>({
    image: createInitialIVTabData(),
    video: createInitialIVTabData(),
  });
  const [activeTab, setActiveTab] = useState<TabId>("image");

  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const videoFileRef = useRef<HTMLInputElement | null>(null);
  const localObjectUrlRefs = useRef<Record<"image" | "video", string | null>>({ image: null, video: null });
  const abortControllerRefs = useRef<Record<"image" | "video", AbortController | null>>({ image: null, video: null });

  function updateIVTab(tab: "image" | "video", updates: Partial<IVTabData>) {
    setIvTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], ...updates } }));
  }

  const currentIVTab: "image" | "video" = activeTab === "video" ? "video" : "image";
  const currentData = ivTabData[currentIVTab];

  const hasMedia = currentData.mediaSource.kind !== "none";
  const isAnalyzing =
    currentData.isAnalyzingLocal ||
    currentData.analysisState.phase === "detecting" ||
    currentData.analysisState.phase === "extracting" ||
    currentData.analysisState.phase === "analyzing";
  const canAnalyze = hasMedia && !isAnalyzing;
  const showCopy = currentData.resultMode === "text" && currentData.resultText.trim().length > 0;

  const displayResultText = useMemo(() => {
    if (currentData.resultMode !== "text" || !currentData.promptResult) return currentData.resultText;
    if (currentData.editedResultText !== null) return currentData.editedResultText;
    return currentData.rawResultText;
  }, [currentData.resultMode, currentData.promptResult, currentData.rawResultText, currentData.resultText, currentData.editedResultText]);

  const displayStyleText = useMemo(() => {
    if (currentData.resultMode !== "text" || !currentData.promptResult) return "";
    if (currentData.editedStyleText !== null) return currentData.editedStyleText;
    const pr = currentData.promptResult;
    if ("styleText" in pr && typeof pr.styleText === "string") return pr.styleText;
    return "";
  }, [currentData.resultMode, currentData.promptResult, currentData.editedStyleText]);

  const displayContentText = useMemo(() => {
    if (currentData.resultMode !== "text" || !currentData.promptResult) return "";
    if (currentData.editedContentText !== null) return currentData.editedContentText;
    const pr = currentData.promptResult;
    if ("contentText" in pr && typeof pr.contentText === "string") return pr.contentText;
    return "";
  }, [currentData.resultMode, currentData.promptResult, currentData.editedContentText]);

  const displayBoundText = useMemo(() => {
    if (currentData.resultMode !== "text" || !currentData.promptResult) return "";
    const pr = currentData.promptResult;
    if ("boundText" in pr && typeof pr.boundText === "string") return pr.boundText;
    return "";
  }, [currentData.resultMode, currentData.promptResult]);

  const showStyleCopy = displayStyleText.trim().length > 0;
  const showContentCopy = displayContentText.trim().length > 0;

  function syncFromBackgroundState(state: import("../lib/types").AnalysisState) {
    const shouldFocusSettings = isApiKeyRequiredState(state);
    const tab: "image" | "video" = state.mediaType === "video" ? "video" : "image";
    updateIVTab(tab, { analysisState: state });
    setSubView(shouldFocusSettings ? "settings" : "main");

    if (state.mediaType === "image" && (state.previewFrameUrl || state.imageInfo)) {
      updateIVTab(tab, { mediaSource: { kind: "web-image", previewUrl: state.previewFrameUrl, imageInfo: state.imageInfo } });
      setActiveTab("image");
    }

    if (state.phase === "generated" && state.generatedPrompt) {
      updateIVTab(tab, {
        resultMode: "text",
        resultText: state.generatedPrompt,
        rawResultText: state.rawResult ?? "",
        promptResult: state.promptResult ?? null,
        resultMediaType: state.mediaType ?? "image",
        displayFormat: "json",
        copyLabel: "复制",
        isAnalyzingLocal: false,
      });
      void persistHistoryRecord({
        sourceType: state.sourceType ?? "web",
        mediaType: state.mediaType ?? "image",
        sourceUrl: state.imageInfo?.pageUrl ?? state.imageInfo?.src,
        pageTitle: state.imageInfo?.pageTitle,
        thumbnailDataUrl: state.previewFrameUrl,
        aspectRatio: state.imageInfo?.imageWidth && state.imageInfo?.imageHeight
          ? state.imageInfo.imageWidth / state.imageInfo.imageHeight : undefined,
        promptText: state.generatedPrompt,
        videoSummary: state.mediaType === "video" ? state.videoSummary : state.imageSummary,
        promptResult: state.promptResult,
        dedupeKey: `${state.sourceType ?? "web"}:${state.mediaType ?? "image"}:${state.updatedAt}:${state.generatedPrompt}`,
      });
      return;
    }

    if (state.phase === "error") {
      if (shouldFocusSettings) { resetIVTabResult(tab); updateIVTab(tab, { isAnalyzingLocal: false }); return; }
      updateIVTab(tab, { resultMode: "error", resultText: state.errorMessage ?? state.statusText, isAnalyzingLocal: false });
      return;
    }

    if (state.phase === "detecting" || state.phase === "extracting" || state.phase === "analyzing") {
      const streamText = state.streamProgress;
      updateIVTab(tab, { resultMode: "loading", resultText: streamText || "正在识别中...", streamText: streamText || "" });
      return;
    }

    if (state.phase === "ready" && !state.generatedPrompt) {
      resetIVTabResult(tab);
    }
  }

  function resetIVTabResult(tab: "image" | "video") {
    updateIVTab(tab, {
      resultMode: "empty", resultText: "结果将在此呈现", streamText: "", rawResultText: "",
      promptResult: null, copyLabel: "复制", styleCopyLabel: "复制", contentCopyLabel: "复制",
      editedResultText: null, editedStyleText: null,
      editedContentText: null, copyAllLabel: "复制全部", isExpanded: false,
    });
  }

  async function handleAnalyze() {
    if (!hasApiKey) { setSubView("settings"); return; }
    if (!hasMedia || isAnalyzing) return;

    const tab = currentIVTab;
    const mediaSrc = ivTabData[tab].mediaSource;
    resetIVTabResult(tab);
    updateIVTab(tab, { resultMode: "loading", resultText: "正在识别中...", isAnalyzingLocal: true, streamText: "" });

    const controller = new AbortController();
    abortControllerRefs.current[tab] = controller;

    if (mediaSrc.kind === "web-image") {
      try {
        const response = await safeRuntimeSendMessage<StartAnalysisResponse>({
          type: "VIDEO2PROMPT_START_ANALYSIS", tabId: activeTabId ?? undefined,
          imageUrl: mediaSrc.imageInfo?.src, triggeredFrom: "sidePanel",
        } satisfies RuntimeMessage);
        if (response?.state) syncFromBackgroundState(response.state);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") { resetIVTabResult(tab); updateIVTab(tab, { isAnalyzingLocal: false }); return; }
        const message = error instanceof Error ? error.message : "无法分析此图片，请重试。";
        updateIVTab(tab, { analysisState: createAnalysisState(activeTabId, "error", message, settings.targetModel, { errorMessage: message }), resultMode: "error", resultText: message, isAnalyzingLocal: false });
      } finally {
        abortControllerRefs.current[tab] = null;
      }
      return;
    }

    if (mediaSrc.kind === "local-video") {
      try {
        const video = await createVideoElement(mediaSrc.objectUrl);
        const videoInfo = buildLocalVideoInfo(video, mediaSrc.fileName);
        const frames = await extractFrames(video, { mode: settings.frameSamplingMode });
        const result = await analyzeVideoFrames({
          apiKey: activeModel!.apiKey, baseUrl: activeModel!.baseUrl, modelName: activeModel!.modelName,
          providerType: activeModel!.providerType, targetModel: settings.targetModel, frames, videoInfo, signal: controller.signal,
        });
        const generatedState = createAnalysisState(activeTabId, "generated", "识别完成", settings.targetModel, {
          mediaType: "video", sourceType: "local", videoInfo, previewFrameUrl: frames[0]?.dataUrl, keyframeCount: frames.length,
          ...result, promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse | undefined,
        });
        updateIVTab(tab, {
          mediaSource: { kind: "local-video", objectUrl: mediaSrc.objectUrl, fileName: mediaSrc.fileName, videoInfo },
          analysisState: generatedState, resultMode: "text", resultText: result.generatedPrompt,
          rawResultText: result.rawResult, promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          resultMediaType: "video", displayFormat: "json", isAnalyzingLocal: false,
        });
        await persistHistoryRecord({
          sourceType: "local", mediaType: "video", sourceUrl: videoInfo.src, pageTitle: videoInfo.pageTitle,
          thumbnailDataUrl: frames[0]?.dataUrl, aspectRatio: videoInfo.videoWidth && videoInfo.videoHeight
            ? videoInfo.videoWidth / videoInfo.videoHeight : undefined,
          promptText: result.generatedPrompt, videoSummary: result.videoSummary,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          dedupeKey: `local:${generatedState.updatedAt}:${result.generatedPrompt}`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") { resetIVTabResult(tab); updateIVTab(tab, { isAnalyzingLocal: false }); return; }
        const message = error instanceof Error ? error.message : "无法从该视频提取帧。";
        updateIVTab(tab, { analysisState: createAnalysisState(activeTabId, "error", message, settings.targetModel, { errorMessage: message }), resultMode: "error", resultText: message, isAnalyzingLocal: false });
      } finally { abortControllerRefs.current[tab] = null; }
    }

    if (mediaSrc.kind === "local-image") {
      updateIVTab(tab, { streamText: "" });
      try {
        const [image, imageDataUrl] = await Promise.all([createImageElement(mediaSrc.objectUrl), readFileAsDataUrl(mediaSrc.file)]);
        const imageInfo = buildLocalImageInfo(image, mediaSrc.fileName);
        const result = await analyzeImageStream({
          apiKey: activeModel!.apiKey, baseUrl: activeModel!.baseUrl, modelName: activeModel!.modelName,
          providerType: activeModel!.providerType, targetModel: settings.targetModel, imageDataUrl, imageInfo,
          signal: controller.signal, onProgress: (text: string) => { updateIVTab(tab, { streamText: text, resultText: text }); },
        });
        const generatedState = createAnalysisState(activeTabId, "generated", "识别完成", settings.targetModel, {
          mediaType: "image", sourceType: "local", imageInfo, previewFrameUrl: imageDataUrl,
          ...result, promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse | undefined,
        });
        updateIVTab(tab, {
          mediaSource: { kind: "local-image", objectUrl: mediaSrc.objectUrl, fileName: mediaSrc.fileName, file: mediaSrc.file, imageInfo },
          analysisState: generatedState, resultMode: "text", resultText: result.generatedPrompt,
          rawResultText: result.rawResult, promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          resultMediaType: "image", displayFormat: "json", isAnalyzingLocal: false,
        });
        await persistHistoryRecord({
          sourceType: "local", mediaType: "image", sourceUrl: imageInfo.src, pageTitle: imageInfo.pageTitle,
          thumbnailDataUrl: imageDataUrl, aspectRatio: imageInfo.imageWidth && imageInfo.imageHeight
            ? imageInfo.imageWidth / imageInfo.imageHeight : undefined,
          promptText: result.generatedPrompt, videoSummary: result.imageSummary,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          dedupeKey: `local:image:${generatedState.updatedAt}:${result.generatedPrompt}`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") { resetIVTabResult(tab); updateIVTab(tab, { isAnalyzingLocal: false }); return; }
        const message = error instanceof Error ? error.message : "无法分析此图片，请尝试其他文件。";
        updateIVTab(tab, { analysisState: createAnalysisState(activeTabId, "error", message, settings.targetModel, { mediaType: "image", sourceType: "local", errorMessage: message }), resultMode: "error", resultText: message, isAnalyzingLocal: false });
      } finally { abortControllerRefs.current[tab] = null; }
    }
  }

  async function handleClear() {
    if (isAnalyzing) return;
    const tab = currentIVTab;
    if (localObjectUrlRefs.current[tab]) { URL.revokeObjectURL(localObjectUrlRefs.current[tab]!); localObjectUrlRefs.current[tab] = null; }
    if (activeTabId) await safeRuntimeSendMessage({ type: "VIDEO2PROMPT_CLEAR_ACTIVE_ANALYSIS", tabId: activeTabId } satisfies RuntimeMessage);
    updateIVTab(tab, { mediaSource: { kind: "none" }, analysisState: createAnalysisState(activeTabId, "idle", "结果将在此呈现", settings.targetModel), uploadError: null });
    resetIVTabResult(tab);
  }

  function handleAbort() {
    const tab = currentIVTab;
    if (abortControllerRefs.current[tab]) { abortControllerRefs.current[tab]!.abort(); abortControllerRefs.current[tab] = null; }
  }

  function handleUploadClick() {
    updateIVTab(currentIVTab, { uploadError: null });
    if (activeTab === "image") imageFileRef.current?.click();
    else if (activeTab === "video") videoFileRef.current?.click();
  }

  async function loadLocalFile(file: File, tab: "image" | "video") {
    if (localObjectUrlRefs.current[tab]) URL.revokeObjectURL(localObjectUrlRefs.current[tab]!);
    const objectUrl = URL.createObjectURL(file);
    localObjectUrlRefs.current[tab] = objectUrl;

    if (file.type.startsWith("image/")) {
      const image = await createImageElement(objectUrl);
      const imageInfo = buildLocalImageInfo(image, file.name);
      updateIVTab(tab, { mediaSource: { kind: "local-image", objectUrl, fileName: file.name, file, imageInfo }, analysisState: createAnalysisState(activeTabId, "ready", "图片已就绪", settings.targetModel, { mediaType: "image", sourceType: "local", imageInfo, previewFrameUrl: objectUrl }) });
    } else {
      const video = await createVideoElement(objectUrl);
      const videoInfo = buildLocalVideoInfo(video, file.name);
      updateIVTab(tab, { mediaSource: { kind: "local-video", objectUrl, fileName: file.name, videoInfo }, analysisState: createAnalysisState(activeTabId, "ready", "视频已就绪", settings.targetModel, { mediaType: "video", sourceType: "local", videoInfo }) });
    }
    resetIVTabResult(tab);
  }

  async function handleLocalUpload(event: ChangeEvent<HTMLInputElement>, expectedType: "image" | "video") {
    const file = event.target.files?.[0];
    if (!file) return;
    const tab = expectedType;
    if (expectedType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) { updateIVTab(tab, { uploadError: "请上传图片文件（JPG / PNG / WebP / GIF / BMP / SVG）" }); event.target.value = ""; return; }
    if (expectedType === "video" && !ALLOWED_VIDEO_TYPES.has(file.type)) { updateIVTab(tab, { uploadError: "请上传视频文件（MP4 / WebM / OGG / MOV / AVI）" }); event.target.value = ""; return; }
    updateIVTab(tab, { uploadError: null });
    await loadLocalFile(file, tab);
    event.target.value = "";
  }

  async function handleFileDrop(file: File, expectedType: "image" | "video") {
    const tab = expectedType;
    updateIVTab(tab, { uploadError: null });
    if (expectedType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) { updateIVTab(tab, { uploadError: "请上传图片文件（JPG / PNG / WebP / GIF / BMP / SVG）" }); return; }
    if (expectedType === "video" && !ALLOWED_VIDEO_TYPES.has(file.type)) { updateIVTab(tab, { uploadError: "请上传视频文件（MP4 / WebM / OGG / MOV / AVI）" }); return; }
    await loadLocalFile(file, tab);
  }

  async function handleCopy() {
    if (!showCopy) return;
    const tab = currentIVTab;
    const data = ivTabData[tab];
    const textToCopy = data.editedResultText !== null ? data.editedResultText : displayResultText;
    try { await navigator.clipboard.writeText(textToCopy); updateIVTab(tab, { copyLabel: "已复制" }); window.setTimeout(() => updateIVTab(tab, { copyLabel: "复制" }), COPY_FEEDBACK_DURATION_MS); } catch (error) { logError("handleCopy", error); updateIVTab(tab, { copyLabel: "复制" }); }
  }

  async function handleCopyStyle() {
    if (!displayStyleText.trim()) return;
    try { await navigator.clipboard.writeText(displayStyleText); updateIVTab(currentIVTab, { styleCopyLabel: "已复制" }); window.setTimeout(() => updateIVTab(currentIVTab, { styleCopyLabel: "复制" }), COPY_FEEDBACK_DURATION_MS); } catch (error) { logError("handleCopyStyle", error); }
  }

  async function handleCopyContent() {
    if (!displayContentText.trim()) return;
    try { await navigator.clipboard.writeText(displayContentText); updateIVTab(currentIVTab, { contentCopyLabel: "已复制" }); window.setTimeout(() => updateIVTab(currentIVTab, { contentCopyLabel: "复制" }), COPY_FEEDBACK_DURATION_MS); } catch (error) { logError("handleCopyContent", error); }
  }

  async function handleCopyAll() {
    const combined = [displayStyleText, displayContentText, displayBoundText].filter(Boolean).join("\n\n");
    if (!combined.trim()) return;
    try { await navigator.clipboard.writeText(combined); updateIVTab(currentIVTab, { copyAllLabel: "已复制" }); window.setTimeout(() => updateIVTab(currentIVTab, { copyAllLabel: "复制全部" }), COPY_FEEDBACK_DURATION_MS); } catch (error) { logError("handleCopyAll", error); }
  }

  function handleTabChange(tab: TabId) { setActiveTab(tab); setSubView("main"); }

  const currentMediaPreview = useMemo(() => {
    const ms = currentData.mediaSource;
    if (ms.kind === "web-image" && ms.previewUrl) return <img src={ms.previewUrl} alt="图片预览" className="video-preview-media" />;
    if (ms.kind === "local-video") return <video className="video-preview-media" src={ms.objectUrl} muted playsInline preload="metadata" />;
    if (ms.kind === "local-image") return <img src={ms.objectUrl} alt="图片预览" className="video-preview-media" />;
    if (ms.kind === "web-image") return <div className="video-preview-placeholder" />;
    return null;
  }, [currentData.mediaSource]);

  const currentMediaAspectRatio = useMemo(() => getMediaAspectRatio(currentData.mediaSource), [currentData.mediaSource]);

  return {
    activeTabId, setActiveTabId, ivTabData, activeTab, setActiveTab, currentIVTab, currentData,
    imageFileRef, videoFileRef, localObjectUrlRefs, abortControllerRefs,
    hasMedia, isAnalyzing, canAnalyze, showCopy,
    displayResultText, displayStyleText, displayContentText, displayBoundText,
    showStyleCopy, showContentCopy,
    currentMediaPreview, currentMediaAspectRatio,
    updateIVTab, resetIVTabResult, syncFromBackgroundState,
    handleAnalyze, handleClear, handleAbort, handleUploadClick, handleLocalUpload, handleFileDrop,
    handleCopy, handleCopyStyle, handleCopyContent, handleCopyAll, handleTabChange,
  };
}
