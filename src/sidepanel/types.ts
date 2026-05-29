import type {
  AnalysisMediaType,
  AnalysisSourceType,
  DetectedImageInfo,
  DetectedVideoInfo,
  FrameSamplingMode,
  // ImageCategory,
  PromptEnhancerMode,
  PromptFormat,
  GeminiPromptResponse,
  AnalysisState,
  TargetModelId,
} from "../lib/types";
import { /* DEFAULT_IMAGE_CATEGORY, */ DEFAULT_TARGET_MODEL } from "../lib/types";

export type {
  AnalysisMediaType,
  AnalysisSourceType,
  DetectedImageInfo,
  DetectedVideoInfo,
  FrameSamplingMode,
  // ImageCategory,
  PromptEnhancerMode,
  PromptFormat,
  GeminiPromptResponse,
  AnalysisState,
  TargetModelId,
};

export type PanelContextResponse = {
  activeTabId: number | null;
  state: AnalysisState | null;
};

export type StartAnalysisResponse = {
  ok: boolean;
  state: AnalysisState;
};

export type TabId = "image" | "video" | "enhancer";
export type SubView = "main" | "history" | "settings";

export type MediaSource =
  | { kind: "none" }
  | { kind: "web-image"; previewUrl?: string; imageInfo?: DetectedImageInfo }
  | { kind: "local-video"; objectUrl: string; fileName: string; videoInfo?: DetectedVideoInfo }
  | { kind: "local-image"; objectUrl: string; fileName: string; file: File; imageInfo?: DetectedImageInfo };

export type IVTabData = {
  mediaSource: MediaSource;
  isAnalyzingLocal: boolean;
  // selectedCategory: ImageCategory;
  resultMode: "empty" | "loading" | "text" | "error";
  resultText: string;
  streamText: string;
  rawResultText: string;
  promptResult: GeminiPromptResponse | null;
  resultMediaType: AnalysisMediaType;
  displayFormat: PromptFormat;
  copyLabel: string;
  uploadError: string | null;
  isExpanded: boolean;
  analysisState: AnalysisState;
  editedResultText: string | null;
  editedStyleText: string | null;
  editedContentText: string | null;
  copyAllLabel: string;
};

export function createInitialIVTabData(targetModel: TargetModelId = DEFAULT_TARGET_MODEL): IVTabData {
  return {
    mediaSource: { kind: "none" },
    isAnalyzingLocal: false,
    // selectedCategory: DEFAULT_IMAGE_CATEGORY,
    resultMode: "empty",
    resultText: "结果将在此呈现",
    streamText: "",
    rawResultText: "",
    promptResult: null,
    resultMediaType: "image",
    displayFormat: "json",
    copyLabel: "复制",
    uploadError: null,
    isExpanded: false,
    analysisState: { phase: "idle", statusText: "结果将在此呈现", targetModel, tabId: null, updatedAt: Date.now() } as AnalysisState,
    editedResultText: null,
    editedStyleText: null,
    editedContentText: null,
    copyAllLabel: "复制全部",
  };
}

export const FRAME_MODE_COPY: Record<
  FrameSamplingMode,
  { label: string; description: string }
> = {
  fast: { label: "快速", description: "更少帧数，速度更快，适合快速预览。" },
  standard: { label: "标准", description: "速度与质量均衡，适合大多数视频。" },
  detailed: { label: "详细", description: "更多帧数，适合复杂运动或深度分析。" },
};

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml";
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo";

export const ALLOWED_IMAGE_TYPES = new Set(IMAGE_ACCEPT.split(","));
export const ALLOWED_VIDEO_TYPES = new Set(VIDEO_ACCEPT.split(","));

export function buildLocalVideoInfo(video: HTMLVideoElement, fileName: string): DetectedVideoInfo {
  return {
    found: true,
    duration: Number.isFinite(video.duration) ? video.duration : undefined,
    currentTime: video.currentTime,
    videoWidth: video.videoWidth || undefined,
    videoHeight: video.videoHeight || undefined,
    src: fileName,
    pageTitle: "本地上传",
    pageUrl: "local://upload",
  };
}

export function buildLocalImageInfo(image: HTMLImageElement, fileName: string): DetectedImageInfo {
  return {
    found: true,
    imageWidth: image.naturalWidth || undefined,
    imageHeight: image.naturalHeight || undefined,
    src: fileName,
    pageTitle: "本地上传",
    pageUrl: "local://upload",
  };
}

export { createVideoElement, createImageElement } from "../lib/media/imageUtils";

export async function compressThumbnailDataUrl(dataUrl?: string): Promise<string | undefined> {
  if (!dataUrl) return undefined;
  try {
    const image = new Image();
    image.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("无法加载缩略图。"));
    });
    const scale = Math.min(1, 320 / image.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.68);
  } catch {
    return dataUrl;
  }
}

export function createHistoryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatHistoryTime(createdAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(createdAt);
}

export function getMediaAspectRatio(mediaSource: MediaSource): string | undefined {
  if (mediaSource.kind === "local-video" && mediaSource.videoInfo?.videoWidth && mediaSource.videoInfo?.videoHeight) {
    return `${mediaSource.videoInfo.videoWidth} / ${mediaSource.videoInfo.videoHeight}`;
  }
  if (mediaSource.kind === "local-image" && mediaSource.imageInfo?.imageWidth && mediaSource.imageInfo?.imageHeight) {
    return `${mediaSource.imageInfo.imageWidth} / ${mediaSource.imageInfo.imageHeight}`;
  }
  if (mediaSource.kind === "web-image" && mediaSource.imageInfo?.imageWidth && mediaSource.imageInfo?.imageHeight) {
    return `${mediaSource.imageInfo.imageWidth} / ${mediaSource.imageInfo.imageHeight}`;
  }
  return undefined;
}

export function isApiKeyRequiredState(state: AnalysisState): boolean {
  return (
    state.phase === "error" &&
    (state.errorMessage ?? state.statusText).toLowerCase().includes("api key required")
  );
}
