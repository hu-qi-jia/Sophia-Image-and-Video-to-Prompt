import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { analyzeImageStream, analyzeVideoFrames, enhancePrompt } from "../lib/clients/aiClient";
import { extractFrames } from "../lib/media/frameExtractor";
import { readFileAsDataUrl } from "../lib/media/imageUtils";
import {
  createAnalysisState,
  defaultSettings,
  deleteModel,
  deletePromptHistoryItem,
  getActiveModel,
  getPromptHistory,
  getSettings,
  saveFrameSamplingMode,
  saveModels,
  savePromptHistoryItem,
  setActiveModel,
  setPanelMode,
} from "../lib/storage";
import type {
  // ImageCategory,
  ModelProvider,
  PanelMode,
  PromptHistoryItem,
  StoredSettings,
  RuntimeMessage,
} from "../lib/types";
import {
  type TabId,
  type SubView,
  type IVTabData,
  type MediaSource,
  type PanelContextResponse,
  type StartAnalysisResponse,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  createInitialIVTabData,
  buildLocalVideoInfo,
  buildLocalImageInfo,
  createVideoElement,
  createImageElement,
  compressThumbnailDataUrl,
  createHistoryId,
  isApiKeyRequiredState,
  getMediaAspectRatio,
} from "./types";

