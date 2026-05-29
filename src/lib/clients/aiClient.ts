import {
  analyzeImage as doOpenAIAnalyzeImage,
  analyzeImageStream as doOpenAIAnalyzeImageStream,
  analyzeVideoFrames as doOpenAIAnalyzeVideoFrames,
  enhancePrompt as doOpenAIEnhancePrompt
} from "./openaiClient";
import {
  analyzeVideoFramesWithGemini,
  analyzeImageWithGemini,
  enhancePromptWithGemini,
} from "./geminiClient";
import {
  type DetectedImageInfo,
  type DetectedVideoInfo,
  type ExtractedFrame,
  // type ImageCategory,
  type PromptEnhancerMode,
  type ProviderType,
  type TargetModelId
} from "../types";

type BaseParams = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  providerType: ProviderType;
};

export async function analyzeVideoFrames({
  apiKey,
  baseUrl,
  modelName,
  providerType,
  targetModel,
  frames,
  videoInfo,
  signal
}: BaseParams & {
  targetModel: TargetModelId;
  frames: ExtractedFrame[];
  videoInfo?: DetectedVideoInfo;
  signal?: AbortSignal;
}): Promise<{ videoSummary: string; generatedPrompt: string; rawResult: string; promptResult: unknown }> {
  if (providerType === "gemini") {
    return analyzeVideoFramesWithGemini({ apiKey, targetModel, frames, videoInfo });
  }
  return doOpenAIAnalyzeVideoFrames({ apiKey, baseUrl, modelName, targetModel, frames, videoInfo, signal });
}

export async function analyzeImage({
  apiKey,
  baseUrl,
  modelName,
  providerType,
  targetModel,
  imageDataUrl,
  imageInfo,
  // category,
  signal
}: BaseParams & {
  targetModel: TargetModelId;
  imageDataUrl: string;
  imageInfo?: DetectedImageInfo;
  // category?: ImageCategory;
  signal?: AbortSignal;
}): Promise<{ imageSummary: string; generatedPrompt: string; rawResult: string; promptResult: unknown }> {
  if (providerType === "gemini") {
    return analyzeImageWithGemini({ apiKey, targetModel, imageDataUrl, imageInfo });
  }
  return doOpenAIAnalyzeImage({ apiKey, baseUrl, modelName, targetModel, imageDataUrl, imageInfo, signal });
}

export async function analyzeImageStream({
  apiKey,
  baseUrl,
  modelName,
  providerType,
  targetModel,
  imageDataUrl,
  imageInfo,
  // category,
  signal,
  onProgress
}: BaseParams & {
  targetModel: TargetModelId;
  imageDataUrl: string;
  imageInfo?: DetectedImageInfo;
  // category?: ImageCategory;
  signal?: AbortSignal;
  onProgress?: (text: string) => void;
}): Promise<{ imageSummary: string; generatedPrompt: string; rawResult: string; promptResult: unknown }> {
  if (providerType === "gemini") {
    const result = await analyzeImageWithGemini({ apiKey, targetModel, imageDataUrl, imageInfo });
    if (onProgress) onProgress(result.generatedPrompt);
    return result;
  }
  return doOpenAIAnalyzeImageStream({ apiKey, baseUrl, modelName, targetModel, imageDataUrl, imageInfo, signal, onProgress });
}

export async function enhancePrompt({
  apiKey,
  baseUrl,
  modelName,
  providerType,
  mode,
  idea,
  signal
}: BaseParams & {
  mode: PromptEnhancerMode;
  idea: string;
  signal?: AbortSignal;
}): Promise<string> {
  if (providerType === "gemini") {
    return enhancePromptWithGemini({ apiKey, mode, idea });
  }
  return doOpenAIEnhancePrompt({ apiKey, baseUrl, modelName, mode, idea, signal });
}
