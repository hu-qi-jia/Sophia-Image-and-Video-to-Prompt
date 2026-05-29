import { analyzeImageStream } from "../lib/clients/aiClient";
import { fetchImageAsDataUrl } from "../lib/media/imageUtils";
import {
  clearAnalysisState,
  createAnalysisState,
  getActiveModel,
  getAnalysisState,
  getSettings,
  saveAnalysisState
} from "../lib/storage";
import {
  DEFAULT_TARGET_MODEL,
  type AnalysisPhase,
  type AnalysisState,
  type DetectedImageInfo,
  type GeminiPromptResponse,
  type RuntimeMessage
} from "../lib/types";

const CONTEXT_MENU_ID = "analyze-image-to-prompt";

async function configureSidePanelBehavior(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
}

async function createContextMenu(): Promise<void> {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "分析图片生成提示词",
    contexts: ["image"]
  });
}

function toSerializableState(state: AnalysisState): AnalysisState {
  return {
    ...state,
    updatedAt: Date.now()
  };
}

async function publishState(state: AnalysisState): Promise<void> {
  const serializableState = toSerializableState(state);
  await saveAnalysisState(serializableState);
  try {
    await chrome.runtime.sendMessage({
      type: "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED",
      state: serializableState
    } satisfies RuntimeMessage);
  } catch {
    // Ignore when the side panel is closed and no receiver is listening.
  }
}

async function setState(
  tabId: number,
  phase: AnalysisPhase,
  statusText: string,
  targetModel: AnalysisState["targetModel"],
  extras: Partial<AnalysisState> = {}
): Promise<AnalysisState> {
  const state = createAnalysisState(tabId, phase, statusText, targetModel, extras);
  await publishState(state);
  return state;
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0] ?? null;
}

function openSidePanelForTab(tabId: number): void {
  chrome.sidePanel.open({ tabId }).catch((error) => {
    console.error("PromptLab failed to open side panel.", error);
  });
}

function buildWebImageInfo(
  imageUrl: string,
  tab?: chrome.tabs.Tab
): DetectedImageInfo {
  return {
    found: true,
    src: imageUrl,
    pageTitle: tab?.title,
    pageUrl: tab?.url
  };
}

async function startWebImageAnalysis({
  tabId,
  imageUrl
}: {
  tabId?: number;
  imageUrl?: string;
}): Promise<{ ok: boolean; state: AnalysisState }> {
  const activeTab = tabId
    ? await chrome.tabs.get(tabId).catch(() => null)
    : await getActiveTab();
  const resolvedTabId = activeTab?.id ?? null;
  const settings = await getSettings();
  const targetModel = settings.targetModel ?? DEFAULT_TARGET_MODEL;

  if (!resolvedTabId) {
    const state = createAnalysisState(
      null,
      "error",
      "找不到可分析的活动标签页。",
      targetModel,
      { errorMessage: "找不到可分析的活动标签页。" }
    );
    await publishState(state);
    return { ok: false, state };
  }

  const activeModel = getActiveModel(settings);
  const hasConfig = activeModel !== null
    && activeModel.apiKey.trim().length > 0
    && activeModel.modelName.trim().length > 0
    && (activeModel.providerType === "gemini" || activeModel.baseUrl.trim().length > 0);

  if (!hasConfig) {
    const state = await setState(
      resolvedTabId,
      "error",
      "需要完成模型配置。请先在设置中填写 API 密钥、基础 URL 和模型名称。",
      targetModel,
      {
        errorMessage: "需要完成模型配置。请先在设置中填写 API 密钥、基础 URL 和模型名称。"
      }
    );
    try {
      await chrome.runtime.sendMessage({
        type: "VIDEO2PROMPT_FOCUS_API_KEY"
      } satisfies RuntimeMessage);
    } catch {
    }
    return { ok: false, state };
  }

  if (!imageUrl) {
    const state = await setState(
      resolvedTabId,
      "error",
      "未找到图片。请直接右键点击标准网页图片后重试。",
      targetModel,
      {
        errorMessage:
          "未找到图片。请直接右键点击标准网页图片后重试。"
      }
    );
    return { ok: false, state };
  }

  const imageInfo = buildWebImageInfo(imageUrl, activeTab ?? undefined);

  await setState(resolvedTabId, "detecting", "正在准备图片...", targetModel, {
    mediaType: "image",
    sourceType: "web",
    imageInfo,
    previewFrameUrl: imageUrl
  });

  try {
    const baseState = await setState(resolvedTabId, "analyzing", "正在分析...", targetModel, {
      mediaType: "image",
      sourceType: "web",
      imageInfo,
      previewFrameUrl: imageUrl
    });

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);

    let lastProgressLen = 0;
    const result = await analyzeImageStream({
      apiKey: activeModel!.apiKey,
      baseUrl: activeModel!.baseUrl,
      modelName: activeModel!.modelName,
      providerType: activeModel!.providerType,
      targetModel,
      imageDataUrl,
      imageInfo,
      onProgress: (text: string) => {
        if (text.length - lastProgressLen < 20) return;
        lastProgressLen = text.length;
        void publishState({
          ...baseState,
          streamProgress: text.slice(-600),
          updatedAt: Date.now()
        });
      }
    });

    const state = await setState(
      resolvedTabId,
      "generated",
      "提示词已生成。",
      targetModel,
      {
        mediaType: "image",
        sourceType: "web",
        imageInfo,
        previewFrameUrl: imageUrl,
        imageSummary: result.imageSummary,
        generatedPrompt: result.generatedPrompt,
        rawResult: result.rawResult,
        promptResult: result.promptResult as GeminiPromptResponse
      }
    );

    return { ok: true, state };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "无法加载此图片进行分析。";

    const state = await setState(resolvedTabId, "error", message, targetModel, {
      mediaType: "image",
      sourceType: "web",
      imageInfo,
      previewFrameUrl: imageUrl,
      errorMessage: message
    });
    return { ok: false, state };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void (async () => {
    await configureSidePanelBehavior();
    await chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true
    });
    await createContextMenu();
  })();
});

chrome.runtime.onStartup.addListener(() => {
  void (async () => {
    await configureSidePanelBehavior();
    await chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true
    });
  })();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  openSidePanelForTab(tab.id);

  void startWebImageAnalysis({
    tabId: tab.id,
    imageUrl: info.srcUrl
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) {
    return;
  }

  openSidePanelForTab(tab.id);
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === "VIDEO2PROMPT_START_ANALYSIS") {
    void startWebImageAnalysis({
      tabId: message.tabId,
      imageUrl: message.imageUrl
    }).then(sendResponse);
    return true;
  }

  if (message.type === "VIDEO2PROMPT_GET_PANEL_CONTEXT") {
    void (async () => {
      const activeTab = await getActiveTab();
      const activeTabId = activeTab?.id ?? null;
      const state = activeTabId ? await getAnalysisState(activeTabId) : null;
      sendResponse({
        activeTabId,
        state
      });
    })();
    return true;
  }

  if (message.type === "VIDEO2PROMPT_CLEAR_ACTIVE_ANALYSIS") {
    void (async () => {
      const activeTab = await getActiveTab();
      const resolvedTabId = message.tabId ?? activeTab?.id ?? null;
      if (!resolvedTabId) {
        sendResponse({ ok: false });
        return;
      }

      await clearAnalysisState(resolvedTabId);
      sendResponse({ ok: true });
    })();
    return true;
  }

  return false;
});
