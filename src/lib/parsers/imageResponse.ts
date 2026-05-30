import { parseGeminiJson } from "./jsonRepair";
import type {
  StructuredImagePromptResponse,
  GeminiImagePromptResponse,
  ImagePromptResponse,
} from "../types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeTrim(value: unknown): string {
  return String(value ?? "").trim();
}

function asStructuredResponse(obj: unknown): StructuredImagePromptResponse {
  return obj as StructuredImagePromptResponse;
}

function asGeminiResponse(obj: unknown): GeminiImagePromptResponse {
  return obj as GeminiImagePromptResponse;
}

function stripPromptLabel(value: string): string {
  return value
    .replace(
      /^(?:image\s+prompt|final\s+prompt|prompt|detailed\s+prompt|short\s+prompt)\s*:\s*/i,
      ""
    )
    .trim();
}

// ── Natural language format parser ─────────────────────────────────

const SECTION_REGEX = /(?:^|\n)\[([^\]]+)\]\s*\n?([\s\S]*?)(?=\n\[[^\]]+\]|$)/g;

// Required TAGs that must be present in a valid response
const REQUIRED_TAGS = [
  "AESTHETIC HOOK",
  "FRAME",
  "LIGHTING",
  "COLOR",
  "STYLE & TEXTURE",
  "PROMPT TAGS",
  "NEGATIVE PROMPT",
  "CONSTRAINTS",
] as const;

// Content TAGs that must be present (SUBJECT 1 is matched by prefix)
const REQUIRED_CONTENT_PREFIXES = [
  "SUBJECT",
  "IMPERFECTIONS & PHYSICS",
] as const;

// Minimum character count for a TAG's content to be considered substantive
const MIN_CONTENT_LENGTH = 30;

function validateSections(sections: Record<string, string>): string[] {
  const warnings: string[] = [];
  const presentTags = new Set(Object.keys(sections));

  // Check required style TAGs
  for (const tag of REQUIRED_TAGS) {
    if (!presentTags.has(tag)) {
      warnings.push(`缺少必填模块 [${tag}]`);
    } else if (sections[tag].length < MIN_CONTENT_LENGTH) {
      warnings.push(`[${tag}] 内容过短（${sections[tag].length} 字符）`);
    }
  }

  // Check required content TAGs (prefix match)
  for (const prefix of REQUIRED_CONTENT_PREFIXES) {
    const found = Object.keys(sections).some(tag => tag.startsWith(prefix));
    if (!found) {
      warnings.push(`缺少必填模块 [${prefix}]`);
    }
  }

  // Check SUBJECT 1 content length specifically
  const subject1 = Object.keys(sections).find(k => k.startsWith("SUBJECT"));
  if (subject1 && sections[subject1].length < MIN_CONTENT_LENGTH) {
    warnings.push(`[${subject1}] 内容过短（${sections[subject1].length} 字符）`);
  }

  return warnings;
}

function parseSectionedText(rawText: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let match: RegExpExecArray | null;

  SECTION_REGEX.lastIndex = 0;
  while ((match = SECTION_REGEX.exec(rawText)) !== null) {
    const tag = match[1].trim();
    const content = match[2].trim();
    if (content.length > 0) {
      sections[tag] = content;
    }
  }

  return sections;
}

function extractShortPromptFromSections(sections: Record<string, string>): string {
  const subjectKey = Object.keys(sections).find(k => k.startsWith("SUBJECT"));
  const subjectContent = subjectKey ? sections[subjectKey] : "";
  const subjectLabel = subjectContent.split(/\n/)[0]?.trim() || "";
  const framework = sections["FRAME"] || "";
  const firstSentence = framework.split(/[.。]/)[0] || "";
  return `${firstSentence} ${subjectLabel}`.trim() || "Image analysis";
}

function extractNegativePromptFromSections(sections: Record<string, string>): string {
  return sections["NEGATIVE PROMPT"] ?? sections["CONSTRAINTS"] ?? "";
}