export function useAppState() {
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [ivTabData, setIvTabData] = useState<Record<"image" | "video", IVTabData>>({
    image: createInitialIVTabData(),
    video: createInitialIVTabData(),
  });
  const [activeTab, setActiveTab] = useState<TabId>("image");
  const [subView, setSubView] = useState<SubView>("main");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [enhancerMode, setEnhancerMode] = useState<"video" | "image">("video");
  const [enhancerInput, setEnhancerInput] = useState("");
  const [enhancerResultMode, setEnhancerResultMode] = useState<"empty" | "loading" | "text" | "error">("empty");
  const [enhancerResultText, setEnhancerResultText] = useState("增强结果将在此呈现");
  const [enhancerCopyLabel, setEnhancerCopyLabel] = useState("复制");
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const videoFileRef = useRef<HTMLInputElement | null>(null);
  const localObjectUrlRefs = useRef<Record<"image" | "video", string | null>>({ image: null, video: null });
  const abortControllerRefs = useRef<Record<"image" | "video", AbortController | null>>({ image: null, video: null });
  const enhancerAbortRef = useRef<AbortController | null>(null);
  const lastSavedHistoryKeyRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  function updateIVTab(tab: "image" | "video", updates: Partial<IVTabData>) {
    setIvTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], ...updates } }));
  }

  const currentIVTab: "image" | "video" = activeTab === "video" ? "video" : "image";
  const currentData = ivTabData[currentIVTab];

  const activeModel = getActiveModel(settings);
  const hasApiKey = activeModel !== null
    && activeModel.apiKey.trim().length > 0
    && activeModel.modelName.trim().length > 0
    && (activeModel.providerType === "gemini" || activeModel.baseUrl.trim().length > 0);
  const hasMedia = currentData.mediaSource.kind !== "none";
  const isAnalyzing =
    currentData.isAnalyzingLocal ||
    currentData.analysisState.phase === "detecting" ||
    currentData.analysisState.phase === "extracting" ||
    currentData.analysisState.phase === "analyzing";
  const canAnalyze = hasMedia && !isAnalyzing;
  const showCopy = currentData.resultMode === "text" && currentData.resultText.trim().length > 0;
  const canEnhancePrompt = enhancerInput.trim().length > 0 && !isEnhancingPrompt;
  const showEnhancerCopy = enhancerResultMode === "text" && enhancerResultText.trim().length > 0;

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

  const showStyleCopy = displayStyleText.trim().length > 0;
  const showContentCopy = displayContentText.trim().length > 0;

  useEffect(() => {
    void (async () => {
      const [nextSettings, nextHistory] = await Promise.all([getSettings(), getPromptHistory()]);
      setSettings(nextSettings);
      setHistoryItems(nextHistory);

      const context = (await chrome.runtime.sendMessage({
        type: "VIDEO2PROMPT_GET_PANEL_CONTEXT",
      } satisfies RuntimeMessage)) as PanelContextResponse;

      setActiveTabId(context.activeTabId);
      if (context.state) {
        syncFromBackgroundState(context.state);
      } else {
        resetIVTabResult("image");
        resetIVTabResult("video");
      }
    })();

    const handleMessage = (message: RuntimeMessage) => {
      if (message.type === "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED") {
        syncFromBackgroundState(message.state);
        if (message.state.tabId) setActiveTabId(message.state.tabId);
        return;
      }
      if (message.type === "VIDEO2PROMPT_FOCUS_API_KEY") {
        setSubView("settings");
      }
    };

    const handleStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;
      if (changes["video2prompt:settings"]) {
        const next = changes["video2prompt:settings"].newValue as Partial<StoredSettings> | undefined;
        const merged = { ...defaultSettings, ...(next ?? {}) };
        setSettings(merged);
      }
      if (changes["video2prompt:history"]) {
        setHistoryItems((changes["video2prompt:history"].newValue as PromptHistoryItem[] | undefined) ?? []);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.storage.onChanged.addListener(handleStorageChanged);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChanged);
      for (const tab of ["image", "video"] as const) {
        if (localObjectUrlRefs.current[tab]) {
          URL.revokeObjectURL(localObjectUrlRefs.current[tab]!);
          localObjectUrlRefs.current[tab] = null;
        }
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    setStatusMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setStatusMessage(null), 1800);
  }

  async function persistHistoryRecord(options: {
    sourceType: string;
    mediaType: "image" | "video";
    sourceUrl?: string;
    pageTitle?: string;
    thumbnailDataUrl?: string;
    promptText: string;
    videoSummary?: string;
    promptResult?: unknown;
    dedupeKey: string;
  }) {
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
      promptText: options.promptText,
      videoSummary: options.videoSummary,
      promptResult: options.promptResult as PromptHistoryItem["promptResult"],
    });
    setHistoryItems(nextHistory);
  }

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
      });
      void persistHistoryRecord({
        sourceType: state.sourceType ?? "web",
        mediaType: state.mediaType ?? "image",
        sourceUrl: state.imageInfo?.pageUrl ?? state.imageInfo?.src,
        pageTitle: state.imageInfo?.pageTitle,
        thumbnailDataUrl: state.previewFrameUrl,
        promptText: state.generatedPrompt,
        videoSummary: state.mediaType === "video" ? state.videoSummary : state.imageSummary,
        promptResult: state.promptResult,
        dedupeKey: `${state.sourceType ?? "web"}:${state.mediaType ?? "image"}:${state.updatedAt}:${state.generatedPrompt}`,
      });
      return;
    }

    if (state.phase === "error") {
      if (shouldFocusSettings) {
        resetIVTabResult(tab);
        return;
      }
      updateIVTab(tab, { resultMode: "error", resultText: state.errorMessage ?? state.statusText });
      return;
    }

    if (state.phase === "detecting" || state.phase === "extracting" || state.phase === "analyzing") {
      const streamText = state.streamProgress;
      updateIVTab(tab, {
        resultMode: "loading",
        resultText: streamText || "正在识别中...",
        streamText: streamText || "",
      });
      return;
    }

    if (state.phase === "ready" && !state.generatedPrompt) {
      resetIVTabResult(tab);
    }
  }

  function resetIVTabResult(tab: "image" | "video") {
    updateIVTab(tab, {
      resultMode: "empty",
      resultText: "结果将在此呈现",
      streamText: "",
      rawResultText: "",
      promptResult: null,
      copyLabel: "复制",
      editedResultText: null,
      editedStyleText: null,
      editedContentText: null,
      copyAllLabel: "复制全部",
      isExpanded: false,
    });
  }

  async function handleAnalyze() {
    if (!hasApiKey) {
      setSubView("settings");
      return;
    }
    if (!hasMedia || isAnalyzing) return;

    const tab = currentIVTab;
    const mediaSrc = ivTabData[tab].mediaSource;

    resetIVTabResult(tab);
    updateIVTab(tab, { resultMode: "loading", resultText: "正在识别中..." });

    const controller = new AbortController();
    abortControllerRefs.current[tab] = controller;

    if (mediaSrc.kind === "web-image") {
      const response = (await chrome.runtime.sendMessage({
        type: "VIDEO2PROMPT_START_ANALYSIS",
        tabId: activeTabId ?? undefined,
        imageUrl: mediaSrc.imageInfo?.src,
        triggeredFrom: "sidePanel",
      } satisfies RuntimeMessage)) as StartAnalysisResponse;
      if (response?.state) syncFromBackgroundState(response.state);
      abortControllerRefs.current[tab] = null;
      return;
    }

    if (mediaSrc.kind === "local-video") {
      updateIVTab(tab, { isAnalyzingLocal: true });
      try {
        const video = await createVideoElement(mediaSrc.objectUrl);
        const videoInfo = buildLocalVideoInfo(video, mediaSrc.fileName);
        const frames = await extractFrames(video, { mode: settings.frameSamplingMode });
        const result = await analyzeVideoFrames({
          apiKey: activeModel!.apiKey,
          baseUrl: activeModel!.baseUrl,
          modelName: activeModel!.modelName,
          providerType: activeModel!.providerType,
          targetModel: settings.targetModel,
          frames,
          videoInfo,
          signal: controller.signal,
        });
        const generatedState = createAnalysisState(activeTabId, "generated", "识别完成", settings.targetModel, {
          mediaType: "video",
          sourceType: "local",
          videoInfo,
          previewFrameUrl: frames[0]?.dataUrl,
          keyframeCount: frames.length,
          ...result,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse | undefined,
        });
        updateIVTab(tab, {
          mediaSource: { kind: "local-video", objectUrl: mediaSrc.objectUrl, fileName: mediaSrc.fileName, videoInfo },
          analysisState: generatedState,
          resultMode: "text",
          resultText: result.generatedPrompt,
          rawResultText: result.rawResult,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          resultMediaType: "video",
          displayFormat: "json",
          isAnalyzingLocal: false,
        });
        await persistHistoryRecord({
          sourceType: "local",
          mediaType: "video",
          sourceUrl: videoInfo.src,
          pageTitle: videoInfo.pageTitle,
          thumbnailDataUrl: frames[0]?.dataUrl,
          promptText: result.generatedPrompt,
          videoSummary: result.videoSummary,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          dedupeKey: `local:${generatedState.updatedAt}:${result.generatedPrompt}`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          resetIVTabResult(tab);
          updateIVTab(tab, { isAnalyzingLocal: false });
          return;
        }
        const message = error instanceof Error ? error.message : "无法从该视频提取帧。";
        updateIVTab(tab, {
          analysisState: createAnalysisState(activeTabId, "error", message, settings.targetModel, { errorMessage: message }),
          resultMode: "error",
          resultText: message,
          isAnalyzingLocal: false,
        });
      } finally {
        abortControllerRefs.current[tab] = null;
      }
    }

    if (mediaSrc.kind === "local-image") {
      updateIVTab(tab, { isAnalyzingLocal: true, streamText: "" });
      try {
        const [image, imageDataUrl] = await Promise.all([
          createImageElement(mediaSrc.objectUrl),
          readFileAsDataUrl(mediaSrc.file),
        ]);
        const imageInfo = buildLocalImageInfo(image, mediaSrc.fileName);
        const result = await analyzeImageStream({
          apiKey: activeModel!.apiKey,
          baseUrl: activeModel!.baseUrl,
          modelName: activeModel!.modelName,
          providerType: activeModel!.providerType,
          targetModel: settings.targetModel,
          imageDataUrl,
          imageInfo,
          // category: "auto" /* ivTabData[tab].selectedCategory */,
          signal: controller.signal,
          onProgress: (text: string) => {
            updateIVTab(tab, { streamText: text, resultText: text });
          },
        });
        const generatedState = createAnalysisState(activeTabId, "generated", "识别完成", settings.targetModel, {
          mediaType: "image",
          sourceType: "local",
          imageInfo,
          previewFrameUrl: imageDataUrl,
          ...result,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse | undefined,
        });
        updateIVTab(tab, {
          mediaSource: { kind: "local-image", objectUrl: mediaSrc.objectUrl, fileName: mediaSrc.fileName, file: mediaSrc.file, imageInfo },
          analysisState: generatedState,
          resultMode: "text",
          resultText: result.generatedPrompt,
          rawResultText: result.rawResult,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          resultMediaType: "image",
          displayFormat: "json",
          isAnalyzingLocal: false,
        });
        await persistHistoryRecord({
          sourceType: "local",
          mediaType: "image",
          sourceUrl: imageInfo.src,
          pageTitle: imageInfo.pageTitle,
          thumbnailDataUrl: imageDataUrl,
          promptText: result.generatedPrompt,
          videoSummary: result.imageSummary,
          promptResult: result.promptResult as import("../lib/types").GeminiPromptResponse,
          dedupeKey: `local:image:${generatedState.updatedAt}:${result.generatedPrompt}`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          resetIVTabResult(tab);
          updateIVTab(tab, { isAnalyzingLocal: false });
          return;
        }
        const message = error instanceof Error ? error.message : "无法分析此图片，请尝试其他文件。";
        updateIVTab(tab, {
          analysisState: createAnalysisState(activeTabId, "error", message, settings.targetModel, {
            mediaType: "image",
            sourceType: "local",
            errorMessage: message,
          }),
          resultMode: "error",
          resultText: message,
          isAnalyzingLocal: false,
        });
      } finally {
        abortControllerRefs.current[tab] = null;
      }
    }
  }

  async function handleClear() {
    if (isAnalyzing) return;
    const tab = currentIVTab;
    if (localObjectUrlRefs.current[tab]) {
      URL.revokeObjectURL(localObjectUrlRefs.current[tab]!);
      localObjectUrlRefs.current[tab] = null;
    }
    if (activeTabId) {
      await chrome.runtime.sendMessage({ type: "VIDEO2PROMPT_CLEAR_ACTIVE_ANALYSIS", tabId: activeTabId } satisfies RuntimeMessage);
    }
    updateIVTab(tab, {
      mediaSource: { kind: "none" },
      analysisState: createAnalysisState(activeTabId, "idle", "结果将在此呈现", settings.targetModel),
      uploadError: null,
    });
    resetIVTabResult(tab);
  }

  function handleAbort() {
    const tab = currentIVTab;
    if (abortControllerRefs.current[tab]) {
      abortControllerRefs.current[tab]!.abort();
      abortControllerRefs.current[tab] = null;
    }
  }

  function handleUploadClick() {
    updateIVTab(currentIVTab, { uploadError: null });
    if (activeTab === "image") {
      imageFileRef.current?.click();
    } else if (activeTab === "video") {
      videoFileRef.current?.click();
    }
  }

  async function loadLocalFile(file: File, tab: "image" | "video") {
    if (localObjectUrlRefs.current[tab]) URL.revokeObjectURL(localObjectUrlRefs.current[tab]!);
    const objectUrl = URL.createObjectURL(file);
    localObjectUrlRefs.current[tab] = objectUrl;

    if (file.type.startsWith("image/")) {
      const image = await createImageElement(objectUrl);
      const imageInfo = buildLocalImageInfo(image, file.name);
      updateIVTab(tab, {
        mediaSource: { kind: "local-image", objectUrl, fileName: file.name, file, imageInfo },
        analysisState: createAnalysisState(activeTabId, "ready", "图片已就绪", settings.targetModel, {
          mediaType: "image",
          sourceType: "local",
          imageInfo,
          previewFrameUrl: objectUrl,
        }),
      });
    } else {
      const video = await createVideoElement(objectUrl);
      const videoInfo = buildLocalVideoInfo(video, file.name);
      updateIVTab(tab, {
        mediaSource: { kind: "local-video", objectUrl, fileName: file.name, videoInfo },
        analysisState: createAnalysisState(activeTabId, "ready", "视频已就绪", settings.targetModel, {
          mediaType: "video",
          sourceType: "local",
          videoInfo,
        }),
      });
    }
    resetIVTabResult(tab);
  }

  async function handleLocalUpload(event: ChangeEvent<HTMLInputElement>, expectedType: "image" | "video") {
    const file = event.target.files?.[0];
    if (!file) return;

    const tab = expectedType;

    if (expectedType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      updateIVTab(tab, { uploadError: "请上传图片文件（JPG / PNG / WebP / GIF / BMP / SVG）" });
      event.target.value = "";
      return;
    }

    if (expectedType === "video" && !ALLOWED_VIDEO_TYPES.has(file.type)) {
      updateIVTab(tab, { uploadError: "请上传视频文件（MP4 / WebM / OGG / MOV / AVI）" });
      event.target.value = "";
      return;
    }

    updateIVTab(tab, { uploadError: null });
    await loadLocalFile(file, tab);
    event.target.value = "";
  }

  async function handleFileDrop(file: File, expectedType: "image" | "video") {
    const tab = expectedType;
    updateIVTab(tab, { uploadError: null });

    if (expectedType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      updateIVTab(tab, { uploadError: "请上传图片文件（JPG / PNG / WebP / GIF / BMP / SVG）" });
      return;
    }
    if (expectedType === "video" && !ALLOWED_VIDEO_TYPES.has(file.type)) {
      updateIVTab(tab, { uploadError: "请上传视频文件（MP4 / WebM / OGG / MOV / AVI）" });
      return;
    }

    await loadLocalFile(file, tab);
  }

  async function handleCopy() {
    if (!showCopy) return;
    const tab = currentIVTab;
    const data = ivTabData[tab];
    const textToCopy = data.editedResultText !== null ? data.editedResultText : displayResultText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      updateIVTab(tab, { copyLabel: "已复制" });
      window.setTimeout(() => updateIVTab(tab, { copyLabel: "复制" }), 1600);
    } catch {
      updateIVTab(tab, { copyLabel: "复制" });
    }
  }

  async function handleCopyStyle() {
    if (!displayStyleText.trim()) return;
    try {
      await navigator.clipboard.writeText(displayStyleText);
      updateIVTab(currentIVTab, { copyLabel: "已复制" });
      window.setTimeout(() => updateIVTab(currentIVTab, { copyLabel: "复制" }), 1600);
    } catch { /* ignore */ }
  }

  async function handleCopyContent() {
    if (!displayContentText.trim()) return;
    try {
      await navigator.clipboard.writeText(displayContentText);
      updateIVTab(currentIVTab, { copyLabel: "已复制" });
      window.setTimeout(() => updateIVTab(currentIVTab, { copyLabel: "复制" }), 1600);
    } catch { /* ignore */ }
  }

  async function handleCopyAll() {
    const combined = [displayStyleText, displayContentText].filter(Boolean).join("\n\n");
    if (!combined.trim()) return;
    try {
      await navigator.clipboard.writeText(combined);
      updateIVTab(currentIVTab, { copyAllLabel: "已复制" });
      window.setTimeout(() => updateIVTab(currentIVTab, { copyAllLabel: "复制全部" }), 1600);
    } catch { /* ignore */ }
  }

  function getHistoryCopyText(item: PromptHistoryItem): string {
    if (item.promptResult) {
      return JSON.stringify(item.promptResult, null, 2);
    }
    return item.promptText;
  }

  async function handleCopyHistory(item: PromptHistoryItem) {
    try {
      await navigator.clipboard.writeText(getHistoryCopyText(item));
      setCopiedHistoryId(item.id);
      window.setTimeout(() => {
        setCopiedHistoryId((current) => (current === item.id ? null : current));
      }, 1600);
    } catch {
      setCopiedHistoryId(null);
    }
  }

  function getHistoryTypeLabel(item: PromptHistoryItem): string {
    if (item.sourceType === "enhancer") return "提示词增强";
    if (item.mediaType === "video") return "视频识词";
    return "图片识词";
  }

  async function handleDeleteHistory(item: PromptHistoryItem) {
    const nextHistory = await deletePromptHistoryItem(item.id);
    setHistoryItems(nextHistory);
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
      window.setTimeout(() => {
        setCopiedHistoryId((current) => (current === "edit" ? null : current));
      }, 1600);
    } catch { /* clipboard denied */ }
  }

  async function handleSelectModel(modelId: string) {
    const nextSettings = await setActiveModel(modelId);
    setSettings(nextSettings);
    showToast("已切换模型");
  }

  async function handleAddModel(model: ModelProvider) {
    const nextModels = [...settings.models, model];
    const nextSettings = await saveModels(nextModels);
    const withActive = await setActiveModel(model.id);
    setSettings(withActive);
    showToast("模型已添加");
  }

  async function handleUpdateModel(model: ModelProvider) {
    const nextModels = settings.models.map((m) => (m.id === model.id ? model : m));
    const nextSettings = await saveModels(nextModels);
    setSettings(nextSettings);
    showToast("模型已更新");
  }

  async function handleDeleteModel(modelId: string) {
    const confirmed = window.confirm("确定删除此模型配置吗？");
    if (!confirmed) return;
    const nextSettings = await deleteModel(modelId);
    setSettings(nextSettings);
    showToast("模型已删除");
  }

  async function handlePanelModeChange(mode: PanelMode) {
    await setPanelMode(mode);
    setSettings((prev) => ({ ...prev, panelMode: mode }));
    showToast(mode === "global" ? "已切换为全局模式" : "已切换为手动模式");
  }

  async function handleFrameSamplingModeChange(mode: import("../lib/types").FrameSamplingMode) {
    if (settings.frameSamplingMode === mode) return;
    const nextSettings = await saveFrameSamplingMode(mode);
    setSettings(nextSettings);
    showToast("帧采样模式已保存");
  }

  function resetEnhancerResult() {
    setEnhancerResultMode("empty");
    setEnhancerResultText("增强结果将在此呈现");
    setEnhancerCopyLabel("复制");
  }

  async function handleEnhancePrompt() {
    if (!enhancerInput.trim() || isEnhancingPrompt) return;
    if (!hasApiKey) {
      setSubView("settings");
      return;
    }

    setIsEnhancingPrompt(true);
    setEnhancerResultMode("loading");
    setEnhancerResultText("正在增强中...");
    setEnhancerCopyLabel("复制");

    const controller = new AbortController();
    enhancerAbortRef.current = controller;

    try {
      const result = await enhancePrompt({
        apiKey: activeModel!.apiKey,
        baseUrl: activeModel!.baseUrl,
        modelName: activeModel!.modelName,
        providerType: activeModel!.providerType,
        mode: enhancerMode,
        idea: enhancerInput,
        signal: controller.signal,
      });
      setEnhancerResultMode("text");
      setEnhancerResultText(result);
      await persistHistoryRecord({
        sourceType: "enhancer",
        mediaType: enhancerMode,
        sourceUrl: `prompt-enhancer://${enhancerMode}`,
        pageTitle: enhancerMode === "video" ? "视频提示词增强" : "图片提示词增强",
        promptText: result,
        videoSummary: enhancerInput.trim(),
        dedupeKey: `enhancer:${enhancerMode}:${result}`,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        resetEnhancerResult();
        return;
      }
      const message = error instanceof Error ? error.message : "无法增强此提示词，请重试。";
      setEnhancerResultMode("error");
      setEnhancerResultText(message);
    } finally {
      setIsEnhancingPrompt(false);
      enhancerAbortRef.current = null;
    }
  }

  function handleAbortEnhancer() {
    if (enhancerAbortRef.current) {
      enhancerAbortRef.current.abort();
      enhancerAbortRef.current = null;
    }
  }

  async function handleCopyEnhancerResult() {
    if (!showEnhancerCopy) return;
    try {
      await navigator.clipboard.writeText(enhancerResultText);
      setEnhancerCopyLabel("已复制");
      window.setTimeout(() => setEnhancerCopyLabel("复制"), 1600);
    } catch {
      setEnhancerCopyLabel("复制");
    }
  }

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setSubView("main");
  }

  // function handleCategoryChange(category: ImageCategory) {
  //   updateIVTab(currentIVTab, { selectedCategory: category });
  // }

  const currentMediaPreview = useMemo(() => {
    const ms = currentData.mediaSource;
    if (ms.kind === "web-image" && ms.previewUrl) {
      return <img src={ms.previewUrl} alt="图片预览" className="video-preview-media" />;
    }
    if (ms.kind === "local-video") {
      return <video className="video-preview-media" src={ms.objectUrl} muted playsInline preload="metadata" />;
    }
    if (ms.kind === "local-image") {
      return <img src={ms.objectUrl} alt="图片预览" className="video-preview-media" />;
    }
    if (ms.kind === "web-image") {
      return <div className="video-preview-placeholder" />;
    }
    return null;
  }, [currentData.mediaSource]);

  const currentMediaAspectRatio = useMemo(() => getMediaAspectRatio(currentData.mediaSource), [currentData.mediaSource]);

  return {
    state: {
      settings,
      historyItems,
      activeTabId,
      ivTabData,
      activeTab,
      subView,
      statusMessage,
      enhancerMode,
      enhancerInput,
      enhancerResultMode,
      enhancerResultText,
      enhancerCopyLabel,
      isEnhancingPrompt,
      copiedHistoryId,
      editingCardId,
      editingText,
      currentIVTab,
      currentData,
      hasApiKey,
      hasMedia,
      isAnalyzing,
      canAnalyze,
      showCopy,
      showStyleCopy,
      showContentCopy,
      canEnhancePrompt,
      showEnhancerCopy,
      displayResultText,
      displayStyleText,
      displayContentText,
      currentMediaPreview,
      currentMediaAspectRatio,
      // selectedCategory: currentData.selectedCategory,
    },
    refs: {
      imageFileRef,
      videoFileRef,
    },
    actions: {
      setActiveTab,
      setSubView,
      setEnhancerMode,
      setEnhancerInput,
      setEditingText,
      updateIVTab,
      handleAnalyze,
      handleClear,
      handleAbort,
      handleUploadClick,
      handleLocalUpload,
      handleFileDrop,
      handleCopy,
      handleCopyStyle,
      handleCopyContent,
      handleCopyAll,
      handleCopyHistory,
      getHistoryTypeLabel,
      handleDeleteHistory,
      handleEditStart,
      handleEditClose,
      handleEditCopy,
      handleSelectModel,
      handleAddModel,
      handleUpdateModel,
      handleDeleteModel,
      handlePanelModeChange,
      handleFrameSamplingModeChange,
      resetEnhancerResult,
      handleEnhancePrompt,
      handleAbortEnhancer,
      handleCopyEnhancerResult,
      handleTabChange,
      // handleCategoryChange,
    },
  };
}
