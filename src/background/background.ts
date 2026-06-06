import { analyzeImageStream } from "../lib/clients/aiClient";
import { fetchImageAsDataUrl } from "../lib/media/imageUtils";
import {
  addManualDrawerTab,
  clearAnalysisState,
  clearGlobalAnalysisState,
  createAnalysisState,
  getActiveModel,
  getAnalysisState,
  getGlobalAnalysisState,
  getGlobalDrawerOpen,
  getManualDrawerTabs,
  getPanelMode,
  getSettings,
  removeManualDrawerTab,
  saveAnalysisState,
  saveGlobalAnalysisState,
  setGlobalDrawerOpen,
} from "../lib/storage";
import { hasValidApiKey } from "../lib/model-utils";
import {
  DEFAULT_TARGET_MODEL,
  type AnalysisPhase,
  type AnalysisState,
  type DetectedImageInfo,
  type GeminiPromptResponse,
  type RuntimeMessage,
} from "../lib/types";

const CONTEXT_MENU_ID = "analyze-image-to-prompt";

// ── Helpers ────────────────────────────────────────────────────────

function toSerializableState(state: AnalysisState): AnalysisState {
  return { ...state, updatedAt: Date.now() };
}

async function publishState(state: AnalysisState): Promise<void> {
  const serializableState = toSerializableState(state);
  const mode = await getPanelMode();

  if (mode === "global") {
    await saveGlobalAnalysisState(serializableState);
  } else if (state.tabId != null) {
    await saveAnalysisState(serializableState);
  }

  // Broadcast to all content scripts
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED",
          state: serializableState,
        } satisfies RuntimeMessage)
        .catch(() => {});
    }
  }

  // Also broadcast to extension pages (sidepanel) via runtime
  chrome.runtime
    .sendMessage({
      type: "VIDEO2PROMPT_ANALYSIS_STATE_UPDATED",
      state: serializableState,
    } satisfies RuntimeMessage)
    .catch(() => {});
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

function buildWebImageInfo(imageUrl: string, tab?: chrome.tabs.Tab): DetectedImageInfo {
  return { found: true, src: imageUrl, pageTitle: tab?.title, pageUrl: tab?.url };
}

// ── Drawer toggle ──────────────────────────────────────────────────

async function toggleGlobalDrawer(): Promise<void> {
  const currentlyOpen = await getGlobalDrawerOpen();
  const nextOpen = !currentlyOpen;
  await setGlobalDrawerOpen(nextOpen);
  broadcastDrawer(nextOpen);
}

async function toggleManualDrawer(tabId: number): Promise<void> {
  const openTabs = await getManualDrawerTabs();
  const isOpen = openTabs.includes(tabId);
  if (isOpen) {
    await removeManualDrawerTab(tabId);
  } else {
    await addManualDrawerTab(tabId);
  }
  chrome.tabs
    .sendMessage(tabId, {
      type: "VIDEO2PROMPT_TOGGLE_DRAWER",
      tabId,
    } satisfies RuntimeMessage)
    .catch(() => {});
}

function broadcastDrawer(open: boolean): void {
  void chrome.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "VIDEO2PROMPT_SET_GLOBAL_DRAWER",
            open,
          } satisfies RuntimeMessage)
          .catch(() => {});
      }
    }
  });
}

// ── Web image analysis ─────────────────────────────────────────────

let activeAnalysisAbort: AbortController | null = null;

async function startWebImageAnalysis({
  tabId,
  imageUrl,
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
    const state = createAnalysisState(null, "error", "找不到可分析的活动标签页。", targetModel, {
      errorMessage: "找不到可分析的活动标签页。",
    });
    await publishState(state);
    return { ok: false, state };
  }

  const activeModel = getActiveModel(settings);
  const hasConfig = hasValidApiKey(activeModel);

  if (!hasConfig) {
    const state = await setState(
      resolvedTabId,
      "error",
      "需要完成模型配置。请先在设置中填写 API 密钥、基础 URL 和模型名称。",
      targetModel,
      { errorMessage: "需要完成模型配置。请先在设置中填写 API 密钥、基础 URL 和模型名称。" }
    );
    broadcastFocusApiKey();
    return { ok: false, state };
  }

  if (!imageUrl) {
    const state = await setState(
      resolvedTabId,
      "error",
      "未找到图片。请直接右键点击标准网页图片后重试。",
      targetModel,
      { errorMessage: "未找到图片。请直接右键点击标准网页图片后重试。" }
    );
    return { ok: false, state };
  }

  const imageInfo = buildWebImageInfo(imageUrl, activeTab ?? undefined);

  await setState(resolvedTabId, "detecting", "正在准备图片...", targetModel, {
    mediaType: "image",
    sourceType: "web",
    imageInfo,
    previewFrameUrl: imageUrl,
  });

  // Abort any previous analysis before starting a new one
  if (activeAnalysisAbort) {
    activeAnalysisAbort.abort();
    activeAnalysisAbort = null;
  }
  const abortController = new AbortController();
  activeAnalysisAbort = abortController;

  try {
    const baseState = await setState(resolvedTabId, "analyzing", "正在分析...", targetModel, {
      mediaType: "image",
      sourceType: "web",
      imageInfo,
      previewFrameUrl: imageUrl,
    });

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl, abortController.signal);

    let lastProgressLen = 0;
    const result = await analyzeImageStream({
      apiKey: activeModel!.apiKey,
      baseUrl: activeModel!.baseUrl,
      modelName: activeModel!.modelName,
      providerType: activeModel!.providerType,
      targetModel,
      imageDataUrl,
      imageInfo,
      signal: abortController.signal,
      onProgress: (text: string) => {
        if (text.length - lastProgressLen < 20) return;
        lastProgressLen = text.length;
        void publishState({
          ...baseState,
          streamProgress: text.slice(-600),
          updatedAt: Date.now(),
        });
      },
    });

    const state = await setState(resolvedTabId, "generated", "提示词已生成。", targetModel, {
      mediaType: "image",
      sourceType: "web",
      imageInfo,
      previewFrameUrl: imageUrl,
      imageSummary: result.imageSummary,
      generatedPrompt: result.generatedPrompt,
      rawResult: result.rawResult,
      promptResult: result.promptResult as GeminiPromptResponse,
    });

    return { ok: true, state };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const state = await setState(resolvedTabId, "idle", "分析已中止。", targetModel);
      return { ok: false, state };
    }
    const message = error instanceof Error ? error.message : "无法加载此图片进行分析。";
    const state = await setState(resolvedTabId, "error", message, targetModel, {
      mediaType: "image",
      sourceType: "web",
      imageInfo,
      previewFrameUrl: imageUrl,
      errorMessage: message,
    });
    return { ok: false, state };
  } finally {
    if (activeAnalysisAbort === abortController) {
      activeAnalysisAbort = null;
    }
  }
}

