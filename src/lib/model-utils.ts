import type { ModelProvider } from "./types";

export function hasValidApiKey(model: ModelProvider | null): boolean {
  if (!model) return false;
  return (
    model.apiKey.trim().length > 0 &&
    model.modelName.trim().length > 0 &&
    (model.providerType === "gemini" || model.baseUrl.trim().length > 0)
  );
}

export function getModelDisplayName(model: ModelProvider): string {
  return model.modelName || model.id;
}
