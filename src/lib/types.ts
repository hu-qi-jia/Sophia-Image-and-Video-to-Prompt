export const PROVIDER_TYPES = [
  { id: "openai", label: "OpenAI 兼容" },
  { id: "gemini", label: "Gemini" }
] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number]["id"];

export type ModelProvider = {
  id: string;
  name: string;
  providerType: ProviderType;
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export const TARGET_MODELS = [
  { id: "seedance-2.0", label: "Seedance 2.0" },
  { id: "generic-ai-video", label: "其他" }
] as const;

export type TargetModelId = (typeof TARGET_MODELS)[number]["id"];

export const DEFAULT_TARGET_MODEL: TargetModelId = "seedance-2.0";
export const GEMINI_ANALYSIS_MODEL = "gemini-2.5-flash";

// ── Image category types (disabled — all images use generic prompt) ──

// export const IMAGE_CATEGORIES = [
//   { id: "auto", label: "自动识别", icon: "✨", description: "自动分析图片类型，使用通用提取规则" },
//   { id: "portrait", label: "人物", icon: "👤", description: "真人写真、街拍、时尚、角色扮演、形体" },
//   { id: "anime", label: "二次元", icon: "🎨", description: "日系动漫、厚涂、概念设定、漫画、像素风" },
//   { id: "landscape", label: "风景", icon: "🏔", description: "自然风光、城市街景、夜景、室内空间、微距" },
//   { id: "product", label: "产品", icon: "📦", description: "商品棚拍、美食、美妆、服饰、数码产品" },
//   { id: "design", label: "设计", icon: "🎬", description: "平面海报、品牌LOGO、UI界面、信息图表" },
//   { id: "art", label: "艺术", icon: "🖼", description: "油画水彩、雕塑3D、抽象艺术、超现实" },
//   { id: "fantasy", label: "奇幻", icon: "⚔", description: "科幻、魔法奇幻、暗黑哥特、蒸汽/赛博朋克" },
// ] as const;

// export type ImageCategory = (typeof IMAGE_CATEGORIES)[number]["id"];

// export const DEFAULT_IMAGE_CATEGORY: ImageCategory = "auto";
export const FRAME_SAMPLING_MODES = ["fast", "standard", "detailed"] as const;
export const DEFAULT_FRAME_SAMPLING_MODE = "standard";

export type FrameSamplingMode = (typeof FRAME_SAMPLING_MODES)[number];
export type PromptFormat = "json";
export const DEFAULT_PROMPT_FORMAT: PromptFormat = "json";
export type PromptEnhancerMode = "video" | "image";
export type FrameExtractionOptions = {
  mode?: FrameSamplingMode;
};

export type AnalysisMediaType = "video" | "image";
export type AnalysisSourceType = "web" | "local" | "enhancer";

export type DetectedVideoInfo = {
  found: boolean;
  duration?: number;
  currentTime?: number;
  videoWidth?: number;
  videoHeight?: number;
  src?: string;
  pageTitle?: string;
  pageUrl?: string;
};

export type DetectedImageInfo = {
  found: boolean;
  imageWidth?: number;
  imageHeight?: number;
  src?: string;
  pageTitle?: string;
  pageUrl?: string;
  alt?: string;
};

export type ExtractedFrame = {
  timestamp: number;
  dataUrl: string;
};

export type AnalysisPhase =
  | "idle"
  | "ready"
  | "detecting"
  | "extracting"
  | "analyzing"
  | "generated"
  | "error";

export type AnalysisState = {
  tabId: number | null;
  phase: AnalysisPhase;
  statusText: string;
  errorMessage?: string;
  videoSummary?: string;
  imageSummary?: string;
  generatedPrompt?: string;
  rawResult?: string;
  promptResult?: GeminiPromptResponse;
  streamProgress?: string;
  mediaType?: AnalysisMediaType;
  sourceType?: AnalysisSourceType;
  videoInfo?: DetectedVideoInfo;
  imageInfo?: DetectedImageInfo;
  previewFrameUrl?: string;
  keyframeCount?: number;
  targetModel: TargetModelId;
  updatedAt: number;
};

export type StoredSettings = {
  models: ModelProvider[];
  activeModelId: string;
  targetModel: TargetModelId;
  frameSamplingMode: FrameSamplingMode;
  promptFormat: PromptFormat;
};

export type PromptHistoryItem = {
  id: string;
  createdAt: number;
  sourceType: AnalysisSourceType;
  mediaType: AnalysisMediaType;
  sourceUrl?: string;
  pageTitle?: string;
  thumbnailDataUrl?: string;
  promptText: string;
  videoSummary?: string;
  promptResult?: GeminiPromptResponse;
};

export type GeneratedPromptTimelineItem = {
  time: string;
  subject: string;
  action: string;
  setting: string;
  camera: string;
  mood: string;
  sound: string;
};

export type GeneratedPromptBody = {
  globalStyle: string;
  timeline: GeneratedPromptTimelineItem[];
  consistencyConstraints: string[];
};

export type GeminiVideoPromptResponse = {
  videoSummary: string;
  targetModel: string;
  generatedPrompt: GeneratedPromptBody;
};

export type GeminiImageAnalysisBody = {
  subject: string;
  scene: string;
  composition: string;
  style: string;
  lighting: string;
  colorPalette: string;
  mood: string;
  details: string;
  medium: string;
  keywords: string[];
};

export type GeminiImagePromptResponse = {
  analysis: GeminiImageAnalysisBody;
  shortPrompt: string;
  detailedPrompt: string;
  imagePrompt: string;
  styleText?: string;
  contentText?: string;
};

// ── Structured image analysis types ─────────────────────────────────

export type ImageArchetype = {
  image_domain?: string;
  visual_medium?: string;
  style_category?: string;
  scene_context?: string;
  realism_level?: string;
  source_format?: string;
};

export type SubjectItem = {
  name?: string;
  category?: string;
  identity_cues?: string;
  viewpoint?: string;
  visible_parts?: string;
  crop_state?: string;
  body_coverage?: string;
  support_contact?: string;
  expression_and_gaze?: string;
  head_orientation?: string;
  body_orientation?: string;
  facial_geometry?: string;
  pose_and_action?: string;
  limb_layout?: string;
  silhouette?: string;
  physical_attributes?: string;
  material?: string;
  surface_texture?: string;
  logos_or_symbols?: string;
  primary_colors?: string;
  position?: string;
  scale?: string;
  orientation?: string;
  interaction?: string;
};

export type ImageComposition = {
  aspect_ratio?: string;
  framing?: string;
  camera_angle?: string;
  subject_scale?: string;
  crop_boundaries?: string;
  layout_map?: string;
  negative_space_ratio?: string;
  motion_direction?: string;
  shadow_layout?: string;
  focal_behavior?: string;
  perspective_depth?: string;
  layer_structure?: string;
  negative_space?: string;
  visual_focus?: string;
};

export type LightingAndColor = {
  light_sources?: string;
  light_quality?: string;
  contrast_level?: string;
  color_temperature?: string;
  dominant_palette?: string[];
  accent_palette?: string[];
  reflections?: string;
  shadow_behavior?: string;
};

export type SetDressing = {
  background_elements?: string;
  support_surface?: string;
  prop_layers?: string;
  repeated_details?: string;
  decorative_density?: string;
  textile_folds?: string;
  jewelry_or_beads?: string;
  background_light_points?: string;
  omissions_to_avoid?: string;
};

export type AtmosphericSignature = {
  mood_temperature?: string;
  era_reference?: string;
  ambience?: string;
  air_quality?: string;
  contrast_feel?: string;
  glow_or_halation?: string;
  medium_texture?: string;
  surrealness_level?: string;
  stillness_or_motion_energy?: string;
};

export type ImageImperfections = {
  grain_or_noise?: string;
  blur?: string;
  compression_artifacts?: string;
  distortions?: string;
};

export type RecreationAnchors = {
  must_preserve?: string[];
  high_risk_errors?: string[];
  priority_order?: string;
  prompt_frontload?: string;
};

export type StructuredImagePromptResponse = {
  image_archetype: ImageArchetype;
  recreation_anchors: RecreationAnchors;
  subjects: SubjectItem[];
  composition: ImageComposition;
  set_dressing?: SetDressing;
  lighting_and_color: LightingAndColor;
  atmospheric_signature: AtmosphericSignature;
  imperfections: ImageImperfections;
  shortPrompt: string;
  detailedPrompt: string;
  negativePrompt: string;
  styleText?: string;
  contentText?: string;
};

// ── Natural language image analysis type ────────────────────────────

export type ImagePromptResponse = {
  rawText: string;
  sections: Record<string, string>;
  shortPrompt: string;
  detailedPrompt: string;
  negativePrompt: string;
  styleText: string;
  contentText: string;
  warnings: string[];
};

export type GeminiPromptResponse = GeminiVideoPromptResponse | GeminiImagePromptResponse | StructuredImagePromptResponse | ImagePromptResponse;

export type RuntimeMessage =
  | {
      type: "VIDEO2PROMPT_START_ANALYSIS";
      tabId?: number;
      triggeredFrom: "contextMenu" | "sidePanel";
      imageUrl?: string;
    }
  | {
      type: "VIDEO2PROMPT_GET_PANEL_CONTEXT";
    }
  | {
      type: "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED";
      state: AnalysisState;
    }
  | {
      type: "VIDEO2PROMPT_FOCUS_API_KEY";
    }
  | {
      type: "VIDEO2PROMPT_CLEAR_ACTIVE_ANALYSIS";
      tabId?: number;
    };
