import {
  DEFAULT_FRAME_SAMPLING_MODE,
  DEFAULT_PROMPT_FORMAT,
  DEFAULT_TARGET_MODEL,
  TARGET_MODELS,
  type AnalysisPhase,
  type AnalysisState,
  type FrameSamplingMode,
  type ModelProvider,
  type PromptFormat,
  type PromptHistoryItem,
  type ProviderType,
  type StoredSettings,
  type TargetModelId
} from "./types";

const SETTINGS_KEY = "video2prompt:settings";
const ANALYSIS_KEY_PREFIX = "video2prompt:analysis:";
const HISTORY_KEY = "video2prompt:history";

export const defaultSettings: StoredSettings = {
  models: [],
  activeModelId: "",
  targetModel: DEFAULT_TARGET_MODEL,
  frameSamplingMode: DEFAULT_FRAME_SAMPLING_MODE,
  promptFormat: DEFAULT_PROMPT_FORMAT
};

function normalizeTargetModel(value: unknown): TargetModelId {
  if (TARGET_MODELS.some((model) => model.id === value)) {
    return value as TargetModelId;
  }

  if (value === "happyhorse-1.0") {
    return "generic-ai-video";
  }

  return DEFAULT_TARGET_MODEL;
}

function normalizePromptFormat(value: unknown): PromptFormat {
  if (value === "json") {
    return value;
  }
  return DEFAULT_PROMPT_FORMAT;
}

function normalizeFrameSamplingMode(value: unknown): FrameSamplingMode {
  if (value === "fast" || value === "standard" || value === "detailed") {
    return value;
  }

  return DEFAULT_FRAME_SAMPLING_MODE;
}

export function createAnalysisState(
  tabId: number | null,
  phase: AnalysisPhase,
  statusText: string,
  targetModel: TargetModelId,
  extras: Partial<AnalysisState> = {}
): AnalysisState {
  return {
    tabId,
    phase,
    statusText,
    targetModel,
    updatedAt: Date.now(),
    ...extras
  };
}

export async function getSettings(): Promise<StoredSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const raw = stored[SETTINGS_KEY] as Record<string, unknown> | undefined;
  if (!raw) {
    return { ...defaultSettings };
  }

  const rawModels = raw.models as ModelProvider[] | undefined;
  const hasModels = Array.isArray(rawModels) && rawModels.length > 0;

  const models: ModelProvider[] = hasModels
    ? rawModels
    : migrateLegacyModel(raw);

  return {
    models,
    activeModelId: (raw.activeModelId as string) ?? (models.length > 0 ? models[0].id : ""),
    targetModel: normalizeTargetModel(raw.targetModel),
    frameSamplingMode: normalizeFrameSamplingMode(raw.frameSamplingMode),
    promptFormat: normalizePromptFormat(raw.promptFormat)
  };
}

function migrateLegacyModel(raw: Record<string, unknown>): ModelProvider[] {
  const legacyApiKey =
    (raw.apiKey as string) ||
    (raw.openaiApiKey as string) ||
    (raw.geminiApiKey as string) ||
    "";
  const legacyBaseUrl = (raw.baseUrl as string) || (raw.openaiBaseUrl as string) || "";
  const legacyModelName = (raw.modelName as string) || "";

  if (!legacyApiKey && !legacyBaseUrl && !legacyModelName) {
    return [];
  }

  return [{
    id: crypto.randomUUID(),
    name: "默认模型",
    providerType: "openai" as ProviderType,
    apiKey: legacyApiKey,
    baseUrl: legacyBaseUrl || "https://api.openai.com/v1",
    modelName: legacyModelName
  }];
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_KEY]: settings
  });
}

export function getActiveModel(settings: StoredSettings): ModelProvider | null {
  if (!settings.activeModelId || settings.models.length === 0) return null;
  return settings.models.find((m) => m.id === settings.activeModelId) ?? null;
}

export async function saveModels(models: ModelProvider[]): Promise<StoredSettings> {
  const current = await getSettings();
  const nextActiveId = models.find((m) => m.id === current.activeModelId)
    ? current.activeModelId
    : models.length > 0 ? models[0].id : "";
  const next = { ...current, models, activeModelId: nextActiveId };
  await saveSettings(next);
  return next;
}

export async function setActiveModel(modelId: string): Promise<StoredSettings> {
  const current = await getSettings();
  const next = { ...current, activeModelId: modelId };
  await saveSettings(next);
  return next;
}

export async function deleteModel(modelId: string): Promise<StoredSettings> {
  const current = await getSettings();
  const nextModels = current.models.filter((m) => m.id !== modelId);
  return saveModels(nextModels);
}

export async function saveTargetModel(
  targetModel: TargetModelId
): Promise<StoredSettings> {
  const current = await getSettings();
  const next = { ...current, targetModel };
  await saveSettings(next);
  return next;
}

export async function saveFrameSamplingMode(
  frameSamplingMode: FrameSamplingMode
): Promise<StoredSettings> {
  const current = await getSettings();
  const next = { ...current, frameSamplingMode };
  await saveSettings(next);
  return next;
}

export async function savePromptFormat(
  promptFormat: PromptFormat
): Promise<StoredSettings> {
  const current = await getSettings();
  const next = { ...current, promptFormat };
  await saveSettings(next);
  return next;
}

export function analysisStorageKey(tabId: number): string {
  return `${ANALYSIS_KEY_PREFIX}${tabId}`;
}

export async function getAnalysisState(
  tabId: number
): Promise<AnalysisState | null> {
  const key = analysisStorageKey(tabId);
  const stored = await chrome.storage.local.get(key);
  return (stored[key] as AnalysisState | undefined) ?? null;
}

export async function saveAnalysisState(state: AnalysisState): Promise<void> {
  if (state.tabId == null) {
    return;
  }

  await chrome.storage.local.set({
    [analysisStorageKey(state.tabId)]: state
  });
}

export async function clearAnalysisState(tabId: number): Promise<void> {
  await chrome.storage.local.remove(analysisStorageKey(tabId));
}

export async function getPromptHistory(): Promise<PromptHistoryItem[]> {
  const stored = await chrome.storage.local.get(HISTORY_KEY);
  const history = stored[HISTORY_KEY];
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((item) => {
    const normalized = item as Partial<PromptHistoryItem>;
    return {
      id: normalized.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: normalized.createdAt ?? Date.now(),
      sourceType:
        normalized.sourceType === "web"
          ? "web"
          : normalized.sourceType === "enhancer"
            ? "enhancer"
            : "local",
      mediaType:
        normalized.mediaType ??
        (normalized.sourceType === "web" ? "image" : normalized.sourceType === "enhancer" ? "video" : "video"),
      sourceUrl: normalized.sourceUrl,
      pageTitle: normalized.pageTitle,
      thumbnailDataUrl: normalized.thumbnailDataUrl,
      promptText: normalized.promptText ?? "",
      videoSummary: normalized.videoSummary,
      promptResult: normalized.promptResult
    };
  });
}

async function savePromptHistory(
  history: PromptHistoryItem[]
): Promise<PromptHistoryItem[]> {
  const next = history.slice(0, 20);
  await chrome.storage.local.set({
    [HISTORY_KEY]: next
  });
  return next;
}

export async function savePromptHistoryItem(
  item: PromptHistoryItem
): Promise<PromptHistoryItem[]> {
  const current = await getPromptHistory();
  return savePromptHistory([item, ...current]);
}

export async function deletePromptHistoryItem(
  id: string
): Promise<PromptHistoryItem[]> {
  const current = await getPromptHistory();
  return savePromptHistory(current.filter((item) => item.id !== id));
}
