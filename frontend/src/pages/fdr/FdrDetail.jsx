import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import WorkflowTracker from '../../components/common/WorkflowTracker';
import OcrCompareModal from '../../components/ocr/OcrCompareModal';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Building2,
  Calendar,
  AlertTriangle,
  Upload,
  FileText,
  Eye,
  CheckCircle2,
  Send,
  ArrowLeft,
  Clock,
  ShieldCheck,
  HelpCircle,
  FileDown,
  ArrowUpRight,
  Edit3,
  MessageSquare,
  Save,
  CheckSquare
} from 'lucide-react';

export default function FdrDetail() {
  const { id } = useParams();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [fdr, setFdr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File Upload State
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('FDR Certificate');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // OCR Modal State
  const [activeCompareDoc, setActiveCompareDoc] = useState(null);

  // Edit / Correct FDR Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fdr_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    deposit_amount: '',
    issue_date: '',
    maturity_date: '',
    deposit_holder_name: '',
    deposit_purpose: '',
    additional_notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Release Request Modal State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [complianceNotes, setComplianceNotes] = useState('');
  const [submittingRelease, setSubmittingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState('');

  const fetchFdrDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/fdr/${id}`);
      if (res.data.success) {
        setFdr(res.data.data);
        setEditFormData({
          fdr_number: res.data.data.fdr_number || '',
          bank_name: res.data.data.bank_name || '',
          branch_name: res.data.data.branch_name || '',
          ifsc_code: res.data.data.ifsc_code || '',
          deposit_amount: res.data.data.deposit_amount || '',
          issue_date: res.data.data.issue_date || '',
          maturity_date: res.data.data.maturity_date || '',
          deposit_holder_name: res.data.data.deposit_holder_name || '',
          deposit_purpose: res.data.data.deposit_purpose || '',
          additional_notes: res.data.data.additional_notes || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load FDR record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFdrDetail();
  }, [id]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', docType);

    try {
      const res = await api.post(`/fdr/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFile(null);
        setUploadMessage('Document uploaded and OCR processed successfully.');
        fetchFdrDetail();
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.deposit_amount || parseFloat(editFormData.deposit_amount) <= 0) {
      setEditError('Deposit amount must be a positive number.');
      return;
    }

    if (!editFormData.issue_date || !editFormData.maturity_date) {
      setEditError('Both issue date and maturity date are required.');
      return;
    }

    if (new Date(editFormData.maturity_date) <= new Date(editFormData.issue_date)) {
      setEditError('Maturity date must not precede or equal the issue date.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await api.put(`/fdr/${id}`, editFormData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        fetchFdrDetail();
      } else {
        setEditError(res.data.message);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update FDR details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmitForVerification = async () => {
    const isClarification = ['Clarification Required', 'Additional Documents Required'].includes(fdr.status);
    const confirmPrompt = isClarification
      ? 'Resubmit this corrected deposit record and documents for verification officer review?'
      : 'Submit this deposit record for formal AICTE verification review? Ensure certificate scans are attached.';

    if (!window.confirm(confirmPrompt)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/fdr/${id}/submit`);
      if (res.data.success) {
        fetchFdrDetail();
      }
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReleaseRequest = async (e) => {
    e.preventDefault();
    if (!releaseReason || releaseReason.trim().length < 10) {
      setReleaseError('Please enter a substantive reason for release (min 10 characters).');
      return;
    }

    setSubmittingRelease(true);
    setReleaseError('');
    try {
      const res = await api.post('/release-requests', {
        fdr_id: id,
        reason_for_release: releaseReason,
        compliance_notes: complianceNotes
      });
      if (res.data.success) {
        setIsReleaseModalOpen(false);
        setReleaseReason('');
        setComplianceNotes('');
        alert('Release request submitted successfully! Pending administrative compliance review.');
        navigate('/release-requests');
      }
    } catch (err) {
      setReleaseError(err.response?.data?.message || 'Failed to submit release request.');
    } finally {
      setSubmittingRelease(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading Deposit Record #{id}...</div>;
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
  const duplicateWarnings = fdr.duplicateWarnings || [];
  const canEdit = ['Draft', 'Clarification Required', 'Additional Documents Required'].includes(fdr.status) || role === 'SUPER_ADMIN';
  const canSubmit = ['Draft', 'Clarification Required', 'Additional Documents Required'].includes(fdr.status);
  const isEligibleForRelease = ['Verified', 'Approved'].includes(fdr.status);

  // Officer Clarification Remarks (if any)
  const isClarificationRequired = ['Clarification Required', 'Additional Documents Required'].includes(fdr.status);
  const officerRemark = fdr.discrepancy_details || (history.length > 0 ? history[0].findings : '');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/fdr" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to FDR Records List
        </Link>
      </div>

      {/* 7-Stage FDR Lifecycle Visualization */}
      <WorkflowTracker
        status={fdr.status}
        clarificationRemark={officerRemark}
        rejectionReason={fdr.rejection_reason}
      />

      {/* Prominent Officer Clarification Notice Banner */}
      {isClarificationRequired && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400/80 rounded-xl text-xs text-amber-900 shadow-sm flex items-start gap-3.5">
          <MessageSquare className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-950">
                Action Required: Officer Clarification Requested
              </span>
              <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                Pending Correction
              </span>
            </div>
            <p className="mt-1.5 text-xs text-amber-900 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200 font-medium">
              {officerRemark || 'Verification officer requested corrections or additional evidence. Please update details and upload required scans below before resubmitting.'}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Correct FDR Details Now
              </button>
              <button
                type="button"
                onClick={handleSubmitForVerification}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg bg-royal-600 hover:bg-royal-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Resubmitting...' : 'Resubmit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate warning alert banner */}
      {duplicateWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Duplicate Reference Number Alert:</span>
            <p className="mt-0.5 text-amber-800">
              {duplicateWarnings[0].message}
            </p>
          </div>
        </div>
      )}

      {/* Discrepancy Alert Banner */}
      {fdr.discrepancy_flag === 1 && !isClarificationRequired && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Discrepancy Investigation Flagged:</span>
            <p className="mt-0.5 text-rose-800">
              {fdr.discrepancy_details || 'Form values diverge from OCR extracted values. Verification Officer review mandatory.'}
            </p>
          </div>
        </div>
      )}

      {/* Main FDR Record Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-royal-50 border border-royal-200 text-royal-700 flex items-center justify-center font-bold shrink-0">
              <FileCheck2 className="w-6 h-6" />
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Edit Button (when Draft or Clarification Required) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Correct / Edit Details
              </button>
            )}

            {/* Institution Admin: Submit / Resubmit for verification button */}
            {canSubmit && (
              <button
                onClick={handleSubmitForVerification}
                disabled={submitting || documents.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                title={documents.length === 0 ? 'Upload supporting document first' : ''}
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : isClarificationRequired ? 'Resubmit for Verification' : 'Submit for Verification'}
              </button>
            )}

            {/* Verification Officer or Super Admin: Review in Verification Queue */}
            {(role === 'VERIFICATION_OFFICER' || role === 'SUPER_ADMIN') && (
              <Link
                to={`/verifications/${fdr.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Review & Record Decision
              </Link>
            )}

            {/* Release Request Button (when Verified or Approved) */}
            {isEligibleForRelease && (
              <button
                type="button"
                onClick={() => setIsReleaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-2xs transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Apply for Release
              </button>
            )}
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Date of Issue</span>
            <p className="font-semibold text-slate-800 mt-0.5">{fdr.issue_date}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Date of Maturity</span>
            <p className="font-semibold text-royal-700 mt-0.5">{fdr.maturity_date}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Branch & IFSC</span>
            <p className="font-medium text-slate-800 mt-0.5">{fdr.branch_name || 'Branch N/A'} ({fdr.ifsc_code || 'IFSC N/A'})</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Approval Reference</span>
            <p className="font-mono text-slate-800 mt-0.5">{fdr.approval_reference || 'N/A'}</p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Deposit Holder / Joint Account Title</span>
            <p className="font-medium text-slate-800 mt-0.5">{fdr.deposit_holder_name}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Statutory Purpose</span>
            <p className="font-medium text-slate-800 mt-0.5">{fdr.deposit_purpose}</p>
          </div>
          {fdr.additional_notes && (
            <div className="sm:col-span-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Notes & Annotations</span>
              <p className="text-slate-600 mt-0.5">{fdr.additional_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Documents Management & Verification Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Supporting Documents & OCR Module */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Supporting Documents & OCR Validation</h2>
              <p className="text-[11px] text-slate-400">PDF scans and images processed through OCR discrepancy engine</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {documents.length} Files
            </span>
          </div>

          {/* Upload Widget */}
          <form onSubmit={handleFileUpload} className="p-3.5 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-1/3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="FDR Certificate">FDR Certificate</option>
                  <option value="Bank Confirmation Letter">Bank Confirmation Letter</option>
                  <option value="Joint Account Undertaking">Joint Account Undertaking</option>
                  <option value="Board Resolution">Board Resolution</option>
                  <option value="Other Evidence">Other Evidence</option>
                </select>
              </div>

              <div className="sm:w-2/3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (PDF, PNG, JPG - Max 10MB)</label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  required
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-royal-50 file:text-royal-700 hover:file:bg-royal-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-400">Files stored with access-controlled cloud and database persistence.</p>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Processing OCR...' : 'Upload & Process OCR'}
              </button>
            </div>
          </form>

          {/* Documents Table */}
          {documents.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No supporting documents uploaded yet. Upload an FDR Certificate scan to proceed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">OCR Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-royal-600" />
                          <span className="truncate max-w-xs">{doc.original_filename}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{doc.document_type}</td>
                      <td className="py-3 px-3">
                        <Badge status={doc.ocr_status} />
                      </td>
                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <a
                          href={`/api/documents/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <FileDown className="w-3 h-3" />
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => setActiveCompareDoc(doc)}
                          className="px-2.5 py-1 rounded bg-royal-50 text-royal-700 hover:bg-royal-100 text-xs font-semibold inline-flex items-center gap-1 border border-royal-200"
                        >
                          <Eye className="w-3 h-3" />
                          OCR Compare
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Timeline & Workflow State Machine */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Verification History & Findings</h2>
            <Badge status={fdr.status} />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Record is currently in Draft. Verification audit steps will appear once submitted.
              </p>
            ) : (
              history.map((h, i) => (
                <div key={h.id} className="relative pl-6 pb-3 border-l-2 border-royal-200 last:border-l-0 text-xs">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-royal-600 ring-2 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{h.new_status}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">By {h.action_by_name || 'Authorized Officer'}</p>
                  {h.findings && (
                    <div className="mt-1.5 p-2 bg-slate-50 rounded-lg text-slate-700 text-[11px] border border-slate-100">
                      {h.findings}
                    </div>
                  )}
                  {h.independent_evidence_ref && (
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Bank Evidence Ref: {h.independent_evidence_ref}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit / Correct FDR Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Correct & Update FDR Details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          {editError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">FDR / Receipt Number *</label>
              <input
                type="text"
                required
                value={editFormData.fdr_number}
                onChange={(e) => setEditFormData({ ...editFormData, fdr_number: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={editFormData.bank_name}
                onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={editFormData.branch_name}
                onChange={(e) => setEditFormData({ ...editFormData, branch_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={editFormData.ifsc_code}
                onChange={(e) => setEditFormData({ ...editFormData, ifsc_code: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deposit Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editFormData.deposit_amount}
                onChange={(e) => setEditFormData({ ...editFormData, deposit_amount: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={editFormData.issue_date}
                onChange={(e) => setEditFormData({ ...editFormData, issue_date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maturity Date *</label>
              <input
                type="date"
                required
                value={editFormData.maturity_date}
                onChange={(e) => setEditFormData({ ...editFormData, maturity_date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder / Joint AICTE Name *</label>
              <input
                type="text"
                required
                value={editFormData.deposit_holder_name}
                onChange={(e) => setEditFormData({ ...editFormData, deposit_holder_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Deposit Purpose *</label>
              <input
                type="text"
                required
                value={editFormData.deposit_purpose}
                onChange={(e) => setEditFormData({ ...editFormData, deposit_purpose: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Additional Clarification Notes</label>
              <textarea
                rows="2"
                value={editFormData.additional_notes}
                onChange={(e) => setEditFormData({ ...editFormData, additional_notes: e.target.value })}
                placeholder="Notes detailing corrections made in response to officer clarification..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingEdit ? 'Saving Changes...' : 'Save Updated Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Release Request Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Submit Security Deposit Release Application"
      >
        <form onSubmit={handleSubmitReleaseRequest} className="space-y-4 text-xs">
          {releaseError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{releaseError}</span>
            </div>
          )}

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-[11px]">
            <span className="font-semibold">Deposit Reference:</span> {fdr.fdr_number} &bull; ₹{Number(fdr.deposit_amount).toLocaleString('en-IN')} &bull; Maturing: {fdr.maturity_date}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Substantive Reason for Release *
            </label>
            <textarea
              rows="3"
              required
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="e.g. Mandatory statutory lien period completed, zero academic compliance discrepancies pending, AICTE annual approval renewed."
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supporting Compliance Details
            </label>
            <textarea
              rows="2"
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="e.g. Bank release endorsement attached; No outstanding inspection remarks."
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRelease}
              className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              {submittingRelease ? 'Submitting...' : 'Submit Release Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* OCR Side-by-Side Comparison Modal */}
      {activeCompareDoc && (
        <OcrCompareModal
          isOpen={!!activeCompareDoc}
          onClose={() => setActiveCompareDoc(null)}
          document={activeCompareDoc}
          fdr={fdr}
          onSaveFeedback={() => {
            fetchFdrDetail();
          }}
        />
      )}
    </div>
  );
}
