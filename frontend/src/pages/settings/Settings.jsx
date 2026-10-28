import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  Bell,
  Cpu,
  FileCheck2,
  Lock,
  UserCheck
} from 'lucide-react';

export default function Settings() {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev =>
      prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = settings.map(s => ({
        setting_key: s.setting_key,
        setting_value: s.setting_value
      }));
      const res = await api.put('/settings', { settings: payload });
      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const getSettingVal = (key, def = '') => {
    const s = settings.find(x => x.setting_key === key);
    return s ? s.setting_value : def;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          System Configuration & Profile Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage regulatory maturity reminder intervals, OCR engine parameters, and active profile details
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-royal-600" />
          Active Account Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Full Name</span>
            <p className="font-bold text-slate-800 mt-0.5">{user?.fullName}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Official Email</span>
            <p className="font-mono text-slate-800 mt-0.5">{user?.email}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Assigned Role</span>
            <span className="font-semibold text-royal-700 bg-royal-50 px-2 py-0.5 rounded border border-royal-200 inline-block mt-0.5">
              {role?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Institution Affiliation</span>
            <p className="font-medium text-slate-800 mt-0.5">
              {user?.institutionName || 'AICTE Central Authority'}
            </p>
          </div>
        </div>
      </div>

      {/* System Settings (Super Admin Only) */}
      {role === 'SUPER_ADMIN' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-royal-600" />
              Statutory Automation & Workflow Parameters
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Super Admin Control
            </span>
          </div>

          {savedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
              System configuration saved successfully and audit log updated.
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading system parameters...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maturity Reminder Intervals (Days) *
                  </label>
                  <input
                    type="text"
                    value={getSettingVal('maturity_reminder_intervals', '30,15,7,0')}
                    onChange={(e) => handleChange('maturity_reminder_intervals', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    placeholder="30,15,7,0"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Comma-separated days prior to maturity to generate notifications.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimum Deposit Tenure Required (Months) *
                  </label>
                  <input
                    type="number"
                    value={getSettingVal('min_deposit_tenure_months', '60')}
                    onChange={(e) => handleChange('min_deposit_tenure_months', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standard AICTE statutory term for course approval endowment deposits.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maximum Document Upload Limit (MB) *
                  </label>
                  <input
                    type="number"
                    value={getSettingVal('max_upload_size_mb', '10')}
                    onChange={(e) => handleChange('max_upload_size_mb', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enforces server-side upload payload boundaries.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Automatic OCR Discrepancy Flagging *
                  </label>
                  <select
                    value={getSettingVal('auto_flag_discrepancies', 'true')}
                    onChange={(e) => handleChange('auto_flag_discrepancies', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="true">Enabled (Flag records on amount/holder divergence)</option>
                    <option value="false">Disabled (Manual inspection only)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Permitted Deposit Record Types *
                  </label>
                  <input
                    type="text"
                    value={getSettingVal('allowed_record_types', 'Fixed Deposit Receipt,Bank Guarantee,Government Security,Term Deposit Certificate')}
                    onChange={(e) => handleChange('allowed_record_types', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Comma-separated list of acceptable deposit instruments for institutional compliance.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Portal Prototype Disclaimer Text *
                  </label>
                  <input
                    type="text"
                    value={getSettingVal('portal_prototype_notice', 'FDRvault Portal &bull; Secure Deposits. Smarter Management.')}
                    onChange={(e) => handleChange('portal_prototype_notice', e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Updating...' : 'Save Configuration Parameters'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
