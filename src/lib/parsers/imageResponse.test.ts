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

const SAMPLE_NL_RESPONSE = `[ARCHETYPE]
photograph

[AESTHETIC HOOK]
This is a dramatic cinematic still with strong directional lighting and deep shadows. The visual language is epic science fiction — monumental scale contrast between the tiny human figures and the colossal sandworm. Color palette is desaturated desert tones: warm sand beige, gray ochre, deep earth brown, against pure black void. The medium is digital cinematography with shallow depth of field and telephoto compression.

[VISUAL PRIORITY]
1. massive scale contrast between sandworm mouth and human figures, 2. strong directional backlight from upper-right, 3. extreme shallow depth of field isolating sandworm mouth, 4. telephoto spatial compression flattening distance, 5. desaturated desert color palette, 6. dense sand particle atmosphere scattering light, 7. back-facing figures creating mystery, 8. circular mouth geometry dominating upper frame, 9. widescreen 2.39:1 aspect ratio, 10. dissolved shadow edges from sand diffusion

[LIGHTING]
Main light: natural daylight from upper-right of frame, strong directional side-backlight. Light quality: hard sunlight scattered through ultra-dense sand particles, creating directional soft-hard light with dissolved shadow edges. Contrast ratio: high — bright sandworm mouth interior vs near-black shadow areas. No fill light.

[SHADOW GEOMETRY]
Deep shadows inside sandworm mouth cavity, feathered edges due to sand particle diffusion. Contact shadows on warrior figures from backlight angle.

[LOOK PIPELINE]
Color palette: sand beige, gray ochre, deep earth brown, pure black. Extremely low saturation, approaching faded film photography. Tone curve: lifted blacks with warm tint in shadow areas, soft highlight rolloff. No visible split toning.

[TONAL DISTRIBUTION]
Low-key overall. Shadow occupancy ~60%, midtone ~30%, highlight ~10%.

[OPTICAL DEPTH]
Telephoto cinema lens with strong spatial compression. Shallow depth of field — sandworm mouth in sharp focus, warrior figures at bottom slightly soft. Bokeh character: smooth and creamy.

[STYLE & TEXTURE]
Style reference: epic sci-fi cinematography. Capture device: digital cinema camera. No visible beauty processing.

[FRAME]
Low angle, approximately 15° upward tilt. Widescreen 2.39:1 aspect ratio. Shot type: wide establishing.

[COMPOSITION]
Focal hierarchy: primary anchor at upper-center 30% — the illuminated sandworm mouth dominates by scale and brightness. Secondary anchor at lower-center 10% — five small warrior figures. Eye path: drawn immediately to the bright circular mouth, then down to the tiny figures. Negative space: surrounding black void ~50%.

[ATMOSPHERE]
Emotional tone: awe, dread, insignificance. Viewer as tiny observer confronting overwhelming scale.

[PROMPT TAGS]
Medium: photograph, cinematic still, photorealistic, concept art. Quality: masterpiece, highly detailed, sharp focus.

[GENERATION CUES]
telephoto compression, shallow depth of field, strong backlight, desaturated desert tones, sand particle atmosphere, widescreen aspect ratio, massive scale contrast

[NEGATIVE PROMPT]
watermark, signature, text, logo, worst quality, low quality, jpeg artifacts, plastic skin, CGI appearance

[SUBJECT 1]
Core identity: ancient ecological-scale giant sandworm. Appearance: circular mouth opened wide facing camera, occupying roughly 80% of upper frame. Material: not biological skin — resembles cracked desert rock, weathered mineral crust, extremely matte and rough. Color: low-saturation ochre, deep sand brown.

[SUBJECT 2]
Core identity: five desert warriors. Appearance: completely back-facing, positioned at very bottom of frame. Material: gray-white sealed weather suits, enclosed helmets. Action: holding long swords pointed at sandworm in defensive stance.

[SPATIAL LAYERS]
Foreground: five warriors with slight blur, occupying bottom 15-20% of frame. Midground: clean air layer. Background: sandworm mouth clearly emerging from sandstorm wall.

[ENVIRONMENT]
Indoor not applicable. Desert landscape implied by sand particles and rock texture. No sky visible.

[IMPERFECTIONS & PHYSICS]
Grain: subtle film-like grain in shadow areas. No visible compression artifacts or physical damage.

[CONSTRAINTS]
output aspect ratio must match source exactly: 2.39:1.
STYLE LOCKS: keep the desaturated desert palette, telephoto compression, low-key tone, soft sand-diffused backlight, and cinematic scale emphasis.
CONTENT LOCKS: do not add sky or horizon where source shows none, do not add vegetation or civilization traces, do not complete the sandworm body beyond what is shown, preserve the massive scale contrast.`;

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
    expect(result.sections["SUBJECT 1"]).toContain("sandworm");
    expect(result.sections["SUBJECT 2"]).toContain("warriors");
    expect(result.sections["SPATIAL LAYERS"]).toContain("Foreground");
    expect(result.sections["LIGHTING"]).toContain("Main light");
    expect(result.sections["LOOK PIPELINE"]).toContain("Color palette");
    expect(result.sections["CONSTRAINTS"]).toContain("STYLE LOCKS:");
    expect(result.sections["CONSTRAINTS"]).toContain("CONTENT LOCKS:");
  });

  it("将 CONSTRAINTS 中的 STYLE LOCKS 和 CONTENT LOCKS 分别拆入 styleText 与 contentText", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.styleText).toContain("[CONSTRAINTS - STYLE]");
    expect(result.styleText).toContain("telephoto compression");
    expect(result.contentText).toContain("[CONSTRAINTS - CONTENT]");
    expect(result.contentText).toContain("do not add sky or horizon");
  });

  it("提取 negativePrompt 从 NEGATIVE PROMPT 标签", () => {
    const result = parseImageResponse(SAMPLE_NL_RESPONSE);
    expect(result.negativePrompt).toContain("watermark");
    expect(result.negativePrompt).toContain("worst quality");
    expect(result.negativePrompt).not.toContain("Do not add sky");
  });

  it("无 NEGATIVE PROMPT 时回退到 CONSTRAINTS", () => {
    const withoutNeg = SAMPLE_NL_RESPONSE.replace(/\[NEGATIVE PROMPT\]\n[\s\S]*?(?=\n\[)/, "");
    const result = parseImageResponse(withoutNeg);
    expect(result.negativePrompt).toContain("STYLE LOCKS:");
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
