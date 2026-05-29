import { describe, it, expect } from "vitest";
import {
  cleanEnhancedPrompt,
  parseDataUrl,
  readApiError,
} from "./apiShared";

describe("cleanEnhancedPrompt", () => {
  it("去除开头的代码块标记", () => {
    expect(cleanEnhancedPrompt("```json\nsome text\n```")).toBe("some text");
  });

  it("去除无语言标记的代码块", () => {
    expect(cleanEnhancedPrompt("```\nsome text\n```")).toBe("some text");
  });

  it("去除 Enhanced Prompt: 前缀", () => {
    expect(cleanEnhancedPrompt("Enhanced Prompt: some text")).toBe("some text");
  });

  it("去除 Video Prompt: 前缀（不区分大小写）", () => {
    expect(cleanEnhancedPrompt("video prompt: some text")).toBe("some text");
  });

  it("去除 Image Prompt: 前缀", () => {
    expect(cleanEnhancedPrompt("Image Prompt: some text")).toBe("some text");
  });

  it("去除 Final Prompt: 前缀", () => {
    expect(cleanEnhancedPrompt("Final Prompt: some text")).toBe("some text");
  });

  it("去除 Prompt: 前缀", () => {
    expect(cleanEnhancedPrompt("Prompt: some text")).toBe("some text");
  });

  it("不去除 Detailed Prompt: 前缀（不在正则列表中）", () => {
    expect(cleanEnhancedPrompt("Detailed Prompt: some text")).toBe("Detailed Prompt: some text");
  });

  it("不去除 Short Prompt: 前缀（不在正则列表中）", () => {
    expect(cleanEnhancedPrompt("Short Prompt: some text")).toBe("Short Prompt: some text");
  });

  it("同时去除代码块和前缀", () => {
    expect(cleanEnhancedPrompt("```text\nEnhanced Prompt: hello\n```")).toBe(
      "hello"
    );
  });

  it("普通文本不做修改", () => {
    expect(cleanEnhancedPrompt("just a normal prompt")).toBe(
      "just a normal prompt"
    );
  });

  it("去除首尾空白", () => {
    expect(cleanEnhancedPrompt("  hello world  ")).toBe("hello world");
  });
});

describe("parseDataUrl", () => {
  it("解析标准 data URL", () => {
    const result = parseDataUrl("data:image/png;base64,abc123");
    expect(result).toEqual({ mimeType: "image/png", data: "abc123" });
  });

  it("解析 JPEG data URL", () => {
    const result = parseDataUrl("data:image/jpeg;base64,/9j/4AAQ");
    expect(result).toEqual({ mimeType: "image/jpeg", data: "/9j/4AAQ" });
  });

  it("解析 WebP data URL", () => {
    const result = parseDataUrl("data:image/webp;base64,UklGRiQ");
    expect(result).toEqual({ mimeType: "image/webp", data: "UklGRiQ" });
  });

  it("非 data URL 格式抛出错误", () => {
    expect(() => parseDataUrl("not-a-data-url")).toThrow("不支持的帧格式");
  });

  it("缺少 base64 标记抛出错误", () => {
    expect(() => parseDataUrl("data:image/png,abc")).toThrow(
      "不支持的帧格式"
    );
  });
});

describe("readApiError", () => {
  it("从标准 OpenAI 错误格式提取 message", () => {
    const payload = {
      error: { message: "Invalid API key", type: "invalid_request_error" },
    };
    expect(readApiError(payload)).toBe("Invalid API key");
  });

  it("从顶层 message 字段提取错误", () => {
    const payload = { message: "Rate limit exceeded" };
    expect(readApiError(payload)).toBe("Rate limit exceeded");
  });

  it("error.message 优先于顶层 message", () => {
    const payload = {
      error: { message: "inner error" },
      message: "outer error",
    };
    expect(readApiError(payload)).toBe("inner error");
  });

  it("null 输入返回 null", () => {
    expect(readApiError(null)).toBeNull();
  });

  it("undefined 输入返回 null", () => {
    expect(readApiError(undefined)).toBeNull();
  });

  it("非对象输入返回 null", () => {
    expect(readApiError("string error")).toBeNull();
    expect(readApiError(42)).toBeNull();
  });

  it("error 对象中 message 不是字符串时返回 null", () => {
    const payload = { error: { message: 123 } };
    expect(readApiError(payload)).toBeNull();
  });

  it("空对象返回 null", () => {
    expect(readApiError({})).toBeNull();
  });
});
