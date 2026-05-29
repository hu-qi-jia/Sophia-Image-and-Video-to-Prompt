export function cleanEnhancedPrompt(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/```$/i, "")
    .replace(
      /^(?:enhanced\s+prompt|video\s+prompt|image\s+prompt|final\s+prompt|prompt)\s*:\s*/i,
      ""
    )
    .trim();
}

export function parseDataUrl(
  dataUrl: string
): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("不支持的帧格式。");
  }
  return { mimeType: match[1], data: match[2] };
}

export function readApiError(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (obj.error && typeof obj.error === "object") {
      const err = obj.error as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
    }
    if (typeof obj.message === "string") return obj.message;
  }
  return null;
}
