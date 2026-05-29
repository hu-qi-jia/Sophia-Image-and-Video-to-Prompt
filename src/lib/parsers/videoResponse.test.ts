import { describe, it, expect } from "vitest";
import {
  normalizeVideoResponse,
  parseGeminiVideoResponse,
} from "./videoResponse";
import type { GeminiVideoPromptResponse } from "../types";

function makeValidVideoResponse(
  overrides?: Partial<GeminiVideoPromptResponse>
): GeminiVideoPromptResponse {
  return {
    videoSummary: "A sunset scene",
    targetModel: "seedance-2.0",
    generatedPrompt: {
      globalStyle: "Cinematic",
      timeline: [
        {
          time: "0-2s",
          subject: "Sun",
          action: "Setting",
          setting: "Beach",
          camera: "Wide shot",
          mood: "Peaceful",
          sound: "Waves",
        },
      ],
      consistencyConstraints: ["Maintain warm color palette"],
    },
    ...overrides,
  };
}

describe("normalizeVideoResponse", () => {
  it("正常化有效的视频响应", () => {
    const input = makeValidVideoResponse();
    const result = normalizeVideoResponse(input);
    expect(result.videoSummary).toBe("A sunset scene");
    expect(result.targetModel).toBe("seedance-2.0");
    expect(result.generatedPrompt.globalStyle).toBe("Cinematic");
    expect(result.generatedPrompt.timeline).toHaveLength(1);
    expect(result.generatedPrompt.consistencyConstraints).toHaveLength(1);
  });

  it("修剪字符串中的空白字符", () => {
    const input = makeValidVideoResponse({
      videoSummary: "  padded  ",
      targetModel: "  seedance-2.0  ",
      generatedPrompt: {
        globalStyle: "  Cinematic  ",
        timeline: [
          {
            time: " 0-2s ",
            subject: " Sun ",
            action: " Setting ",
            setting: " Beach ",
            camera: " Wide shot ",
            mood: " Peaceful ",
            sound: " Waves ",
          },
        ],
        consistencyConstraints: ["  warm  "],
      },
    });
    const result = normalizeVideoResponse(input);
    expect(result.videoSummary).toBe("padded");
    expect(result.targetModel).toBe("seedance-2.0");
    expect(result.generatedPrompt.globalStyle).toBe("Cinematic");
    expect(result.generatedPrompt.timeline[0].time).toBe("0-2s");
    expect(result.generatedPrompt.consistencyConstraints[0]).toBe("warm");
  });

  it("过滤掉 timeline 中字段为空字符串的项", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        globalStyle: "Cinematic",
        timeline: [
          {
            time: "",
            subject: "Sun",
            action: "Setting",
            setting: "Beach",
            camera: "Wide",
            mood: "Peaceful",
            sound: "Waves",
          },
          {
            time: "0-2s",
            subject: "Moon",
            action: "Rising",
            setting: "Mountain",
            camera: "Close",
            mood: "Dramatic",
            sound: "Wind",
          },
        ],
        consistencyConstraints: ["Keep consistent"],
      },
    });
    const result = normalizeVideoResponse(input);
    expect(result.generatedPrompt.timeline).toHaveLength(1);
    expect(result.generatedPrompt.timeline[0].subject).toBe("Moon");
  });

  it("过滤掉 consistencyConstraints 中的空字符串", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        globalStyle: "Cinematic",
        timeline: [
          {
            time: "0-2s",
            subject: "Sun",
            action: "Setting",
            setting: "Beach",
            camera: "Wide",
            mood: "Peaceful",
            sound: "Waves",
          },
        ],
        consistencyConstraints: ["valid", "", "  ", "also valid"],
      },
    });
    const result = normalizeVideoResponse(input);
    expect(result.generatedPrompt.consistencyConstraints).toEqual([
      "valid",
      "also valid",
    ]);
  });

  it("videoSummary 为空时抛出错误", () => {
    const input = makeValidVideoResponse({ videoSummary: "" });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });

  it("targetModel 为空时抛出错误", () => {
    const input = makeValidVideoResponse({ targetModel: "" });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });

  it("globalStyle 为空时抛出错误", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        ...makeValidVideoResponse().generatedPrompt,
        globalStyle: "",
      },
    });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });

  it("timeline 为空数组时抛出错误", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        ...makeValidVideoResponse().generatedPrompt,
        timeline: [],
      },
    });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });

  it("consistencyConstraints 为空数组时抛出错误", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        ...makeValidVideoResponse().generatedPrompt,
        consistencyConstraints: [],
      },
    });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });

  it("timeline 不是数组时视为空数组并抛出错误", () => {
    const input = makeValidVideoResponse({
      generatedPrompt: {
        globalStyle: "Cinematic",
        timeline: "not an array" as unknown as never[],
        consistencyConstraints: ["valid"],
      },
    });
    expect(() => normalizeVideoResponse(input)).toThrow(
      "模型返回了无效的响应格式"
    );
  });
});

describe("parseGeminiVideoResponse", () => {
  it("从原始 JSON 文本解析完整的视频响应", () => {
    const rawText = JSON.stringify(makeValidVideoResponse());
    const result = parseGeminiVideoResponse(rawText);
    expect(result.videoSummary).toBe("A sunset scene");
    expect(result.generatedPrompt).toContain("Cinematic");
    expect(result.promptResult.videoSummary).toBe("A sunset scene");
    expect(result.promptResult.generatedPrompt.timeline).toHaveLength(1);
  });

  it("解析带前缀的 JSON 文本", () => {
    const rawText = 'Here is the result:\n' + JSON.stringify(makeValidVideoResponse());
    const result = parseGeminiVideoResponse(rawText);
    expect(result.videoSummary).toBe("A sunset scene");
  });

  it("无效 JSON 抛出错误", () => {
    expect(() => parseGeminiVideoResponse("not json at all")).toThrow();
  });
});
