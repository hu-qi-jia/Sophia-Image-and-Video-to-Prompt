import { describe, it, expect } from "vitest";
import {
  parseGeminiImageResponse,
  parseImageResponse,
  formatImagePrompt,
  formatImageAnalysis,
  formatLegacyImagePrompt,
  formatLegacyImageAnalysis,
} from "./imageResponse";
import type {
  StructuredImagePromptResponse,
  GeminiImagePromptResponse,
  ImagePromptResponse,
} from "../types";

function makeStructuredResponse(
  overrides?: Partial<StructuredImagePromptResponse>
): StructuredImagePromptResponse {
  return {
    image_archetype: { image_domain: "photograph", visual_medium: "digital" },
    recreation_anchors: {
      must_preserve: ["back view no visible face", "red logo upper back"],
      high_risk_errors: ["front-facing portrait when source is angled"],
      priority_order: "viewpoint and crop matter most",
      prompt_frontload: "back view cropped figure with red logo on upper back",
    },
    subjects: [{ name: "cat", category: "animal" }],
    composition: { framing: "close-up" },
    set_dressing: {},
    lighting_and_color: { light_sources: "top", dominant_palette: ["blue"] },
    atmospheric_signature: { mood_temperature: "neutral" },
    imperfections: { grain_or_noise: "low" },
    shortPrompt: "A cat photo",
    detailedPrompt: "A detailed cat photo description",
    negativePrompt: "blurry",
    ...overrides,
  };
}

function makeLegacyResponse(
  overrides?: Partial<GeminiImagePromptResponse>
): GeminiImagePromptResponse {
  return {
    analysis: {
      subject: "cat",
      scene: "indoor",
      composition: "centered",
      style: "realistic",
      lighting: "natural",
      colorPalette: "warm",
      mood: "calm",
      details: "soft fur",
      medium: "photograph",
      keywords: ["cat", "indoor"],
    },
    shortPrompt: "A cat",
    detailedPrompt: "A detailed cat",
    imagePrompt: "image prompt: A cat in a room",
    ...overrides,
  };
}

const SAMPLE_NL_RESPONSE = `[FRAME]
Low angle, approximately 15° upward tilt. Telephoto cinema lens with strong spatial compression. Widescreen 2.39:1 aspect ratio. Shallow depth of field.

[SUBJECT 1: sandworm]
Core identity: ancient ecological-scale giant sandworm. Appearance: circular mouth opened wide facing camera, occupying roughly 80% of upper frame. Material: not biological skin—resembles cracked desert rock, weathered mineral crust, extremely matte and rough. Color: low-saturation ochre, deep sand brown.

[SUBJECT 2: Fremen warriors]
Core identity: five desert warriors. Appearance: completely back-facing, positioned at very bottom of frame. Material: gray-white sealed weather suits, enclosed helmets. Action: holding long swords pointed at sandworm in defensive stance.

[SPATIAL LAYERS]
Foreground: five warriors with slight blur, occupying bottom 15-20% of frame. Midground: clean air layer. Background: sandworm mouth clearly emerging from sandstorm wall.

[LIGHTING]
Main light: natural daylight from upper-right of frame, strong directional side-backlight. Light quality: hard sunlight scattered through ultra-dense sand particles, creating directional soft-hard light with dissolved shadow edges.

[COLOR]
Overall: low color temperature warm base. Dominant: sand beige, gray ochre, deep earth brown, pure black. Extremely low saturation, approaching faded film photography.

[CONSTRAINTS]
Do not add sky or horizon where source shows none. Do not add vegetation or civilization traces. Do not complete the sandworm body beyond what is shown.`;

