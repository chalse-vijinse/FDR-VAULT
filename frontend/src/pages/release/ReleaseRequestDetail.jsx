import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowUpRight,
  Building2,
  FileCheck2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  Save,
  CheckSquare
} from 'lucide-react';

export default function ReleaseRequestDetail() {
  const { id } = useParams();
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Decision State
  const [decisionAction, setDecisionAction] = useState('Under Review');
  const [remarks, setRemarks] = useState('');
  const [confirmationRef, setConfirmationRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/release-requests/${id}`);
      if (res.data.success) {
        setRequest(res.data.data);
        setDecisionAction(res.data.data.status || 'Under Review');
        setRemarks(res.data.data.clearance_remarks || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load release request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/release-requests/${id}/decision`, {
        action: decisionAction,
        remarks,
        confirmationRef
      });
      if (res.data.success) {
        alert(`Release request status updated to '${decisionAction}'.`);
        fetchDetail();
      }
    } catch (err) {
      alert('Status update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading Release Request #{id}...</div>;
  }

  if (error || !request) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        {error || 'Release request not found.'}
      </div>
    );
  }

  const stages = [
    'Submitted',
    'Release Requested',
    'Release Under Review',
    'Clarification Required',
    'Recommended',
    'Release Approved',
    'Approved',
    'Released'
  ];

  const currentStageIndex = stages.indexOf(request.status);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/release-requests" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Release Requests
        </Link>
      </div>

      {/* Main Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {request.request_reference}
                </span>
                <Badge status={request.status} />
                <span className="text-xs text-slate-400">&bull; Request Date: {request.request_date}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                Deposit Release Application &bull; ₹{Number(request.deposit_amount).toLocaleString('en-IN')}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {request.institution_name} ({request.institution_code})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Related FDR Ref</span>
            <Link
              to={`/fdr/${request.fdr_id}`}
              className="text-xs font-semibold text-royal-600 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              {request.fdr_number} &rarr;
            </Link>
          </div>
        </div>

        {/* Multi-stage Progress Stepper */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="hidden sm:flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
            {stages.map((stage, idx) => {
              const isPast = currentStageIndex >= idx;
              const isCurrent = request.status === stage;
              return (
                <div key={stage} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-royal-600 text-white ring-4 ring-royal-100'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 ${isCurrent ? 'text-royal-700' : 'text-slate-500'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Reason & Compliance Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Submissions & Attached Compliance Evidence */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Institution Reason for Release</h2>
          <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-200">
            {request.reason_for_release}
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
            Compliance Attachments & Clearance Letters
          </h3>
          {(request.attachedDocuments || []).length === 0 ? (
            <p className="text-xs text-slate-400">No additional attachments linked to this release ticket.</p>
          ) : (
            <div className="space-y-2">
              {request.attachedDocuments.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-royal-600" />
                    <span className="font-semibold text-slate-800">{doc.document_name}</span>
                    <span className="text-slate-400">({(doc.file_size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Verified Copy
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Regulatory Approval & Clearance Action */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Clearance & Decision Recording</h2>

          {request.release_confirmation_ref && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <span className="font-bold">Official Release Reference:</span> {request.release_confirmation_ref}
            </div>
          )}

          {(role === 'SUPER_ADMIN' || role === 'VERIFICATION_OFFICER') ? (
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status Stage *</label>
                <select
                  value={decisionAction}
                  onChange={(e) => setDecisionAction(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="Release Under Review">Release Under Review</option>
                  <option value="Clarification Required">Clarification Required</option>
                  <option value="Recommended">Recommended for Approval (Officer)</option>
                  {role === 'SUPER_ADMIN' && <option value="Release Approved">Release Approved (Admin NOC)</option>}
                  {role === 'SUPER_ADMIN' && <option value="Released">Released (Lien Formally Cancelled)</option>}
                  <option value="Rejected">Rejected</option>
                </select>
                {(decisionAction === 'Release Approved' || decisionAction === 'Released') && role !== 'SUPER_ADMIN' && (
                  <p className="text-[10px] text-rose-600 mt-1">Super Admin authorization required for Approval.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clearance Remarks & Condition Checks</label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record no-objection certificates, student batch graduation status, or NAAC accreditation notes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              {decisionAction === 'Released' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lien Release Dispatch Reference</label>
                  <input
                    type="text"
                    value={confirmationRef}
                    onChange={(e) => setConfirmationRef(e.target.value)}
                    placeholder="e.g. AICTE/FIN/2026/REL-CANCEL-009"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Updating Status...' : 'Save Clearance Update'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <span className="font-semibold text-slate-800">Clearance Status:</span>
              <p className="text-slate-600">{request.clearance_remarks || 'Your request is currently queued for Regional Office compliance verification.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
