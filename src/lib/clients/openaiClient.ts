import { cleanEnhancedPrompt, parseDataUrl, readApiError } from "./apiShared";
import {
  buildPromptEnhancerImageInstruction,
  buildPromptEnhancerVideoInstruction,
  type PromptEnhancerMode
} from "../prompts/enhancer";
import {
  buildImageInstruction,
  buildGeminiVideoInstruction,
  parseGeminiImageResponse,
  parseImageResponseByMode,
  parseGeminiVideoResponse
} from "../prompts/promptTemplates";
import {
  type DetectedImageInfo,
  type DetectedVideoInfo,
  type ExtractedFrame,
  type TargetModelId,
  type ImageAnalysisMode
} from "../types";
import { resizeImageDataUrl } from "../media/imageUtils";

function dataUrlToBase64(dataUrl: string): {
  mimeType: string;
  base64: string;
} {
  const { mimeType, data } = parseDataUrl(dataUrl);
  return { mimeType, base64: data };
}

function readOpenAIError(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (obj.error && typeof obj.error === "object") {
      const err = obj.error as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
    }
    // Only treat top-level "message" as error when response has no "choices"
    // (successful chat completions may include a "message" field alongside "choices")
    if (typeof obj.message === "string" && !("choices" in obj)) return obj.message;
  }
  return null;
}

function readOpenAIText(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    const apiError = readOpenAIError(payload);
    if (apiError) {
      throw new Error(apiError);
    }

    if (
      "choices" in obj &&
      Array.isArray(obj.choices) &&
      obj.choices.length > 0
    ) {
      const choice = obj.choices[0];
      if (choice && typeof choice === "object") {
        const c = choice as Record<string, unknown>;
        if (c.message && typeof c.message === "object") {
          const msg = c.message as Record<string, unknown>;
          if (typeof msg.content === "string") return msg.content;
        }
      }
    }
  }

  throw new Error("模型未返回有效的提示词，请重试。");
}

/**
 * 检测错误消息是否表明模型仅支持流式调用（不支持普通 HTTP 调用）
 */
function isStreamOnlyError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("only support stream") ||
    lower.includes("does not support http call") ||
    lower.includes("please enable the stream parameter") ||
    lower.includes("stream mode")
  );
}

/**
 * 通用流式 chat completion 请求辅助函数
 * 发送流式请求并收集完整响应文本
 */
async function streamChatCompletion({
  endpoint,
  apiKey,
  body,
  signal,
}: {
  endpoint: string;
  apiKey: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText.slice(0, 300) ||
        `API 请求失败 (${response.status})，请检查您的 API 密钥、配额或网络连接。`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("当前 API 端点不支持流式响应，请在设置中检查接口地址。");
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (signal?.aborted) {
        reader.releaseLock();
        throw new DOMException("Aborted", "AbortError");
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const chunk = JSON.parse(data);
          const apiError = readOpenAIError(chunk);
          if (apiError) {
            throw new Error(apiError);
          }
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") {
            fullContent += delta;
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullContent.trim()) {
    throw new Error("模型未返回有效的提示词，请重试。");
  }

  return fullContent;
}

/**
 * 非流式 chat completion 请求（作为回退方案）
 */
async function nonStreamChatCompletion({
  endpoint,
  apiKey,
  body,
  signal,
}: {
  endpoint: string;
  apiKey: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<unknown> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  let payload: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = (await response.json()) as unknown;
  } else {
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(
        `API 请求失败 (${response.status}): ${rawText.slice(0, 300)}`
      );
    }
    throw new Error(`API 返回了非JSON响应: ${rawText.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(
      readOpenAIError(payload) ??
        `API 请求失败 (${response.status})，请检查您的 API 密钥、配额或网络连接。`
    );
  }

  return payload;
}

// ── 导出的公共函数 ──────────────────────────────────────────────

export async function analyzeVideoFrames({
  apiKey,
  baseUrl,
  modelName,
  targetModel,
  frames,
  videoInfo,
  signal,
}: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  targetModel: TargetModelId;
  frames: ExtractedFrame[];
  videoInfo?: DetectedVideoInfo;
  signal?: AbortSignal;
}): Promise<ReturnType<typeof parseGeminiVideoResponse>> {
  const endpoint = `${baseUrl}/chat/completions`;
  const instruction = buildGeminiVideoInstruction(targetModel, videoInfo);

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: instruction }];

  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index];
    const { mimeType, base64 } = dataUrlToBase64(frame.dataUrl);
    content.push({
      type: "text",
      text: `Frame ${index + 1} at ${frame.timestamp.toFixed(2)} seconds`,
    });
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64}`,
      },
    });
  }

  const requestBody = {
    model: modelName,
    messages: [{ role: "user", content }],
    temperature: 0.4,
    top_p: 0.9,
  };

  // 流式优先，失败时回退到非流式（但排除 stream-only 错误）
  try {
    const text = await streamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
    return parseGeminiVideoResponse(text);
  } catch (streamErr) {
    const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
    // 如果是 stream-only 模型报错，不要回退到非流式，直接抛出
    if (isStreamOnlyError(msg)) {
      throw streamErr;
    }
    // 其他流式错误（如 SSE 解析问题），回退到非流式
    const payload = await nonStreamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
    const text = readOpenAIText(payload);
    return parseGeminiVideoResponse(text);
  }
}

