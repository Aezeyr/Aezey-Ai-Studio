import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle2, AlertTriangle, ExternalLink, X, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (newKey: string) => void;
  onClearKey: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  onClearKey,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputKey(currentKey || '');
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('Please enter an API key to test.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing API key with Gemini service...');

    try {
      // Test key directly against Generative Language API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest)}`
      );

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Key validated successfully! Generative Language API responded OK.');
      } else {
        const data = await res.json().catch(() => ({}));
        const reason = data?.error?.details?.[0]?.reason || data?.error?.status || '';
        const msg = data?.error?.message || `HTTP ${res.status}`;

        if (reason === 'ACCESS_TOKEN_TYPE_UNSUPPORTED' || reason === 'API_KEY_SERVICE_BLOCKED' || res.status === 401) {
          setTestStatus('error');
          setTestMessage(
            `Authentication failed (${reason || '401 Unauthorized'}). In your Google Cloud Project, verify: (1) "Generative Language API" is enabled; (2) In APIs & Services -> Credentials, API restrictions allow "Generative Language API".`
          );
        } else {
          setTestStatus('error');
          setTestMessage(`API validation returned error: ${msg}`);
        }
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Network error during key verification: ${err?.message || 'Check your internet connection'}`);
    }
  };

  const handleSave = () => {
    const trimmed = inputKey.trim();
    onSaveKey(trimmed);
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onClearKey();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gemini API Key Settings</h2>
              <p className="text-xs text-slate-400">Configure or override the Gemini API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Key Status Banner */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Key Source:</span>
            {currentKey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Custom In-App Key Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Server Environment Key (Default)
              </span>
            )}
          </div>

          {/* Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gemini API Key (AIza... or AQ...)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="Paste your Gemini API Key here"
                className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 text-sm font-mono transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Saved in your browser&apos;s localStorage for your convenience. Never shared or hardcoded.
            </p>
          </div>

          {/* Test Status Feedback */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testStatus === 'testing'
                  ? 'bg-blue-950/50 border-blue-500/30 text-blue-200'
                  : testStatus === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400 mt-0.5 shrink-0" />}
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
              {testStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
              <span className="leading-relaxed">{testMessage}</span>
            </div>
          )}

          {/* Setup Guidelines Helper */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Troubleshooting 401 / Unsupported Token Errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
              <li>
                In <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-2.5 h-2.5" /></a>, ensure <strong className="text-slate-200">Generative Language API</strong> is enabled.
              </li>
              <li>
                In <strong>Credentials &rarr; API Keys</strong>, ensure API restrictions allow &ldquo;Generative Language API&rdquo;.
              </li>
              <li>
                For Cloudflare Workers: set <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> in Cloudflare Worker Dashboard &rarr; Settings &rarr; Variables and Secrets.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testStatus === 'testing' || !inputKey.trim()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Test Key
            </button>
            {currentKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Reset to Default
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!inputKey.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
