import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Building, Mail, Phone, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionCode: '',
    category: 'Engineering & Technology',
    state: 'Delhi',
    district: 'New Delhi',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Telangana', 'Kerala'];
  const categories = ['Engineering & Technology', 'Management', 'Pharmacy', 'Polytechnic & Applied Sciences', 'Architecture', 'Hotel Management'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register-request', formData);
      if (res.data.success) {
        setSuccess(true);
        setReference(res.data.referenceCode);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-900 via-navy-950 to-slate-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-navy-900 to-royal-600 items-center justify-center text-white shadow-lg mb-2">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Institution Registration Request</h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit your institution credentials for AICTE Security Deposit / FDR management access
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registration Request Submitted</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your institution registration request has been submitted to the verification officer team. You will receive authorized portal credentials upon independent identity verification.
              </p>
              <div className="inline-block p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-800">
                Tracking Reference: {reference}
              </div>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-royal-600 rounded-lg hover:bg-royal-700 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Full Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    placeholder="e.g. National Institute of Technical Sciences"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Institutional Code / Identifier</label>
                  <input
                    type="text"
                    value={formData.institutionCode}
                    onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value })}
                    placeholder="e.g. INST-DL-2026"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Discipline / Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">State / Union Territory *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. South Delhi"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Authorized Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Registrar / Principal / Dean"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Official Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="principal@institution.edu.in"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Contact Phone / Landline</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 11 2345 6789"
                    className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting Request...' : 'Submit Institutional Registration Request'}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-royal-600 hover:text-royal-800 font-medium">
                  &larr; Back to Portal Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
