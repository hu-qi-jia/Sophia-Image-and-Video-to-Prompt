import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  FRAME_SAMPLING_MODES,
  PROVIDER_TYPES,
  type FrameSamplingMode,
  type ModelProvider,
  type ProviderType,
  type StoredSettings
} from "../lib/types";
import {
  defaultSettings,
  getSettings,
  saveModels,
  setActiveModel,
  deleteModel,
  saveFrameSamplingMode,
  getActiveModel
} from "../lib/storage";
import { TOAST_DURATION_MS } from "../lib/constants";

const FRAME_MODE_LABELS: Record<FrameSamplingMode, string> = {
  fast: "快速",
  standard: "标准",
  detailed: "详细"
};

export function App() {
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inline form state
  const [formProvider, setFormProvider] = useState<ProviderType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModel, setFormModel] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("https://api.openai.com/v1");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getSettings();
      setSettings(stored);
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [dropdownOpen]);

  const activeModel = getActiveModel(settings);

  function openAddForm(type: ProviderType) {
    setDropdownOpen(false);
    setEditingId(null);
    setFormProvider(type);
    setFormModel("");
    setFormKey("");
    setFormBaseUrl("https://api.openai.com/v1");
    setShowKey(false);
  }

  function openEditForm(model: ModelProvider) {
    setEditingId(model.id);
    setFormProvider(model.providerType);
    setFormModel(model.modelName);
    setFormKey(model.apiKey);
    setFormBaseUrl(model.baseUrl || "https://api.openai.com/v1");
    setShowKey(false);
  }

  function cancelForm() {
    setFormProvider(null);
    setEditingId(null);
  }

  async function handleSaveForm() {
    if (!formProvider) return;

    if (!formModel.trim()) {
      setStatusMessage("请填写模型名称。");
      setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
      return;
    }
    if (!formKey.trim()) {
      setStatusMessage("请填写 API 密钥。");
      setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
      return;
    }
    if (formProvider === "openai" && !formBaseUrl.trim()) {
      setStatusMessage("请填写接口地址。");
      setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
      return;
    }

    const model: ModelProvider = {
      id: editingId ?? crypto.randomUUID(),
      name: formModel.trim() || "未命名",
      providerType: formProvider,
      apiKey: formKey.trim(),
      baseUrl: formProvider === "openai" ? (formBaseUrl.trim() || "https://api.openai.com/v1") : "",
      modelName: formModel.trim(),
    };

    let nextModels: ModelProvider[];
    if (editingId) {
      nextModels = settings.models.map((m) => (m.id === editingId ? model : m));
    } else {
      nextModels = [...settings.models, model];
    }

    const nextSettings = await saveModels(nextModels);
    if (!editingId) {
      const withActive = await setActiveModel(model.id);
      setSettings(withActive);
    } else {
      setSettings(nextSettings);
    }
    setStatusMessage(editingId ? "模型已更新。" : "模型已添加。");
    setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
    cancelForm();
  }

  async function handleDeleteModel(modelId: string) {
    const confirmed = window.confirm("确定删除此模型配置吗？");
    if (!confirmed) return;
    const nextSettings = await deleteModel(modelId);
    setSettings(nextSettings);
    if (editingId === modelId) cancelForm();
    setStatusMessage("模型已删除。");
    setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
  }

  async function handleSelectModel(modelId: string) {
    if (modelId === settings.activeModelId) return;
    const nextSettings = await setActiveModel(modelId);
    setSettings(nextSettings);
  }

  async function handleClose() {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      if (currentTab?.id) {
        await chrome.tabs.remove(currentTab.id);
        return;
      }
    } catch { /* not a tab */ }
    window.close();
  }

  async function handleFrameSamplingModeChange(event: ChangeEvent<HTMLSelectElement>) {
    const mode = event.target.value as FrameSamplingMode;
    const nextSettings = await saveFrameSamplingMode(mode);
    setSettings(nextSettings);
    setStatusMessage("帧采样模式已保存。");
    setTimeout(() => setStatusMessage(null), TOAST_DURATION_MS);
  }

  const showForm = formProvider !== null;

  return (
    <main className="sophia-shell options-shell">
      {/* Header */}
      <section className="sophia-card header-card options-header-card">
        <div className="header-top">
          <div className="brand-lockup options-header-copy">
            <img src="icons/logo_new1.png" alt="" className="brand-icon" />
            <img src="icons/logoword.png" alt="Sophia" className="brand-wordmark-img" />
            <p className="options-header-subtitle">模型设置</p>
          </div>
          <button className="settings-pill" onClick={handleClose}>关闭</button>
        </div>
        <p>管理 Sophia 用于分析图片和视频的模型配置。</p>
        <div className="settings-status-row">
          <span className={`settings-status-pill ${activeModel ? "is-ready" : "is-required"}`}>
            {activeModel ? `${settings.models.length} 个模型` : "需要配置"}
          </span>
          <span className="settings-status-copy">
            配置一个或多个模型后，选择其一用于分析。
          </span>
        </div>
        <span className="header-glow" aria-hidden="true" />
      </section>

      {/* Model config */}
      <section className="sophia-card settings-panel-card">
        {/* Dropdown + title row */}
        <div className="settings-section-head">
          <div>
            <div className="card-title">模型配置</div>
            <p className="settings-copy">支持 OpenAI 兼容接口与 Gemini 原生接口。</p>
          </div>
          <div className={`add-model-dropdown${dropdownOpen ? " open" : ""}`} ref={dropdownRef}>
            <button className="add-model-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              + 添加模型
            </button>
            {dropdownOpen ? (
              <div className="add-model-menu">
                {PROVIDER_TYPES.map((pt) => (
                  <button key={pt.id} className="add-model-menu-item" onClick={() => openAddForm(pt.id)}>
                    <div>
                      <div className="add-model-menu-item-label">{pt.label}</div>
                      <div className="add-model-menu-item-desc">
                        {pt.id === "openai" ? "支持任意兼容 OpenAI 接口的模型" : "Google Gemini 原生接口"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Inline config form */}
        {showForm ? (
          <div className="model-config-form">
            <div className="card-title" style={{ marginBottom: "var(--space-3)" }}>
              {editingId ? "编辑模型" : `添加${PROVIDER_TYPES.find((p) => p.id === formProvider)?.label ?? ""}模型`}
            </div>

            <label className="settings-field">
              <span>模型名称</span>
              <input type="text" value={formModel} onChange={(e) => setFormModel(e.target.value)}
                placeholder={formProvider === "gemini" ? "例如 gemini-2.5-flash" : "例如 gpt-4o、deepseek-chat"} autoComplete="off" />
            </label>

            {formProvider === "openai" ? (
              <label className="settings-field">
                <span>接口地址</span>
                <input type="text" value={formBaseUrl} onChange={(e) => setFormBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1" autoComplete="off" />
              </label>
            ) : null}

            <label className="settings-field">
              <span>API 密钥</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input type={showKey ? "text" : "password"} value={formKey} onChange={(e) => setFormKey(e.target.value)}
                  placeholder={formProvider === "gemini" ? "输入 Gemini API 密钥" : "输入 API 密钥"}
                  autoComplete="off" style={{ paddingRight: 40 }} />
                <button type="button" className="icon-btn-sm" style={{ position: "absolute", right: 4 }}
                  onClick={() => setShowKey(!showKey)}>
                  {showKey ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </label>

            <div className="settings-actions">
              <button className="btn-secondary" onClick={cancelForm}>取消</button>
              <button className="btn-primary-sm" onClick={handleSaveForm}>
                {editingId ? "保存修改" : "添加模型"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Model list */}
        {settings.models.length > 0 ? (
          <>
            <div className="settings-divider" style={{ marginTop: "var(--space-4)" }} />
            <div className="card-title" style={{ marginBottom: "var(--space-2)" }}>已配置模型</div>
            <div className="model-list">
              {settings.models.map((model) => (
                <div
                  key={model.id}
                  className={`model-list-item${model.id === settings.activeModelId ? " is-active" : ""}`}
                  onClick={() => handleSelectModel(model.id)}
                >
                  <div className="model-list-select">
                    <div className={`model-list-radio${model.id === settings.activeModelId ? " is-selected" : ""}`} />
                  </div>
                  <div className="model-list-info">
                    <div className="model-list-name">
                      <div>{model.name || "未命名"}</div>
                      <span className={`provider-badge provider-badge--${model.providerType}`}>
                        {PROVIDER_TYPES.find((p) => p.id === model.providerType)?.label ?? model.providerType}
                      </span>
                    </div>
                  </div>
                  <div className="model-list-actions">
                    <button className="icon-btn-sm" title="编辑" onClick={(e) => { e.stopPropagation(); openEditForm(model); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn-sm icon-btn-sm--danger" title="删除" onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : showForm ? null : (
          <div className="model-empty" style={{ marginTop: "var(--space-3)" }}>尚未配置模型，点击上方按钮添加。</div>
        )}

        <div className="settings-divider" style={{ marginTop: "var(--space-4)" }} />

        {/* Frame sampling */}
        <label className="settings-field">
          <span>帧采样模式</span>
          <select value={settings.frameSamplingMode} onChange={handleFrameSamplingModeChange}
            className="settings-select"
            title="快速：更快更轻量。标准：推荐默认。详细：为复杂本地视频提取更多帧。">
            {FRAME_SAMPLING_MODES.map((mode) => (
              <option key={mode} value={mode}>{FRAME_MODE_LABELS[mode]}</option>
            ))}
          </select>
        </label>
        <p className="settings-copy">快速模式更快捷，标准模式为推荐选项，详细模式为复杂本地视频提取更多帧。图片分析不使用帧采样。</p>

        <div className="settings-divider" />
        <div className="settings-mini-card">
          <div className="settings-mini-title">隐私</div>
          <p className="settings-copy">本地视频帧和所选图片将直接从您的浏览器发送至配置的 API 端点进行分析。</p>
          <p className="settings-copy">请仅分析您愿意发送至该服务的媒体内容。</p>
        </div>
      </section>

      {statusMessage ? <div className="toast-modern">{statusMessage}</div> : null}
    </main>
  );
}
