import React, { useState } from 'react';
import { Brain, Upload, Eye, EyeOff, Zap, Shield, Server, Info, Check, Wifi, WifiOff, Moon, Sun, Monitor, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { getBackendHealth } from '../api/investigationService';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useTheme } from '../theme/useTheme';

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
      checked ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
    }`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [saveToast, setSaveToast] = useState(false);

  const { mode, setMode, resolved } = useTheme();

  // AI Settings
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('aiProvider') || 'OpenAI');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('aiModel') || 'gpt-4o');

  // Investigation Settings
  const [invSettings, setInvSettings] = useState(() => {
    const saved = localStorage.getItem('invSettings');
    return saved ? JSON.parse(saved) : {
      aiReport: true,
      attackChain: true,
      investigationGraph: true,
      decisionLog: true,
      mitreMapping: true,
      cweMapping: false
    };
  });

  // Upload Settings
  const [uploadSettings, setUploadSettings] = useState(() => {
    const saved = localStorage.getItem('uploadSettings');
    return saved ? JSON.parse(saved) : {
      maxSize: '10MB',
      fileTypes: { xml: true, txt: true, json: true },
      autoStart: true
    };
  });

  // Backend Settings
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('apiUrl') || 'http://localhost:8000');
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [lastTested, setLastTested] = useState(null);

  const handleSave = () => {
    if (activeTab === 'ai') {
      localStorage.setItem('aiProvider', aiProvider);
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('aiModel', aiModel);
    } else if (activeTab === 'investigation') {
      localStorage.setItem('invSettings', JSON.stringify(invSettings));
    } else if (activeTab === 'upload') {
      localStorage.setItem('uploadSettings', JSON.stringify(uploadSettings));
    } else if (activeTab === 'backend') {
      localStorage.setItem('apiUrl', apiUrl);
    }
    // Theme is applied instantly via ThemeProvider; no save needed.
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const isHealthy = await getBackendHealth(apiUrl);
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
    } catch (err) {
      setConnectionStatus('disconnected');
    }
    setLastTested(new Date().toLocaleTimeString());
  };

  const tabs = [
    { id: 'ai', label: 'AI Settings', icon: Brain },
    { id: 'investigation', label: 'Investigation', icon: Zap },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'appearance', label: 'Appearance', icon: SettingsIcon },
    { id: 'backend', label: 'Backend', icon: Server },
    { id: 'about', label: 'About', icon: Info }
  ];

  const handleInvToggle = (key) => {
    setInvSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileTypeToggle = (type) => {
    setUploadSettings(prev => ({
      ...prev,
      fileTypes: { ...prev.fileTypes, [type]: !prev.fileTypes[type] }
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Configure AI, investigation defaults, upload limits, appearance, and backend connection."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Vertical sub-nav */}
        <Card padding="p-2" className="h-fit">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-accent)] px-3 py-2">Sections</p>
          <div className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border-l-4 ${
                    isActive
                      ? 'bg-[var(--sidebar)] text-[var(--brand)] border-[var(--brand)] font-semibold'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right panel */}
        <Card padding="p-6">
          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-xl font-extrabold text-[var(--text)]">AI Settings</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Configure the language-model backend that powers the report generator.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">AI Provider</label>
                <div className="flex rounded-lg bg-[var(--surface-2)] p-1 w-fit">
                  {['OpenAI', 'Ollama'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setAiProvider(provider)}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        aiProvider === provider
                          ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">API Key</label>
                <div className="relative max-w-md">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={aiProvider === 'OpenAI' ? 'sk-...' : 'Enter API Key (if required)'}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2.5 pl-3 pr-10 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" /> API Key is stored locally in your browser only
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                >
                  {aiProvider === 'OpenAI' ? (
                    <>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </>
                  ) : (
                    <>
                      <option value="llama3">llama3</option>
                      <option value="mistral">mistral</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Investigation Settings */}
          {activeTab === 'investigation' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-xl font-extrabold text-[var(--text)]">Investigation Settings</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Decide which pipeline stages run and what they emit.</p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {[
                  { key: 'aiReport', label: 'Enable AI Report Generation', desc: 'Automatically generate summary reports for investigations' },
                  { key: 'attackChain', label: 'Enable Attack Chain Generation', desc: 'Attempt to link events into full attack chains' },
                  { key: 'investigationGraph', label: 'Enable Investigation Graph', desc: 'Build and visualize the entity graph' },
                  { key: 'decisionLog', label: 'Enable Decision Log', desc: 'Record automated AI decisions in the investigation logs' },
                  { key: 'mitreMapping', label: 'Enable MITRE Mapping', desc: 'Map findings to MITRE ATT&CK framework automatically' },
                  { key: 'cweMapping', label: 'Enable CWE Mapping', desc: 'Map findings to Common Weakness Enumeration' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text)]">{label}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
                    </div>
                    <ToggleSwitch checked={invSettings[key]} onChange={() => handleInvToggle(key)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Settings */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-xl font-extrabold text-[var(--text)]">Upload Settings</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Set scan upload limits and accepted file types.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">Max Upload Size</label>
                <select
                  value={uploadSettings.maxSize}
                  onChange={(e) => setUploadSettings(prev => ({ ...prev, maxSize: e.target.value }))}
                  className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                >
                  <option value="1MB">1MB</option>
                  <option value="5MB">5MB</option>
                  <option value="10MB">10MB</option>
                  <option value="50MB">50MB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">Allowed File Types</label>
                <div className="flex gap-4">
                  {['xml', 'txt', 'json'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uploadSettings.fileTypes[type]}
                        onChange={() => handleFileTypeToggle(type)}
                        className="w-4 h-4 text-[var(--brand)] bg-[var(--surface)] border-[var(--border-strong)] rounded focus:ring-[var(--brand)]"
                      />
                      <span className="text-sm text-[var(--text)]">.{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text)]">Auto Start Investigation</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Begin analysis immediately after file upload</p>
                </div>
                <ToggleSwitch
                  checked={uploadSettings.autoStart}
                  onChange={(val) => setUploadSettings(prev => ({ ...prev, autoStart: val }))}
                />
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--text)]">Appearance</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Switch between light, dark, and follow-your-system themes.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-[var(--sidebar)] border border-[var(--sidebar-active)] text-[var(--brand)] px-3 py-1.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Currently active: {resolved === 'dark' ? 'Dark' : 'Light'}
                  <span className="text-[var(--text-muted)] font-normal">
                    ({mode === 'system' ? 'follows system' : 'manual'})
                  </span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-4">Theme Preference</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'system', label: 'System Theme', icon: Monitor }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all relative ${
                        mode === id
                          ? 'border-[var(--brand)] bg-[var(--sidebar)] text-[var(--brand)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
                      }`}
                      aria-pressed={mode === id}
                    >
                      {mode === id && (
                        <CheckCircle2 className="w-5 h-5 absolute top-3 right-3 text-[var(--brand)]" />
                      )}
                      <Icon className="w-8 h-8 mb-3" />
                      <span className="text-sm font-semibold">{label}</span>
                      {id === 'system' && (
                        <span className="text-[10px] uppercase tracking-widest mt-1 text-[var(--text-subtle)] font-bold">
                          Resolves: {resolved === 'dark' ? 'Dark' : 'Light'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Backend Connection */}
          {activeTab === 'backend' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-xl font-extrabold text-[var(--text)]">Backend Connection</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Point Sentinel at the right API endpoint.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2">API URL</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  className="px-4 py-2 bg-[var(--text)] hover:opacity-90 text-[var(--surface)] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {connectionStatus === 'testing' ? 'Testing…' : 'Test Connection'}
                </button>
                {connectionStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--success)] bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-1.5 rounded-full text-xs font-semibold">
                    <Wifi className="w-3.5 h-3.5" /> Connected
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--danger)] bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-1.5 rounded-full text-xs font-semibold">
                    <WifiOff className="w-3.5 h-3.5" /> Disconnected
                  </span>
                )}
              </div>

              {lastTested && (
                <p className="text-xs text-[var(--text-muted)]">Last tested: {lastTested}</p>
              )}
            </div>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-xl font-extrabold text-[var(--text)]">About</h3>
              </div>
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-[var(--sidebar)] border border-[var(--sidebar-active)] rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[var(--brand)]" />
                </div>
                <h4 className="text-xl font-extrabold text-[var(--text)]">Sentinel Security</h4>
                <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
                  Advanced cybersecurity investigation platform powered by AI. Analyze logs, reconstruct attack chains, and respond to threats faster.
                </p>

                <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 text-left">
                    <p className="text-xs text-[var(--text-muted)]">Version</p>
                    <p className="text-sm font-semibold text-[var(--text)]">v1.0.0 (MVP)</p>
                  </div>
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 text-left">
                    <p className="text-xs text-[var(--text-muted)]">Build</p>
                    <p className="text-sm font-semibold text-[var(--text)]">2026.08.01</p>
                  </div>
                  <div className="col-span-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Backend Status</p>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {connectionStatus === 'connected' ? 'Connected' : 'Status Unknown'}
                      </p>
                    </div>
                    <Server className={`w-5 h-5 ${connectionStatus === 'connected' ? 'text-[var(--success)]' : 'text-[var(--text-subtle)]'}`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save bar */}
          {activeTab !== 'about' && activeTab !== 'appearance' && (
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center gap-4">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white font-semibold rounded-lg transition-colors shadow-sm shadow-[var(--brand)]/20"
              >
                Save Settings
              </button>
              {saveToast && (
                <span className="flex items-center gap-1.5 text-[var(--success)] text-sm font-semibold bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-1.5 rounded-full">
                  <Check className="w-4 h-4" /> Settings saved successfully
                </span>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