describe("parseImageResponse - natural language format", () => {
  it("解析包含【标签】的自然语言响应", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.rawText).toBe(SAMPLE_NL_RESPONSE);
    expect(result.sections).toBeDefined();
    expect(Object.keys(result.sections).length).toBeGreaterThan(0);
  });

  it("正确提取各模块内容", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.sections["FRAME"]).toContain("Low angle");
    expect(result.sections["SUBJECT 1: sandworm"]).toContain("sandworm");
    expect(result.sections["SUBJECT 2: Fremen warriors"]).toContain("warriors");
    expect(result.sections["SPATIAL LAYERS"]).toContain("Foreground");
    expect(result.sections["LIGHTING"]).toContain("Main light");
    expect(result.sections["COLOR"]).toContain("Overall");
    expect(result.sections["CONSTRAINTS"]).toContain("Do not add sky");
  });

  it("提取 negativePrompt 从生成约束", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.negativePrompt).toContain("Do not add sky");
    expect(result.negativePrompt).toContain("Do not add vegetation");
  });

  it("detailedPrompt 等于原始文本", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.detailedPrompt).toBe(SAMPLE_NL_RESPONSE);
  });

  it("无【标签】时抛出 E5 错误", () => {
    expect(() => parseImageResponse("plain text without tags")).toThrow(/E5/);
  });
});

describe("parseGeminiImageResponse - format detection", () => {
  it("检测自然语言格式并正确解析", () => {
    const result = parseGeminiImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.imageSummary).toBeDefined();
    expect(result.generatedPrompt).toBe(SAMPLE_NL_RESPONSE);
    expect("sections" in result.promptResult).toBe(true);
  });

  it("检测 JSON 格式并正确解析", () => {
    const rawText = JSON.stringify(makeStructuredResponse());
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("A cat photo");
    expect("image_archetype" in result.promptResult).toBe(true);
  });
});

describe("parseGeminiImageResponse - structured format (image_archetype)", () => {
  it("解析包含 image_archetype 的结构化响应", () => {
    const rawText = JSON.stringify(makeStructuredResponse());
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("A cat photo");
    expect(result.promptResult).toBeDefined();
    expect("image_archetype" in result.promptResult).toBe(true);
  });

  it("修剪 shortPrompt 和 detailedPrompt 的空白", () => {
    const response = makeStructuredResponse({
      shortPrompt: "  padded  ",
      detailedPrompt: "  detailed  ",
    });
    const rawText = JSON.stringify(response);
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("padded");
  });

  it("shortPrompt 和 detailedPrompt 都为空时抛出 E3 错误", () => {
    const response = makeStructuredResponse({
      shortPrompt: "",
      detailedPrompt: "",
    });
    const rawText = JSON.stringify(response);
    expect(() => parseGeminiImageResponse(rawText)).toThrow(/E3/);
  });
});

describe("parseGeminiImageResponse - global_overview format", () => {
  it("解析包含 global_overview 的旧版结构化响应", () => {
    const response = {
      global_overview: { image_domain: "photograph" },
      all_subjects_and_objects: [{ name: "dog" }],
      composition_and_camera: { framing: "wide" },
      light_and_color: { light_sources: "side" },
      details_and_imperfections: { grain_or_noise: "medium" },
      shortPrompt: "A dog photo",
      detailedPrompt: "A detailed dog",
      negativePrompt: "ugly",
    };
    const rawText = JSON.stringify(response);
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("A dog photo");
    expect("image_archetype" in result.promptResult).toBe(true);
  });
});

describe("parseGeminiImageResponse - legacy format (analysis)", () => {
  it("解析包含 analysis 的旧版响应", () => {
    const rawText = JSON.stringify(makeLegacyResponse());
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("A cat");
    expect("analysis" in result.promptResult).toBe(true);
  });

  it("analysis.subject 为空时抛出 E4 错误", () => {
    const response = makeLegacyResponse({
      analysis: {
        ...makeLegacyResponse().analysis,
        subject: "",
      },
    });
    const rawText = JSON.stringify(response);
    expect(() => parseGeminiImageResponse(rawText)).toThrow(/E4/);
  });

  it("imagePrompt 为空时抛出 E4 错误", () => {
    const response = makeLegacyResponse({ imagePrompt: "" });
    const rawText = JSON.stringify(response);
    expect(() => parseGeminiImageResponse(rawText)).toThrow(/E4/);
  });

  it("过滤 analysis.keywords 中的空字符串", () => {
    const response = makeLegacyResponse({
      analysis: {
        ...makeLegacyResponse().analysis,
        keywords: ["cat", "", "  ", "indoor"],
      },
    });
    const rawText = JSON.stringify(response);
    const result = parseGeminiImageResponse(rawText);
    const legacy = result.promptResult as GeminiImagePromptResponse;
    expect(legacy.analysis.keywords).toEqual(["cat", "indoor"]);
  });
});