const STYLE_TAGS = new Set([
  "ARCHETYPE", "AESTHETIC HOOK", "STYLE & TEXTURE", "STYLE", "ATMOSPHERE", "COLOR",
  "LIGHTING", "FRAME", "COMPOSITION", "MATERIAL RESPONSE",
  "ERA SIGNALS", "IMAGE PHYSICS", "OPTICAL DEPTH", "FILTER & PROCESSING",
  "STYLE EXCLUSIONS", "VISUAL HIERARCHY", "SNAPSHOT FEEL",
  "PROMPT TAGS", "NEGATIVE PROMPT"
]);

const CONTENT_TAG_PREFIXES = ["SUBJECT", "POSE REFINEMENT", "CLUTTER LOGIC", "SPATIAL LAYERS", "ENVIRONMENT", "IMPERFECTIONS & PHYSICS", "IMPERFECTIONS", "CONSTRAINTS"];

function isContentTag(tag: string): boolean {
  return CONTENT_TAG_PREFIXES.some(prefix => tag.startsWith(prefix));
}

function splitSectionsByGroup(sections: Record<string, string>): {
  styleText: string;
  contentText: string;
} {
  const styleParts: string[] = [];
  const contentParts: string[] = [];

  for (const [tag, content] of Object.entries(sections)) {
    const entry = `[${tag}]\n${content}`;
    if (STYLE_TAGS.has(tag)) {
      styleParts.push(entry);
    } else if (isContentTag(tag)) {
      contentParts.push(entry);
    } else {
      // Unknown tags default to content
      contentParts.push(entry);
    }
  }

  return {
    styleText: styleParts.join("\n\n"),
    contentText: contentParts.join("\n\n"),
  };
}

export function parseImageResponse(rawText: string): ImagePromptResponse {
  const sections = parseSectionedText(rawText);

  if (Object.keys(sections).length === 0) {
    throw new Error("无法解析图片分析结果，请重试。(E5)");
  }

  const { styleText, contentText } = splitSectionsByGroup(sections);
  const warnings = validateSections(sections);

  return {
    rawText,
    sections,
    shortPrompt: extractShortPromptFromSections(sections),
    detailedPrompt: rawText,
    negativePrompt: extractNegativePromptFromSections(sections),
    styleText,
    contentText,
    warnings,
  };
}

// ── JSON format parser (legacy) ────────────────────────────────────

function trySplitStyleContent(text: string): { styleText: string; contentText: string } {
  const sections = parseSectionedText(text);
  if (Object.keys(sections).length > 0) {
    return splitSectionsByGroup(sections);
  }
  return { styleText: "", contentText: "" };
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item: unknown) => safeTrim(item)).filter(Boolean)
    : [];
}

function normalizeStructuredImageResponse(
  response: StructuredImagePromptResponse
): StructuredImagePromptResponse {
  const stringModules = [
    "image_archetype",
    "composition",
    "set_dressing",
    "atmospheric_signature",
    "imperfections",
  ] as const;
  for (const key of stringModules) {
    const source = response[key] as Record<string, unknown> | undefined;
    const target: Record<string, string> = {};
    if (source && typeof source === "object" && !Array.isArray(source)) {
      for (const [k, v] of Object.entries(source)) {
        target[k] = safeTrim(v);
      }
    }
    (response as Record<string, unknown>)[key] = target;
  }

  const atm = response.atmospheric_signature as Record<string, string>;
  if (Object.keys(atm).length === 0) {
    response.atmospheric_signature = {
      mood_temperature: "neutral",
      ambience: "standard",
    };
  }

  if (
    response.lighting_and_color &&
    typeof response.lighting_and_color === "object" &&
    !Array.isArray(response.lighting_and_color)
  ) {
    const lc: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(response.lighting_and_color)) {
      lc[k] = Array.isArray(v)
        ? v.map((item: unknown) => safeTrim(item))
        : safeTrim(v);
    }
    response.lighting_and_color =
      lc as StructuredImagePromptResponse["lighting_and_color"];
  }

  response.subjects = Array.isArray(response.subjects)
    ? response.subjects.map((subject: Record<string, unknown>) => {
        const normalized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(subject)) {
          normalized[k] = safeTrim(v);
        }
        return normalized;
      })
    : [];

  const anchors = response.recreation_anchors as Record<string, unknown> | undefined;
  const mustPreserve = normalizeStringArray(anchors?.must_preserve);
  const highRiskErrors = normalizeStringArray(anchors?.high_risk_errors);
  response.recreation_anchors = {
    must_preserve: mustPreserve.length > 0 ? mustPreserve : ["subject identity", "viewpoint", "crop"],
    high_risk_errors: highRiskErrors.length > 0 ? highRiskErrors : ["wrong pose", "wrong crop"],
    priority_order: safeTrim(anchors?.priority_order) || "viewpoint and composition matter most",
    prompt_frontload: safeTrim(anchors?.prompt_frontload) || safeTrim(response.shortPrompt),
  };

  response.shortPrompt = safeTrim(response.shortPrompt);
  response.detailedPrompt = safeTrim(response.detailedPrompt);
  response.negativePrompt = safeTrim(response.negativePrompt);

  if (!response.styleText || !response.contentText) {
    const { styleText, contentText } = trySplitStyleContent(response.detailedPrompt);
    response.styleText = response.styleText ?? styleText;
    response.contentText = response.contentText ?? contentText;
  }

  if (
    !isNonEmptyString(response.shortPrompt) &&
    !isNonEmptyString(response.detailedPrompt)
  ) {
    throw new Error("模型返回了无效的响应格式，请重试。(E3)");
  }

  return response;
}

