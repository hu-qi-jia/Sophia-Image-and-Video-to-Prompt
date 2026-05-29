import {
  buildGeminiImageInstruction
} from "./image";
// import {
//   buildCategoryImageInstruction
// } from "./imageCategoryPrompts";
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
import type { DetectedImageInfo, GeminiVideoPromptResponse, GeminiPromptResponse, /* ImageCategory, */ TargetModelId } from "../types";

export {
  GEMINI_VIDEO_RESPONSE_SCHEMA,
  buildGeminiImageInstruction,
  buildGeminiVideoInstruction,
  getTargetModelLabel,
  parseGeminiVideoResponse,
  parseGeminiImageResponse,
  formatImagePrompt,
  formatImageAnalysis,
  formatLegacyImagePrompt,
  formatLegacyImageAnalysis
};

/**
 * Build image analysis instruction. Always uses the generic template.
 * Category-specific routing has been disabled — all images use the unified prompt.
 */
export function buildImageInstruction(
  targetModel: TargetModelId,
  imageInfo?: DetectedImageInfo,
  // category?: ImageCategory
): string {
  // if (category && category !== "auto") {
  //   return buildCategoryImageInstruction(category, targetModel, imageInfo);
  // }
  return buildGeminiImageInstruction(targetModel, imageInfo);
}

export function formatVideoPrompt(promptResult: GeminiVideoPromptResponse): string {
  return JSON.stringify(promptResult, null, 2);
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