describe("parseGeminiImageResponse - negativePrompt fallback", () => {
  it("解析包含 negativePrompt 但无 image_archetype 的响应", () => {
    const response = {
      analysis: { image_domain: "photo", visual_medium: "digital" },
      shortPrompt: "A landscape",
      detailedPrompt: "A detailed landscape",
      negativePrompt: "blurry",
    };
    const rawText = JSON.stringify(response);
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("A landscape");
  });
});

describe("parseGeminiImageResponse - nested analysis unwrapping", () => {
  it("解包嵌套的 analysis 对象（当 analysis 包含 image_archetype）", () => {
    const response = {
      analysis: {
        image_archetype: { image_domain: "illustration" },
        subjects: [],
        composition: {},
        set_dressing: {},
        lighting_and_color: {},
        atmospheric_signature: {},
        imperfections: {},
        shortPrompt: "An illustration",
        detailedPrompt: "Detailed illustration",
        negativePrompt: "",
      },
      shortPrompt: "Outer short",
      detailedPrompt: "Outer detailed",
    };
    const rawText = JSON.stringify(response);
    const result = parseGeminiImageResponse(rawText);
    expect(result.imageSummary).toBe("Outer short");
  });
});

describe("formatImagePrompt", () => {
  it("格式化自然语言响应的 detailedPrompt", () => {
    const promptResult: ImagePromptResponse = {
      rawText: SAMPLE_NL_RESPONSE,
      sections: {},
      shortPrompt: "test",
      detailedPrompt: SAMPLE_NL_RESPONSE,
      negativePrompt: "test",
      styleText: "",
      contentText: "",
      warnings: [],
    };
    expect(formatImagePrompt(promptResult)).toBe(SAMPLE_NL_RESPONSE);
  });

  it("格式化结构化响应的 detailedPrompt", () => {
    const promptResult = makeStructuredResponse();
    expect(formatImagePrompt(promptResult)).toBe(
      "A detailed cat photo description"
    );
  });

  it("去除 image prompt: 前缀", () => {
    const promptResult = makeStructuredResponse({
      detailedPrompt: "Image Prompt: a beautiful scene",
    });
    expect(formatImagePrompt(promptResult)).toBe("a beautiful scene");
  });

  it("格式化旧版响应的 imagePrompt", () => {
    const promptResult = makeLegacyResponse();
    expect(formatImagePrompt(promptResult)).toBe("A cat in a room");
  });
});

describe("formatImageAnalysis", () => {
  it("返回自然语言响应的原始文本", () => {
    const promptResult: ImagePromptResponse = {
      rawText: SAMPLE_NL_RESPONSE,
      sections: {},
      shortPrompt: "test",
      detailedPrompt: SAMPLE_NL_RESPONSE,
      negativePrompt: "test",
      styleText: "",
      contentText: "",
      warnings: [],
    };
    expect(formatImageAnalysis(promptResult)).toBe(SAMPLE_NL_RESPONSE);
  });

  it("返回结构化响应的 JSON 字符串", () => {
    const promptResult = makeStructuredResponse();
    const result = formatImageAnalysis(promptResult);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe("formatLegacyImagePrompt", () => {
  it("去除 prompt 前缀", () => {
    const promptResult = makeLegacyResponse({
      imagePrompt: "Prompt: a scene",
    });
    expect(formatLegacyImagePrompt(promptResult)).toBe("a scene");
  });
});

describe("formatLegacyImageAnalysis", () => {
  it("返回 JSON 字符串", () => {
    const promptResult = makeLegacyResponse();
    const result = formatLegacyImageAnalysis(promptResult);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
