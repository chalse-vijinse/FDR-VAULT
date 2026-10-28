import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import WorkflowTracker from '../../components/common/WorkflowTracker';
import OcrCompareModal from '../../components/ocr/OcrCompareModal';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileQuestion,
  FileText,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  FileDown,
  Save,
  CheckSquare
} from 'lucide-react';

export default function VerificationDetail() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Decision Form State
  const [decision, setDecision] = useState('Verified');
  const [findings, setFindings] = useState('');
  const [independentRef, setIndependentRef] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Request Clarification State
  const [clarificationReason, setClarificationReason] = useState('');
  const [showClarificationForm, setShowClarificationForm] = useState(false);
  const [requestingDocs, setRequestingDocs] = useState(false);

  // Active OCR Modal State
  const [activeOcrDoc, setActiveOcrDoc] = useState(null);

  const fetchFdr = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/fdr/${id}`);
      if (res.data.success) {
        setFdr(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load FDR record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFdr();
  }, [id]);

  const handleRecordDecision = async (e) => {
    e.preventDefault();
    if (!findings || findings.trim().length < 5) {
      alert('Substantive verification findings must be recorded before saving decision.');
      return;
    }

    if (!window.confirm(`Are you certain you want to record the outcome as '${decision}'? This will be permanently recorded in the institutional audit log.`)) {
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await api.post(`/verifications/${id}/decision`, {
        decision,
        findings,
        independent_evidence_ref: independentRef
      });
      if (res.data.success) {
        alert(`Verification outcome recorded as '${decision}'. Audit trail updated.`);
        fetchFdr();
      }
    } catch (err) {
      alert('Decision recording failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleRequestDocuments = async (e) => {
    e.preventDefault();
    if (!clarificationReason || clarificationReason.trim().length < 5) {
      alert('Please specify the exact clarification or missing documents required.');
      return;
    }

    setRequestingDocs(true);
    try {
      const res = await api.post(`/verifications/${id}/request-documents`, {
        reason: clarificationReason
      });
      if (res.data.success) {
        alert('Correction request dispatched to the institution administrator.');
        setShowClarificationForm(false);
        fetchFdr();
      }
    } catch (err) {
      alert('Failed to request documents: ' + (err.response?.data?.message || err.message));
    } finally {
      setRequestingDocs(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading Verification Record #{id}...</div>;
  }

  if (error || !fdr) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        {error || 'Record not found.'}
      </div>
    );
  }

  const documents = fdr.documents || [];
  const history = fdr.verificationHistory || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/verifications" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Verification Queue
        </Link>
      </div>

      {/* 7-Stage FDR Lifecycle Visualization */}
      <WorkflowTracker
        status={fdr.status}
        clarificationRemark={fdr.discrepancy_details}
        rejectionReason={fdr.rejection_reason}
      />

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-royal-50 border border-royal-200 text-royal-700 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {fdr.fdr_number || `Deposit Record #${fdr.id}`}
                </span>
                <Badge status={fdr.status} />
                <span className="text-xs text-slate-400">&bull; {fdr.record_type}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                ₹{Number(fdr.deposit_amount).toLocaleString('en-IN')} &bull; {fdr.bank_name || 'Bank'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {fdr.institution_name} ({fdr.institution_code})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Verification Label</span>
            <span className="font-semibold text-xs text-royal-700 bg-royal-50 px-2 py-0.5 rounded border border-royal-200 inline-block mt-0.5">
              {fdr.verification_status_label || 'Not Reviewed'}
            </span>
          </div>
        </div>

        {/* Detailed Form Metadata */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Principal Amount</span>
            <p className="font-bold text-slate-900 mt-0.5">₹{Number(fdr.deposit_amount).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Issue Date</span>
            <p className="font-semibold text-slate-800 mt-0.5">{fdr.issue_date}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Maturity Date</span>
            <p className="font-semibold text-royal-700 mt-0.5">{fdr.maturity_date}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Branch & IFSC</span>
            <p className="font-medium text-slate-800 mt-0.5">{fdr.branch_name || 'N/A'} ({fdr.ifsc_code || 'N/A'})</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Holder / Joint AICTE Name</span>
            <p className="font-medium text-slate-800 mt-0.5">{fdr.deposit_holder_name}</p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Attached Documents & Decision Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attached Documents & OCR Inspection */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Submitted Documents ({documents.length})</h2>
            <span className="text-[11px] text-slate-400">Click OCR Compare to evaluate discrepancies</span>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No supporting documents uploaded for this deposit.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-royal-600" />
                      <span className="truncate max-w-xs">{doc.original_filename}</span>
                    </div>
                    <Badge status={doc.ocr_status} />
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Type: {doc.document_type}</span>
                    <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                  </div>

                  {doc.discrepancy_summary && (
                    <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700">
                      <span className="font-semibold">OCR Analysis:</span> {doc.discrepancy_summary}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-royal-600 hover:underline inline-flex items-center gap-1 font-medium text-[11px]"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Download Raw Document
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveOcrDoc(doc)}
                      className="px-3 py-1 rounded-md bg-royal-600 hover:bg-royal-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Side-by-Side OCR Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Authorized Verification Decision Form */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Record Verification Decision</h2>
            <span className="text-[11px] text-slate-400">Authorized Officer: {user?.fullName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
            <span className="font-semibold text-slate-800">Verification Standard:</span> Confirm that bank endorsements, branch manager signature, irrevocable AICTE lien status, and deposit values strictly comply with AICTE Approval Process norms.
          </div>

          {/* Decision Form */}
          <form onSubmit={handleRecordDecision} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Verification Outcome *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecision('Verified')}
                  className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'Verified'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px]">Verify Record</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('Pending Admin Approval')}
                  className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'Pending Admin Approval'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px]">Recommend for Approval</span>
                </button>

                {role === 'SUPER_ADMIN' ? (
                  <button
                    type="button"
                    onClick={() => setDecision('Approved')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      decision === 'Approved'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-[11px]">Final Admin Approval</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDecision('Rejected')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      decision === 'Rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-[11px]">Reject Record</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verification Findings & Audit Notes *
              </label>
              <textarea
                rows="3"
                required
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="State verified bank lien details, branch verification confirmation, or detailed rejection reasons..."
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Independent Bank Evidence Reference (Mandatory for 'Verified')
              </label>
              <input
                type="text"
                value={independentRef}
                onChange={(e) => setIndependentRef(e.target.value)}
                placeholder="e.g. Bank Letter Ref: SBI/DL/2026/LN-8812 / Dispatch Ref"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Records cannot be certified genuine solely on form matching. Specify verifiable bank reference.
              </p>
            </div>

            <button
              type="submit"
              disabled={submittingDecision}
              className={`w-full py-2.5 px-4 font-bold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                decision === 'Verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {submittingDecision ? 'Submitting Decision...' : `Confirm & Record: ${decision}`}
            </button>
          </form>

          {/* Alternative Action: Request Clarification / Additional Docs */}
          <div className="pt-3 border-t border-slate-200">
            {!showClarificationForm ? (
              <button
                type="button"
                onClick={() => setShowClarificationForm(true)}
                className="w-full py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileQuestion className="w-4 h-4" />
                Request Additional Documentation / Clarification
              </button>
            ) : (
              <form onSubmit={handleRequestDocuments} className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-2">
                <label className="block font-semibold text-purple-900">
                  Specify Correction / Missing Documents Required:
                </label>
                <textarea
                  rows="2"
                  required
                  value={clarificationReason}
                  onChange={(e) => setClarificationReason(e.target.value)}
                  placeholder="e.g. Certified copy of joint lien undertaking signed by Branch Manager missing. Please upload before resubmission."
                  className="w-full p-2 border border-purple-300 rounded bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClarificationForm(false)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-purple-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestingDocs}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded shadow-2xs"
                  >
                    {requestingDocs ? 'Sending...' : 'Dispatch Request to Institution'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Historical Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Audit Trail & Verification History</h2>
        <p className="text-[11px] text-slate-400 mb-4">Immutable chronological log of all reviews and state transitions</p>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">No prior verification steps recorded.</div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{h.previous_status} &rarr; {h.new_status}</span>
                    <span className="text-slate-400">by {h.action_by_name} ({h.action_by_role})</span>
                  </div>
                  {h.findings && <p className="text-slate-700 mt-1">{h.findings}</p>}
                  {h.independent_evidence_ref && (
                    <p className="text-[11px] font-mono text-emerald-700 mt-0.5">Evidence: {h.independent_evidence_ref}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(h.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* OCR Comparison Modal */}
      {activeOcrDoc && (
        <OcrCompareModal
          isOpen={!!activeOcrDoc}
          onClose={() => setActiveOcrDoc(null)}
          document={activeOcrDoc}
          fdr={fdr}
          onSaveFeedback={() => {
            fetchFdr();
          }}
        />
      )}
    </div>
  );
}
