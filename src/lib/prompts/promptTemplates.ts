import {
  buildGeminiImageInstruction
} from "./image";
import {
  buildProductImageInstruction
} from "./productImage";
import {
  GEMINI_VIDEO_RESPONSE_SCHEMA,
  buildGeminiVideoInstruction,
  getTargetModelLabel
} from "./video";
import { parseGeminiVideoResponse } from "../parsers/videoResponse";
import {
  parseGeminiImageResponse,
  formatImagePrompt,
  formatImageAnalysis,
  formatLegacyImagePrompt,
  formatLegacyImageAnalysis
} from "../parsers/imageResponse";
import {
  parseGeminiProductImageResponse,
  formatProductImagePrompt,
  formatProductImageAnalysis
} from "../parsers/productImageResponse";
import type { DetectedImageInfo, GeminiVideoPromptResponse, GeminiPromptResponse, TargetModelId, ImageAnalysisMode } from "../types";

export {
  GEMINI_VIDEO_RESPONSE_SCHEMA,
  buildGeminiImageInstruction,
  buildProductImageInstruction,
  buildGeminiVideoInstruction,
  getTargetModelLabel,
  parseGeminiVideoResponse,
  parseGeminiImageResponse,
  parseGeminiProductImageResponse,
  formatImagePrompt,
  formatImageAnalysis,
  formatLegacyImagePrompt,
  formatLegacyImageAnalysis,
  formatProductImagePrompt,
  formatProductImageAnalysis
};

/**
 * Build image analysis instruction based on the selected mode.
 */
export function buildImageInstruction(
  targetModel: TargetModelId,
  imageInfo?: DetectedImageInfo,
  imageMode: ImageAnalysisMode = "portrait"
): string {
  if (imageMode === "product") {
    return buildProductImageInstruction(targetModel, imageInfo);
  }
  return buildGeminiImageInstruction(targetModel, imageInfo);
}

export function formatVideoPrompt(promptResult: GeminiVideoPromptResponse): string {
  return JSON.stringify(promptResult, null, 2);
}

/**
 * Parse image response using the appropriate parser based on mode.
 */
export function parseImageResponseByMode(
  rawText: string,
  imageMode: ImageAnalysisMode = "portrait"
) {
  if (imageMode === "product") {
    return parseGeminiProductImageResponse(rawText);
  }
  return parseGeminiImageResponse(rawText);
}

export function parseGeminiResponse(rawText: string): {
  videoSummary: string;
  generatedPrompt: string;
  rawResult: string;
  promptResult: GeminiPromptResponse;
} {
  const result = parseGeminiVideoResponse(rawText);
  return { ...result, promptResult: result.promptResult };
}