function normalizeLegacyImageResponse(
  response: GeminiImagePromptResponse
): GeminiImagePromptResponse {
  const keywords = Array.isArray(response.analysis?.keywords)
    ? response.analysis.keywords
        .filter(isNonEmptyString)
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const normalized: GeminiImagePromptResponse = {
    analysis: {
      subject: response.analysis?.subject?.trim?.() ?? "",
      scene: response.analysis?.scene?.trim?.() ?? "",
      composition: response.analysis?.composition?.trim?.() ?? "",
      style: response.analysis?.style?.trim?.() ?? "",
      lighting: response.analysis?.lighting?.trim?.() ?? "",
      colorPalette: response.analysis?.colorPalette?.trim?.() ?? "",
      mood: response.analysis?.mood?.trim?.() ?? "",
      details: response.analysis?.details?.trim?.() ?? "",
      medium: response.analysis?.medium?.trim?.() ?? "",
      keywords,
    },
    shortPrompt: response.shortPrompt?.trim?.() ?? "",
    detailedPrompt: response.detailedPrompt?.trim?.() ?? "",
    imagePrompt: response.imagePrompt?.trim?.() ?? "",
  };

  const a = normalized.analysis;
  if (
    !isNonEmptyString(a.subject) ||
    !isNonEmptyString(a.scene) ||
    !isNonEmptyString(normalized.imagePrompt)
  ) {
    throw new Error("模型返回了无效的响应格式，请重试。(E4)");
  }

  return normalized;
}

// ── Main parser with format detection ──────────────────────────────

