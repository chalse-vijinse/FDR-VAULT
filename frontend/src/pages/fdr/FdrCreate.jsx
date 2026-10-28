import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Building2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function FdrCreate() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    institution_id: user?.institutionId || '',
    record_type: 'Fixed Deposit Receipt',
    fdr_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    deposit_amount: '',
    currency: 'INR',
    issue_date: '',
    maturity_date: '',
    deposit_holder_name: user?.institutionName ? `${user.institutionName} / Joint AICTE Member Secretary` : '',
    deposit_purpose: '',
    approval_reference: '',
    additional_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const recordTypes = [
    'Fixed Deposit Receipt',
    'Bank Guarantee',
    'Government Security',
    'Term Deposit Certificate',
    'Other Permitted Deposit'
  ];

  useEffect(() => {
    // If Super Admin or Officer, fetch institutions list for dropdown
    if (role === 'SUPER_ADMIN' || role === 'VERIFICATION_OFFICER') {
      api.get('/institutions').then((res) => {
        if (res.data.success) {
          setInstitutions(res.data.data);
          if (res.data.data.length > 0 && !formData.institution_id) {
            setFormData(prev => ({ ...prev, institution_id: res.data.data[0].id }));
          }
        }
      }).catch(console.error);
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDuplicateWarning('');

    // Form validations
    if (!formData.deposit_amount || parseFloat(formData.deposit_amount) <= 0) {
      setError('Deposit amount must be a positive number.');
      return;
    }

    if (!formData.issue_date || !formData.maturity_date) {
      setError('Both issue date and maturity date are required.');
      return;
    }

    if (new Date(formData.maturity_date) <= new Date(formData.issue_date)) {
      setError('Maturity date must not precede or equal the issue date.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/fdr', formData);
      if (res.data.success) {
        navigate(`/fdr/${res.data.fdrId}?created=true`);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create FDR record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link to="/fdr" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to FDR Records List
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-royal-50 border border-royal-200 text-royal-700 flex items-center justify-center font-bold">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Create Security Deposit / FDR Record</h1>
            <p className="text-xs text-slate-500">Record will be created in Draft status. Supporting certificate upload required before verification submission.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
          {/* Section 1: Institutional & Instrument Type */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Institution & Deposit Instrument</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Affiliated Institution *</label>
                {role === 'INSTITUTION_ADMIN' ? (
                  <input
                    type="text"
                    disabled
                    value={user?.institutionName || 'Your Institution'}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                  />
                ) : (
                  <select
                    value={formData.institution_id}
                    onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                    required
                  >
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.institution_code})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Record / Instrument Type *</label>
                <select
                  value={formData.record_type}
                  onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {recordTypes.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formData.record_type === 'Bank Guarantee' ? 'BG Reference Number' : 'FDR / Deposit Receipt Number'}
                </label>
                <input
                  type="text"
                  value={formData.fdr_number}
                  onChange={(e) => setFormData({ ...formData, fdr_number: e.target.value })}
                  placeholder="e.g. SBI-FDR-2026-99210"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-royal-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Optional if record type uses institutional reference.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applicable AICTE Approval Reference</label>
                <input
                  type="text"
                  value={formData.approval_reference}
                  onChange={(e) => setFormData({ ...formData, approval_reference: e.target.value })}
                  placeholder="e.g. AICTE/NW/2026/APP-4821"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-royal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Banking Particulars */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">2. Financial & Banking Particulars</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="Branch locality"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                  placeholder="SBIN0001077"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deposit Principal Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  placeholder="3500000.00"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Issue *</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Maturity *</label>
                <input
                  type="date"
                  required
                  value={formData.maturity_date}
                  onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Ownership & Purpose */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">3. Ownership & Approval Purpose</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deposit Holder / Joint Account Title *</label>
                <input
                  type="text"
                  required
                  value={formData.deposit_holder_name}
                  onChange={(e) => setFormData({ ...formData, deposit_holder_name: e.target.value })}
                  placeholder="Principal, College / Joint AICTE Member Secretary"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must reflect the exact joint holding name endorsed on the bank lien certificate.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Deposit Purpose *</label>
                <input
                  type="text"
                  required
                  value={formData.deposit_purpose}
                  onChange={(e) => setFormData({ ...formData, deposit_purpose: e.target.value })}
                  placeholder="e.g. Mandatory Security Deposit for Introduction of B.Tech Artificial Intelligence"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Compliance Notes</label>
                <textarea
                  rows="2"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  placeholder="Any additional bank endorsement remarks, pledge letters, or context..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/fdr"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Record...' : 'Save Draft & Proceed to Document Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
