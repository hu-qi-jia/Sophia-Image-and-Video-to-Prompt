import { useState } from "react";
import {
  defaultSettings,
  deleteModel,
  getActiveModel,
  saveFrameSamplingMode,
  saveModels,
  setActiveModel,
  setPanelMode,
} from "../lib/storage";
import type { FrameSamplingMode, ModelProvider, PanelMode, StoredSettings } from "../lib/types";
import { hasValidApiKey } from "../lib/model-utils";

export function useSettings(showToast: (msg: string) => void) {
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);

  const activeModel = getActiveModel(settings);
  const hasApiKey = hasValidApiKey(activeModel);

  async function handleSelectModel(modelId: string) {
    const next = await setActiveModel(modelId);
    setSettings(next);
    showToast("已切换模型");
  }

  async function handleAddModel(model: ModelProvider) {
    await saveModels([...settings.models, model]);
    const next = await setActiveModel(model.id);
    setSettings(next);
    showToast("模型已添加");
  }

  async function handleUpdateModel(model: ModelProvider) {
    const next = settings.models.map((m) => (m.id === model.id ? model : m));
    const s = await saveModels(next);
    setSettings(s);
    showToast("模型已更新");
  }

  async function handleDeleteModel(modelId: string) {
    if (!window.confirm("确定删除此模型配置吗？")) return;
    const next = await deleteModel(modelId);
    setSettings(next);
    showToast("模型已删除");
  }

  async function handlePanelModeChange(mode: PanelMode) {
    await setPanelMode(mode);
    setSettings((prev) => ({ ...prev, panelMode: mode }));
    showToast(mode === "global" ? "已切换为全局模式" : "已切换为手动模式");
  }

  async function handleFrameSamplingModeChange(mode: FrameSamplingMode) {
    if (settings.frameSamplingMode === mode) return;
    const next = await saveFrameSamplingMode(mode);
    setSettings(next);
    showToast("帧采样模式已保存");
  }

  return {
    settings,
    setSettings,
    activeModel,
    hasApiKey,
    handleSelectModel,
    handleAddModel,
    handleUpdateModel,
    handleDeleteModel,
    handlePanelModeChange,
    handleFrameSamplingModeChange,
  };
}
