import { useState, useRef, useCallback, useEffect } from "react";
import { type ModelProvider, type ProviderType, type StoredSettings, type PanelMode, type PanelSizeMode, PROVIDER_TYPES } from "../lib/types";
import { getActiveModel } from "../lib/storage";
import { BackIcon } from "./icons";
import { useClickOutside } from "./useClickOutside";

interface SettingsViewProps {
  settings: StoredSettings;
  panelSizeMode?: PanelSizeMode;
  onBack: () => void;
  onSelectModel: (modelId: string) => void;
  onAddModel: (model: ModelProvider) => void;
  onUpdateModel: (model: ModelProvider) => void;
  onDeleteModel: (modelId: string) => void;
  onPanelModeChange: (mode: PanelMode) => void;
}

export function SettingsView({
  settings,
  panelSizeMode = "standard",
  onBack,
  onSelectModel,
  onAddModel,
  onUpdateModel,
  onDeleteModel,
  onPanelModeChange,
}: SettingsViewProps) {
  const activeModel = getActiveModel(settings);
  const isCompact = panelSizeMode === "compact";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useClickOutside(dropdownOpen, () => setDropdownOpen(false));

  const [addFormProvider, setAddFormProvider] = useState<ProviderType | null>(null);
  const [addFormModel, setAddFormModel] = useState("");
  const [addFormKey, setAddFormKey] = useState("");
  const [addFormBaseUrl, setAddFormBaseUrl] = useState("https://api.openai.com/v1");
  const [showAddKey, setShowAddKey] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormModel, setEditFormModel] = useState("");
  const [editFormKey, setEditFormKey] = useState("");
  const [editFormBaseUrl, setEditFormBaseUrl] = useState("https://api.openai.com/v1");
  const [showEditKey, setShowEditKey] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  function openAddForm(type: ProviderType) {
    setDropdownOpen(false);
    setAddErrorMsg(null);
    setAddFormProvider(type);
    setAddFormModel("");
    setAddFormKey("");
    setAddFormBaseUrl("https://api.openai.com/v1");
    setShowAddKey(false);
    setEditingId(null);
  }

  function cancelAddForm() {
    setAddFormProvider(null);
    setAddErrorMsg(null);
  }

  function handleAddSave() {
    if (!addFormProvider) return;

    if (!addFormModel.trim()) {
      setAddErrorMsg("请填写模型名称");
      return;
    }
    if (!addFormKey.trim()) {
      setAddErrorMsg("请填写 API 密钥");
      return;
    }
    if (addFormProvider === "openai" && !addFormBaseUrl.trim()) {
      setAddErrorMsg("请填写接口地址");
      return;
    }

    setAddErrorMsg(null);
    const model: ModelProvider = {
      id: crypto.randomUUID(),
      name: addFormModel.trim() || "未命名",
      providerType: addFormProvider,
      apiKey: addFormKey.trim(),
      baseUrl: addFormProvider === "openai" ? (addFormBaseUrl.trim() || "https://api.openai.com/v1") : "",
      modelName: addFormModel.trim(),
    };
    onAddModel(model);
    cancelAddForm();
  }

  function openEditForm(model: ModelProvider) {
    setEditingId(model.id);
    setEditErrorMsg(null);
    setEditFormModel(model.modelName);
    setEditFormKey(model.apiKey);
    setEditFormBaseUrl(model.baseUrl || "https://api.openai.com/v1");
    setShowEditKey(false);
    setAddFormProvider(null);
  }

  function cancelEditForm() {
    setEditingId(null);
    setEditErrorMsg(null);
  }

  function handleEditSave() {
    if (!editingId) return;

    if (!editFormModel.trim()) {
      setEditErrorMsg("请填写模型名称");
      return;
    }
    if (!editFormKey.trim()) {
      setEditErrorMsg("请填写 API 密钥");
      return;
    }

    const originalModel = settings.models.find(m => m.id === editingId);
    if (!originalModel) return;

    if (originalModel.providerType === "openai" && !editFormBaseUrl.trim()) {
      setEditErrorMsg("请填写接口地址");
      return;
    }

    setEditErrorMsg(null);
    const model: ModelProvider = {
      id: editingId,
      name: editFormModel.trim() || "未命名",
      providerType: originalModel.providerType,
      apiKey: editFormKey.trim(),
      baseUrl: originalModel.providerType === "openai" ? (editFormBaseUrl.trim() || "https://api.openai.com/v1") : "",
      modelName: editFormModel.trim(),
    };
    onUpdateModel(model);
    cancelEditForm();
  }

  const showAddForm = addFormProvider !== null;

  return (
    <section className="subview-screen">
      <div className="subview-topbar">
        <div className="subview-title-row">
          <button className="back-button back-button-box" onClick={onBack}>
            <BackIcon />
          </button>
          <h2 className="subview-title">设置</h2>
        </div>
      </div>
      <section className={`settings-stack${isCompact ? " settings-stack--compact" : " settings-stack--standard"}`}>
        <article className="sophia-card settings-hero-card">
          <div className="settings-hero-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="settings-hero-title">模型配置</h3>
            <div className={`add-model-dropdown${dropdownOpen ? " open" : ""}`} ref={dropdownRef}>
              <button className="add-model-trigger-icon" onClick={() => setDropdownOpen((v) => !v)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              {dropdownOpen ? (
                <div className="add-model-menu" onMouseDown={(e) => e.stopPropagation()}>
                  {PROVIDER_TYPES.map((pt) => (
                    <button key={pt.id} className="add-model-menu-item" onClick={() => { openAddForm(pt.id); setDropdownOpen(false); }}>
                      <div>
                        <div className="add-model-menu-item-label">{pt.label}</div>
                        <div className="add-model-menu-item-desc">
                          {pt.id === "openai" ? "支持兼容OpenAI接口模型" : "Google Gemini 原生接口"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Add model form */}
          {showAddForm ? (
            <div className="model-config-form">
              <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-3)" }}>
                添加{PROVIDER_TYPES.find((p) => p.id === addFormProvider)?.label ?? ""}模型
              </div>

              <label className="settings-field settings-field-large">
                <span>模型名称</span>
                <input type="text" value={addFormModel} onChange={(e) => setAddFormModel(e.target.value)}
                  placeholder={addFormProvider === "gemini" ? "例如 gemini-2.5-flash" : "例如 gpt-4o、deepseek-chat"} autoComplete="off" />
              </label>

              {addFormProvider === "openai" ? (
                <label className="settings-field settings-field-large">
                  <span>接口地址</span>
                  <input type="text" value={addFormBaseUrl} onChange={(e) => setAddFormBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1" autoComplete="off" />
                </label>
              ) : null}

              <label className="settings-field settings-field-large">
                <span>API 密钥</span>
                <div className="settings-input-wrap">
                  <input type={showAddKey ? "text" : "password"} value={addFormKey} onChange={(e) => setAddFormKey(e.target.value)}
                    placeholder={addFormProvider === "gemini" ? "输入 Gemini API 密钥" : "输入 API 密钥"} autoComplete="off" />
                  <button type="button" className="input-icon-button" onClick={() => setShowAddKey(!showAddKey)}>
                    {showAddKey ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </label>

              {addErrorMsg ? (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginBottom: "var(--space-2)" }}>{addErrorMsg}</div>
              ) : null}
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn-secondary" onClick={cancelAddForm}>取消</button>
                <button className="btn-primary btn-dark" onClick={handleAddSave} style={{ flex: 1 }}>添加模型</button>
              </div>
            </div>
          ) : null}

          {/* Model list */}
          {settings.models.length > 0 ? (
            <div className="model-table">
              {PROVIDER_TYPES.map((pt) => {
                const groupModels = settings.models.filter(m => m.providerType === pt.id);
                if (groupModels.length === 0) return null;
                return (
                  <ModelGroup
                    key={pt.id}
                    label={pt.label}
                    models={groupModels}
                    activeModelId={settings.activeModelId}
                    editingId={editingId}
                    editFormModel={editFormModel}
                    editFormKey={editFormKey}
                    editFormBaseUrl={editFormBaseUrl}
                    showEditKey={showEditKey}
                    editErrorMsg={editErrorMsg}
                    onSelectModel={onSelectModel}
                    onDeleteModel={onDeleteModel}
                    onOpenEditForm={openEditForm}
                    onCancelEditForm={cancelEditForm}
                    onEditFormModelChange={setEditFormModel}
                    onEditFormKeyChange={setEditFormKey}
                    onEditFormBaseUrlChange={setEditFormBaseUrl}
                    onShowEditKeyChange={setShowEditKey}
                    onEditSave={handleEditSave}
                  />
                );
              })}
            </div>
          ) : showAddForm ? null : (
            <div className="model-empty">尚未配置模型，点击 + 添加开始配置</div>
          )}
        </article>
        <div className="settings-right-panel">
        <article className="sophia-card settings-panel-mode-card">
          <div className="settings-hero-top">
            <h3 className="settings-hero-title">面板模式</h3>
          </div>
          <div className="settings-hero-divider" />
          <div className="panel-mode-options">
            <label
              className={`panel-mode-option${settings.panelMode === "global" ? " is-active" : ""}`}
              onClick={() => onPanelModeChange("global")}
            >
              <div className="panel-mode-radio">
                <div className={`panel-mode-dot${settings.panelMode === "global" ? " is-selected" : ""}`} />
              </div>
              <div className="panel-mode-body">
                <span className="panel-mode-label">全局模式</span>
                <span className="panel-mode-desc">所有标签页同步显示，切换标签页时面板保持打开</span>
              </div>
            </label>
            <label
              className={`panel-mode-option${settings.panelMode === "manual" ? " is-active" : ""}`}
              onClick={() => onPanelModeChange("manual")}
            >
              <div className="panel-mode-radio">
                <div className={`panel-mode-dot${settings.panelMode === "manual" ? " is-selected" : ""}`} />
              </div>
              <div className="panel-mode-body">
                <span className="panel-mode-label">手动模式</span>
                <span className="panel-mode-desc">仅在当前标签页显示，每个标签页独立控制</span>
              </div>
            </label>
          </div>
        </article>
        <article className="sophia-card settings-privacy-card">
          <div className="settings-privacy-row">
            <div className="settings-privacy-copy">
              <h3 className="settings-privacy-title">隐私</h3>
              <p>你的 API 密钥和配置仅存储在浏览器本地，不会上传至任何服务器</p>
            </div>
          </div>
        </article>
        </div>
      </section>
    </section>
  );
}

interface ModelGroupProps {
  label: string;
  models: ModelProvider[];
  activeModelId: string;
  editingId: string | null;
  editFormModel: string;
  editFormKey: string;
  editFormBaseUrl: string;
  showEditKey: boolean;
  editErrorMsg: string | null;
  onSelectModel: (modelId: string) => void;
  onDeleteModel: (modelId: string) => void;
  onOpenEditForm: (model: ModelProvider) => void;
  onCancelEditForm: () => void;
  onEditFormModelChange: (val: string) => void;
  onEditFormKeyChange: (val: string) => void;
  onEditFormBaseUrlChange: (val: string) => void;
  onShowEditKeyChange: (val: boolean) => void;
  onEditSave: () => void;
}

function ModelGroup({
  label,
  models,
  activeModelId,
  editingId,
  editFormModel,
  editFormKey,
  editFormBaseUrl,
  showEditKey,
  editErrorMsg,
  onSelectModel,
  onDeleteModel,
  onOpenEditForm,
  onCancelEditForm,
  onEditFormModelChange,
  onEditFormKeyChange,
  onEditFormBaseUrlChange,
  onShowEditKeyChange,
  onEditSave,
}: ModelGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`model-group${collapsed ? " is-collapsed" : ""}`}>
      <button className="model-group-header" onClick={() => setCollapsed(!collapsed)}>
        <svg className="model-group-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span className="model-group-label">{label}</span>
      </button>
      <div className="model-group-body">
        {models.map((model) => (
          <div key={model.id} className={`model-row${model.id === activeModelId ? " is-active" : ""}`}>
            <label className="model-row-check" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox"
                checked={model.id === activeModelId}
                onChange={() => onSelectModel(model.id)}
              />
            </label>
            <div className="model-row-info" onClick={() => onSelectModel(model.id)}>
              <span className="model-row-name">{model.name || "未命名"}</span>
            </div>
            <span className="model-row-provider">{label}</span>
            <div className="model-row-actions">
              <button className="model-row-btn model-row-btn--edit" title="编辑" onClick={(e) => { e.stopPropagation(); onOpenEditForm(model); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="model-row-btn model-row-btn--delete" title="删除" onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {editingId === model.id ? (
              <div className="model-edit-form-wrapper is-open">
                <div className="model-edit-form">
                  <div className="model-edit-title">编辑模型</div>

                  <label className="settings-field">
                    <span>模型名称</span>
                    <input type="text" value={editFormModel} onChange={(e) => onEditFormModelChange(e.target.value)}
                      placeholder={model.providerType === "gemini" ? "例如 gemini-2.5-flash" : "例如 gpt-4o、deepseek-chat"} autoComplete="off" />
                  </label>

                  {model.providerType === "openai" ? (
                    <label className="settings-field">
                      <span>接口地址</span>
                      <input type="text" value={editFormBaseUrl} onChange={(e) => onEditFormBaseUrlChange(e.target.value)}
                        placeholder="https://api.openai.com/v1" autoComplete="off" />
                    </label>
                  ) : null}

                  <label className="settings-field">
                    <span>API 密钥</span>
                    <div className="settings-input-wrap">
                      <input type={showEditKey ? "text" : "password"} value={editFormKey} onChange={(e) => onEditFormKeyChange(e.target.value)}
                        placeholder={model.providerType === "gemini" ? "输入 Gemini API 密钥" : "输入 API 密钥"} autoComplete="off" />
                      <button type="button" className="input-icon-button" onClick={() => onShowEditKeyChange(!showEditKey)}>
                        {showEditKey ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </label>

                  {editErrorMsg ? (
                    <div className="model-edit-error">{editErrorMsg}</div>
                  ) : null}
                  <div className="model-edit-actions">
                    <button className="btn-secondary" onClick={onCancelEditForm}>取消</button>
                    <button className="btn-primary btn-dark" onClick={onEditSave} style={{ flex: 1 }}>保存修改</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