function broadcastFocusApiKey(): void {
  void chrome.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, { type: "VIDEO2PROMPT_FOCUS_API_KEY" } satisfies RuntimeMessage)
          .catch(() => {});
      }
    }
  });
}

// ── Lifecycle ──────────────────────────────────────────────────────

async function createContextMenu(): Promise<void> {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "分析图片生成提示词",
    contexts: ["image"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  void createContextMenu();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeManualDrawerTab(tabId);
  void clearAnalysisState(tabId);
});

// When a tab navigates or refreshes, clear stale per-tab state so the
// panel doesn't restore an old web-image preview on the new page.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    void removeManualDrawerTab(tabId);
    void clearAnalysisState(tabId);
  }
});

// ── Context menu ───────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;

  void (async () => {
    const mode = await getPanelMode();
    if (mode === "global") {
      await setGlobalDrawerOpen(true);
      broadcastDrawer(true);
    } else {
      await addManualDrawerTab(tab.id!);
      chrome.tabs
        .sendMessage(tab.id!, {
          type: "VIDEO2PROMPT_TOGGLE_DRAWER",
          tabId: tab.id!,
        } satisfies RuntimeMessage)
        .catch(() => {});
    }
  })();

  void startWebImageAnalysis({ tabId: tab.id, imageUrl: info.srcUrl });
});

// ── Action icon click ──────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  void (async () => {
    const mode = await getPanelMode();
    if (mode === "global") {
      await toggleGlobalDrawer();
    } else {
      await toggleManualDrawer(tab.id!);
    }
  })();
});

// ── Message handling ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, sender, sendResponse) => {
    if (message.type === "VIDEO2PROMPT_START_ANALYSIS") {
      void startWebImageAnalysis({
        tabId: message.tabId,
        imageUrl: message.imageUrl,
      }).then(sendResponse);
      return true;
    }

    if (message.type === "VIDEO2PROMPT_ABORT_ANALYSIS") {
      if (activeAnalysisAbort) {
        activeAnalysisAbort.abort();
        activeAnalysisAbort = null;
      }
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "VIDEO2PROMPT_GET_PANEL_CONTEXT") {
      void (async () => {
        const mode = await getPanelMode();
        const senderTabId = sender.tab?.id ?? null;

        let state: AnalysisState | null = null;
        if (mode === "global") {
          state = await getGlobalAnalysisState();
        } else if (senderTabId) {
          state = await getAnalysisState(senderTabId);
        }

        sendResponse({ activeTabId: senderTabId, state });
      })();
      return true;
    }

    if (message.type === "VIDEO2PROMPT_CLEAR_ACTIVE_ANALYSIS") {
      void (async () => {
        const mode = await getPanelMode();
        const activeTab = await getActiveTab();
        const resolvedTabId = message.tabId ?? activeTab?.id ?? null;

        if (mode === "global") {
          await clearGlobalAnalysisState();
        } else if (resolvedTabId) {
          await clearAnalysisState(resolvedTabId);
        }
        sendResponse({ ok: true });
      })();
      return true;
    }

    if (message.type === "VIDEO2PROMPT_SET_GLOBAL_DRAWER") {
      void (async () => {
        await setGlobalDrawerOpen(message.open);
        broadcastDrawer(message.open);
      })();
      return false;
    }

    if (message.type === "VIDEO2PROMPT_GET_DRAWER_STATE") {
      void (async () => {
        const mode = await getPanelMode();
        const senderTabId = sender.tab?.id;
        let drawerOpen = false;

        if (mode === "global") {
          drawerOpen = await getGlobalDrawerOpen();
        } else if (senderTabId) {
          const openTabs = await getManualDrawerTabs();
          drawerOpen = openTabs.includes(senderTabId);
        }

        sendResponse({ mode, drawerOpen });
      })();
      return true;
    }

    if (message.type === "SOPHIA_SET_SIZE_MODE" && message.sizeMode) {
      void chrome.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs
              .sendMessage(tab.id, {
                type: "SOPHIA_SET_SIZE_MODE",
                sizeMode: message.sizeMode,
              })
              .catch(() => {});
          }
        }
      });
      return false;
    }

    return false;
  }
);
