import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Settings2, Shield, Bell, Clock, History, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { instancesApi } from '../../../services/api';
import type { Instance, InstanceSettings } from '../../../services/api';

interface InstanceSettingsModalProps {
  inst: Instance;
  onClose: () => void;
}

const SETTINGS: {
  key: keyof InstanceSettings;
  label: string;
  description: string;
  icon: React.ReactNode;
  default?: boolean;
}[] = [
  {
    key: 'reject_calls',
    label: 'Reject Calls',
    description: 'Automatically reject incoming voice and video calls to this number.',
    icon: <Shield className="w-4 h-4 text-[#6e684a]" />,
    default: false,
  },
  {
    key: 'groups_ignore',
    label: 'Ignore Group Messages',
    description: 'Mute all incoming messages from groups linked to this number.',
    icon: <Bell className="w-4 h-4 text-[#6e684a]" />,
    default: false,
  },
  {
    key: 'always_online',
    label: 'Always Online',
    description: 'Keep this container connected at all times, even when the app is closed.',
    icon: <Clock className="w-4 h-4 text-[#6e684a]" />,
    default: true,
  },
  {
    key: 'read_messages',
    label: 'Mark as Read',
    description: 'Automatically mark received messages as read.',
    icon: <History className="w-4 h-4 text-[#6e684a]" />,
    default: true,
  },
  {
    key: 'sync_full_history',
    label: 'Sync Full History',
    description: 'When connected, pull the full message history from this account.',
    icon: <RefreshCw className="w-4 h-4 text-[#6e684a]" />,
    default: false,
  },
];

export default function InstanceSettingsModal({ inst, onClose }: InstanceSettingsModalProps) {
  const [settings, setSettings] = useState<Partial<InstanceSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    instancesApi.getClientSettings(inst.name).then(res => {
      if (res.success && res.data) setSettings(res.data);
      setLoading(false);
    });
  }, [inst.name]);

  const handleToggle = (key: keyof InstanceSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await instancesApi.updateClientSettings(inst.name, settings);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d2813] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2d2813] flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-[#a8a99e]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#a8a99e]">Container Settings</h3>
              <p className="text-[10px] text-[#6e684a] font-mono">{inst.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#2d2813] flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-[#6e684a]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-[11px] text-[#6e684a]">
            Configure how this container behaves. Changes apply immediately when saved.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-[#5a554a] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {SETTINGS.map(s => {
                const value = settings[s.key] ?? s.default ?? false;
                return (
                  <div
                    key={s.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[#2d2813] hover:border-[#3d3a1e] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#181711] flex items-center justify-center shrink-0 mt-0.5">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#a8a99e]">{s.label}</p>
                      <p className="text-[10px] text-[#6e684a] mt-0.5 leading-relaxed">{s.description}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(s.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:ring-offset-1 focus:ring-offset-[#1a1915] ${
                        value ? 'bg-yellow-500' : 'bg-[#3d3a1e]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow transform transition duration-200 ease-in-out ${
                          value ? 'translate-x-4 bg-[#181711]' : 'translate-x-0 bg-[#6e684a]'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-800/40">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2d2813] flex items-center justify-between">
          <span className="text-[10px] text-[#5a554a]">
            {saved ? (
              <span className="text-green-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Settings saved
              </span>
            ) : (
              `${SETTINGS.filter(s => settings[s.key] !== (s.default ?? false)).length} unsaved change${SETTINGS.filter(s => settings[s.key] !== (s.default ?? false)).length !== 1 ? 's' : ''}`
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6e684a] hover:text-[#a8a99e] transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
