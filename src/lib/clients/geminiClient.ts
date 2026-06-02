import { cleanEnhancedPrompt, parseDataUrl, readApiError } from "./apiShared";
import { resizeImageDataUrl } from "../media/imageUtils";
import {
  buildPromptEnhancerImageInstruction,
  buildPromptEnhancerVideoInstruction,
  type PromptEnhancerMode
} from "../prompts/enhancer";
import {
  GEMINI_VIDEO_RESPONSE_SCHEMA,
  buildImageInstruction,
  buildGeminiVideoInstruction,
  parseGeminiImageResponse,
  parseGeminiVideoResponse
} from "../prompts/promptTemplates";
import {
  GEMINI_ANALYSIS_MODEL,
  type DetectedImageInfo,
  type DetectedVideoInfo,
  type ExtractedFrame,
  type TargetModelId
} from "../types";

function dataUrlToInlinePart(dataUrl: string): {
  mimeType: string;
  data: string;
} {
  const { mimeType, data } = parseDataUrl(dataUrl);
  return { mimeType, data };
}

function inferMimeTypeFromUrl(imageUrl: string): string {
  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".png")) {
    return "image/png";
  }
  if (pathname.endsWith(".webp")) {
    return "image/webp";
  }
  if (pathname.endsWith(".gif")) {
    return "image/gif";
  }
  return "image/jpeg";
}

function readGeminiError(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return readApiError(payload);
}

function readGeminiText(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "candidates" in payload &&
    Array.isArray(payload.candidates)
  ) {
    const textParts = payload.candidates
      .flatMap((candidate) => {
        if (
          !candidate ||
          typeof candidate !== "object" ||
          !("content" in candidate) ||
          !candidate.content ||
          typeof candidate.content !== "object" ||
          !("parts" in candidate.content) ||
          !Array.isArray(candidate.content.parts)
        ) {
          return [];
        }

        return candidate.content.parts.flatMap((part: unknown) => {
          if (
            part &&
            typeof part === "object" &&
            "text" in part &&
            typeof part.text === "string"
          ) {
            return [part.text];
          }
          return [];
        });
      })
      .join("\n")
      .trim();

    if (textParts) {
      return textParts;
    }
  }

  throw new Error("Gemini 未返回有效的提示词，请重试。");
}

export async function analyzeVideoFramesWithGemini({
  apiKey,
  targetModel,
  frames,
  videoInfo
}: {
  apiKey: string;
  targetModel: TargetModelId;
  frames: ExtractedFrame[];
  videoInfo?: DetectedVideoInfo;
}): Promise<ReturnType<typeof parseGeminiVideoResponse>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_ANALYSIS_MODEL}:generateContent`;
  const instruction = buildGeminiVideoInstruction(targetModel, videoInfo);

  const frameParts = frames.flatMap((frame, index) => {
    const inlineData = dataUrlToInlinePart(frame.dataUrl);

    return [
      {
        text: `Frame ${index + 1} at ${frame.timestamp.toFixed(2)} seconds`,
      },
      {
        inline_data: inlineData,
      },
    ];
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: instruction }, ...frameParts],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_VIDEO_RESPONSE_SCHEMA,
        temperature: 0.4,
        topP: 0.9,
      },
    }),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      readGeminiError(payload) ??
        "Gemini API 请求失败，请检查您的 API 密钥、配额或网络连接。"
    );
  }

  const text = readGeminiText(payload);
  return parseGeminiVideoResponse(text);
}

export async function analyzeImageWithGemini({
  apiKey,
  targetModel,
  imageUrl,
  imageDataUrl,
  imageInfo,
}: {
  apiKey: string;
  targetModel: TargetModelId;
  imageUrl?: string;
  imageDataUrl?: string;
  imageInfo?: DetectedImageInfo;
}): Promise<ReturnType<typeof parseGeminiImageResponse>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_ANALYSIS_MODEL}:generateContent`;
  const instruction = buildImageInstruction(targetModel, imageInfo);
  const imagePart = imageUrl
    ? {
        file_data: {
          mime_type: inferMimeTypeFromUrl(imageUrl),
          file_uri: imageUrl,
        },
      }
    : imageDataUrl
      ? {
          inline_data: dataUrlToInlinePart(await resizeImageDataUrl(imageDataUrl)),
        }
      : null;

  if (!imagePart) {
    throw new Error("未提供用于分析的图片数据。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: instruction }, imagePart],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.85,
      },
    }),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      readGeminiError(payload) ??
        "Gemini API 请求失败，请检查您的 API 密钥、配额或网络连接。"
    );
  }

  const text = readGeminiText(payload);
  return parseGeminiImageResponse(text);
}

export async function enhancePromptWithGemini({
  apiKey,
  mode,
  idea,
}: {
  apiKey: string;
  mode: PromptEnhancerMode;
  idea: string;
}): Promise<string> {
  const trimmedIdea = idea.trim();
  if (!trimmedIdea) {
    throw new Error("请先输入简短创意。");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_ANALYSIS_MODEL}:generateContent`;

  if (mode === "video") {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPromptEnhancerVideoInstruction(trimmedIdea) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_VIDEO_RESPONSE_SCHEMA,
          temperature: 0.45,
          topP: 0.9,
        },
      }),
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      throw new Error(
        readGeminiError(payload) ??
          "Gemini API 请求失败，请检查您的 API 密钥、配额或网络连接。"
      );
    }

    const text = readGeminiText(payload);
    return parseGeminiVideoResponse(text).generatedPrompt;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPromptEnhancerImageInstruction(trimmedIdea) }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
      },
    }),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      readGeminiError(payload) ??
        "Gemini API 请求失败，请检查您的 API 密钥、配额或网络连接。"
    );
  }

  const prompt = cleanEnhancedPrompt(readGeminiText(payload));
  if (!prompt) {
    throw new Error("Gemini 未返回有效的提示词，请重试。");
  }

  return prompt;
}