export function parseGeminiImageResponse(rawText: string): {
  imageSummary: string;
  generatedPrompt: string;
  rawResult: string;
  promptResult: ImagePromptResponse | StructuredImagePromptResponse | GeminiImagePromptResponse;
} {
  if (rawText.includes("[") && rawText.includes("]")) {
    try {
      const result = parseImageResponse(rawText);
      return {
        imageSummary: result.shortPrompt,
        generatedPrompt: result.detailedPrompt,
        rawResult: result.rawText,
        promptResult: result,
      };
    } catch {
      // fall through to JSON parsing
    }
  }

  let parsed = parseGeminiJson<Record<string, unknown>>(rawText);

  if (
    parsed &&
    typeof parsed === "object" &&
    !("image_archetype" in parsed) &&
    !("global_overview" in parsed) &&
    "analysis" in parsed
  ) {
    const inner = (parsed as Record<string, unknown>).analysis;
    if (
      inner &&
      typeof inner === "object" &&
      !Array.isArray(inner) &&
      ("image_archetype" in inner || "global_overview" in inner)
    ) {
      parsed = {
        ...(inner as Record<string, unknown>),
        shortPrompt:
          (parsed as Record<string, unknown>).shortPrompt ??
          (inner as Record<string, unknown>).shortPrompt,
        detailedPrompt:
          (parsed as Record<string, unknown>).detailedPrompt ??
          (inner as Record<string, unknown>).detailedPrompt,
        negativePrompt:
          (parsed as Record<string, unknown>).negativePrompt ??
          (inner as Record<string, unknown>).negativePrompt,
      };
    }
  }

  if (parsed && typeof parsed === "object" && "image_archetype" in parsed) {
    const promptResult = normalizeStructuredImageResponse(
      asStructuredResponse(parsed)
    );
    return {
      imageSummary: promptResult.shortPrompt,
      generatedPrompt: JSON.stringify(promptResult, null, 2),
      rawResult: JSON.stringify(promptResult, null, 2),
      promptResult,
    };
  }

  if (parsed && typeof parsed === "object" && "global_overview" in parsed) {
    const old = parsed as Record<string, unknown>;
    const promptResult = normalizeStructuredImageResponse(asStructuredResponse({
      image_archetype:
        (old.global_overview as Record<string, string>) ?? {},
      recreation_anchors: {},
      subjects: Array.isArray(old.all_subjects_and_objects)
        ? old.all_subjects_and_objects
        : [],
      composition:
        (old.composition_and_camera as Record<string, string>) ?? {},
      set_dressing: {},
      lighting_and_color:
        (old.light_and_color as Record<string, unknown>) ?? {},
      atmospheric_signature: {},
      imperfections:
        (old.details_and_imperfections as Record<string, string>) ?? {},
      shortPrompt: String(old.shortPrompt ?? ""),
      detailedPrompt: String(old.detailedPrompt ?? ""),
      negativePrompt: String(old.negativePrompt ?? ""),
    }));
    return {
      imageSummary: promptResult.shortPrompt,
      generatedPrompt: JSON.stringify(promptResult, null, 2),
      rawResult: JSON.stringify(promptResult, null, 2),
      promptResult,
    };
  }

  if (parsed && typeof parsed === "object" && "negativePrompt" in parsed) {
    const legacy = parsed as Record<string, unknown>;
    const promptResult = normalizeStructuredImageResponse(asStructuredResponse({
      image_archetype: (legacy.analysis as Record<string, string>) ?? {},
      recreation_anchors: {},
      subjects: [],
      composition: {},
      set_dressing: {},
      lighting_and_color: {},
      atmospheric_signature: {},
      imperfections: {},
      shortPrompt: String(legacy.shortPrompt ?? ""),
      detailedPrompt: String(legacy.detailedPrompt ?? ""),
      negativePrompt: String(legacy.negativePrompt ?? ""),
    }));
    return {
      imageSummary: promptResult.shortPrompt,
      generatedPrompt: JSON.stringify(promptResult, null, 2),
      rawResult: JSON.stringify(promptResult, null, 2),
      promptResult,
    };
  }

  const promptResult = normalizeLegacyImageResponse(
    asGeminiResponse(parsed)
  );
  return {
    imageSummary: promptResult.shortPrompt,
    generatedPrompt: JSON.stringify(promptResult, null, 2),
    rawResult: JSON.stringify(promptResult, null, 2),
    promptResult,
  };
}

export function formatImagePrompt(
  promptResult: ImagePromptResponse | GeminiImagePromptResponse | StructuredImagePromptResponse
): string {
  if ("sections" in promptResult) {
    return promptResult.detailedPrompt;
  }
  if ("image_archetype" in promptResult) {
    return stripPromptLabel(promptResult.detailedPrompt);
  }
  return stripPromptLabel(promptResult.imagePrompt);
}

export function formatImageAnalysis(
  promptResult: ImagePromptResponse | GeminiImagePromptResponse | StructuredImagePromptResponse
): string {
  if ("sections" in promptResult) {
    return promptResult.rawText;
  }
  return JSON.stringify(promptResult, null, 2);
}

export function formatLegacyImagePrompt(
  promptResult: GeminiImagePromptResponse
): string {
  return stripPromptLabel(promptResult.imagePrompt);
}

export function formatLegacyImageAnalysis(
  promptResult: GeminiImagePromptResponse
): string {
  return JSON.stringify(promptResult, null, 2);
}
