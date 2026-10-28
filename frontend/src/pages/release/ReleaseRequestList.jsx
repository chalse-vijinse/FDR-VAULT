import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowUpRight,
  Search,
  Filter,
  Plus,
  Building,
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function ReleaseRequestList() {
  const { role, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Submit Modal State (for Institution Admin)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [verifiedFdrs, setVerifiedFdrs] = useState([]);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const statuses = [
    'All',
    'Submitted',
    'Release Requested',
    'Release Under Review',
    'Clarification Required',
    'Recommended',
    'Release Approved',
    'Approved',
    'Released',
    'Rejected'
  ];

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/release-requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load release requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Load verified or approved FDRs for release submission
    api.get('/fdr').then((res) => {
      if (res.data.success) {
        const eligible = res.data.data.filter(d => ['Verified', 'Approved'].includes(d.status));
        setVerifiedFdrs(eligible);
        if (eligible.length > 0) setSelectedFdrId(eligible[0].id);
      }
    }).catch(console.error);
  }, [statusFilter]);

  const handleSubmitRelease = async (e) => {
    e.preventDefault();
    if (!selectedFdrId || !releaseReason) return;

    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await api.post('/release-requests', {
        fdr_id: selectedFdrId,
        reason_for_release: releaseReason
      });
      if (res.data.success) {
        setIsSubmitModalOpen(false);
        setReleaseReason('');
        fetchRequests();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit release request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Deposit Release Request Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal institutional requests for release of statutory security deposit liens upon maturity or fulfillment of conditions
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Apply for Deposit Release
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
            placeholder="Search request ref or FDR..."
            className="w-64 py-1.5 px-3 border border-slate-300 rounded-lg"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>Status: {s}</option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          {requests.length} Total Requests
        </div>
      </div>

      {/* Release Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading release requests...</div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Release Requests Found"
            description="No deposit release requests match your selected status filter."
            actionText="Submit New Release Request"
            onAction={() => setIsSubmitModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">FDR / Bank</th>
                  <th className="py-3 px-4 text-right">Deposit Amount</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-royal-700">
                      {req.request_reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {req.institution_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{req.fdr_number}</div>
                      <div className="text-[11px] text-slate-400">{req.bank_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(req.deposit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {req.request_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/release-requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Submit Release Request */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Submit Security Deposit Release Request">
        <form onSubmit={handleSubmitRelease} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700">
              {submitError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Verified Deposit Record *</label>
            {verifiedFdrs.length === 0 ? (
              <p className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800">
                No currently verified deposit records found eligible for release. Only verified FDRs can be released.
              </p>
            ) : (
              <select
                value={selectedFdrId}
                onChange={(e) => setSelectedFdrId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                required
              >
                {verifiedFdrs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fdr_number} - {f.bank_name} (₹{Number(f.deposit_amount).toLocaleString('en-IN')}) - Maturity: {f.maturity_date}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Substantive Reason for Release *</label>
            <textarea
              rows="4"
              required
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="Cite applicable AICTE Approval Process Handbook Clause, completion of mandatory statutory tenure, autonomous NAAC accreditation, or replacement guarantee details..."
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
            <strong>Statutory Rule:</strong> Maturity does NOT confer automatic eligibility for deposit release. Clearance from the regional approving authority is mandatory.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || verifiedFdrs.length === 0}
              className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Release Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
