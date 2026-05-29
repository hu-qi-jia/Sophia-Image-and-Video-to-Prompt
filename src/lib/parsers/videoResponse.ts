import { parseGeminiJson } from "./jsonRepair";
import type { GeminiVideoPromptResponse } from "../types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeVideoResponse(
  response: GeminiVideoPromptResponse
): GeminiVideoPromptResponse {
  const timeline = response.generatedPrompt?.timeline;
  const normalizedTimeline = Array.isArray(timeline)
    ? timeline
        .filter(
          (
            item
          ): item is {
            time: string;
            subject: string;
            action: string;
            setting: string;
            camera: string;
            mood: string;
            sound: string;
          } =>
            !!item &&
            typeof item === "object" &&
            isNonEmptyString((item as { time?: unknown }).time) &&
            isNonEmptyString((item as { subject?: unknown }).subject) &&
            isNonEmptyString((item as { action?: unknown }).action) &&
            isNonEmptyString((item as { setting?: unknown }).setting) &&
            isNonEmptyString((item as { camera?: unknown }).camera) &&
            isNonEmptyString((item as { mood?: unknown }).mood) &&
            isNonEmptyString((item as { sound?: unknown }).sound)
        )
        .map((item) => ({
          time: item.time.trim(),
          subject: item.subject.trim(),
          action: item.action.trim(),
          setting: item.setting.trim(),
          camera: item.camera.trim(),
          mood: item.mood.trim(),
          sound: item.sound.trim(),
        }))
    : [];

  const consistencyConstraints = Array.isArray(
    response.generatedPrompt?.consistencyConstraints
  )
    ? response.generatedPrompt.consistencyConstraints
        .filter(isNonEmptyString)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const normalized: GeminiVideoPromptResponse = {
    videoSummary: response.videoSummary?.trim?.() ?? "",
    targetModel: response.targetModel?.trim?.() ?? "",
    generatedPrompt: {
      globalStyle: response.generatedPrompt?.globalStyle?.trim?.() ?? "",
      timeline: normalizedTimeline,
      consistencyConstraints,
    },
  };

  if (
    !isNonEmptyString(normalized.videoSummary) ||
    !isNonEmptyString(normalized.targetModel) ||
    !isNonEmptyString(normalized.generatedPrompt.globalStyle) ||
    normalizedTimeline.length === 0 ||
    consistencyConstraints.length === 0
  ) {
    throw new Error("模型返回了无效的响应格式，请重试。");
  }

  return normalized;
}

export function parseGeminiVideoResponse(rawText: string): {
  videoSummary: string;
  generatedPrompt: string;
  rawResult: string;
  promptResult: GeminiVideoPromptResponse;
} {
  const promptResult = normalizeVideoResponse(
    parseGeminiJson<GeminiVideoPromptResponse>(rawText)
  );
  return {
    videoSummary: promptResult.videoSummary,
    generatedPrompt: JSON.stringify(promptResult, null, 2),
    rawResult: JSON.stringify(promptResult, null, 2),
    promptResult,
  };
}