export async function analyzeImage({
  apiKey,
  baseUrl,
  modelName,
  targetModel,
  imageDataUrl,
  imageInfo,
  imageMode,
  signal
}: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  targetModel: TargetModelId;
  imageDataUrl: string;
  imageInfo?: DetectedImageInfo;
  imageMode?: ImageAnalysisMode;
  signal?: AbortSignal;
}): Promise<ReturnType<typeof parseGeminiImageResponse>> {
  const endpoint = `${baseUrl}/chat/completions`;
  const instruction = buildImageInstruction(targetModel, imageInfo, imageMode);

  const compressedDataUrl = await resizeImageDataUrl(imageDataUrl);
  const { mimeType, base64 } = dataUrlToBase64(compressedDataUrl);

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instruction },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.5,
    top_p: 0.9,
  };

  const payload = await nonStreamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
  const text = readOpenAIText(payload);
  return parseImageResponseByMode(text, imageMode);
}

export async function analyzeImageStream({
  apiKey,
  baseUrl,
  modelName,
  targetModel,
  imageDataUrl,
  imageInfo,
  imageMode,
  signal,
  onProgress
}: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  targetModel: TargetModelId;
  imageDataUrl: string;
  imageInfo?: DetectedImageInfo;
  imageMode?: ImageAnalysisMode;
  signal?: AbortSignal;
  onProgress?: (text: string) => void;
}): Promise<ReturnType<typeof parseGeminiImageResponse>> {
  const endpoint = `${baseUrl}/chat/completions`;
  const instruction = buildImageInstruction(targetModel, imageInfo, imageMode);

  const compressedDataUrl = await resizeImageDataUrl(imageDataUrl);
  const { mimeType, base64 } = dataUrlToBase64(compressedDataUrl);

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instruction },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.5,
    top_p: 0.9,
  };

  // 流式优先，支持进度回调
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...requestBody, stream: true }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errMsg = errorText.slice(0, 300) ||
        `API 请求失败 (${response.status})，请检查您的 API 密钥、配额或网络连接。`;
      // stream-only 模型错误不回退
      if (isStreamOnlyError(errMsg)) {
        throw new Error(errMsg);
      }
      throw new Error(errMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("当前 API 端点不支持流式响应，请在设置中检查接口地址。");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (signal?.aborted) {
          reader.releaseLock();
          throw new DOMException("Aborted", "AbortError");
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data);
            const apiError = readOpenAIError(chunk);
            if (apiError) {
              throw new Error(apiError);
            }
            const delta = chunk?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              fullContent += delta;
              onProgress?.(fullContent);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullContent.trim()) {
      throw new Error("模型未返回有效的提示词，请重试。");
    }

    return parseImageResponseByMode(fullContent, imageMode);
  } catch (streamErr) {
    const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
    // stream-only 错误不回退到非流式
    if (isStreamOnlyError(msg)) {
      throw streamErr;
    }
    // 其他流式错误（SSE 解析等），回退到非流式
    const isStreamError =
      msg.toLowerCase().includes("stream") ||
      msg.toLowerCase().includes("sse");
    if (isStreamError) {
      const result = await analyzeImage({
        apiKey, baseUrl, modelName, targetModel,
        imageDataUrl, imageInfo, imageMode, signal,
      });
      if (onProgress) onProgress(result.generatedPrompt);
      return result;
    }
    throw streamErr;
  }
}

export async function enhancePrompt({
  apiKey,
  baseUrl,
  modelName,
  mode,
  idea,
  signal,
}: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  mode: PromptEnhancerMode;
  idea: string;
  signal?: AbortSignal;
}): Promise<string> {
  const trimmedIdea = idea.trim();
  if (!trimmedIdea) {
    throw new Error("请先输入简短创意。");
  }

  const endpoint = `${baseUrl}/chat/completions`;

  if (mode === "video") {
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: buildPromptEnhancerVideoInstruction(trimmedIdea),
        },
      ],
      temperature: 0.45,
      top_p: 0.9,
    };

    // 流式优先
    try {
      const text = await streamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
      return parseGeminiVideoResponse(text).generatedPrompt;
    } catch (streamErr) {
      const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
      if (isStreamOnlyError(msg)) {
        throw streamErr;
      }
      const payload = await nonStreamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
      const text = readOpenAIText(payload);
      return parseGeminiVideoResponse(text).generatedPrompt;
    }
  }

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: buildPromptEnhancerImageInstruction(trimmedIdea),
      },
    ],
    temperature: 0.55,
    top_p: 0.9,
  };

  // 流式优先
  try {
    const text = await streamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
    const prompt = cleanEnhancedPrompt(text);
    if (!prompt) {
      throw new Error("模型未返回有效的提示词，请重试。");
    }
    return prompt;
  } catch (streamErr) {
    const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
    if (isStreamOnlyError(msg)) {
      throw streamErr;
    }
    const payload = await nonStreamChatCompletion({ endpoint, apiKey, body: requestBody, signal });
    const prompt = cleanEnhancedPrompt(readOpenAIText(payload));
    if (!prompt) {
      throw new Error("模型未返回有效的提示词，请重试。");
    }
    return prompt;
  }
}
