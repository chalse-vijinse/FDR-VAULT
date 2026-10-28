import React, { useState } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { CheckCircle2, AlertTriangle, FileText, HelpCircle, Save } from 'lucide-react';
import api from '../../services/api';

export default function OcrCompareModal({ isOpen, onClose, document, fdr, onSaveFeedback }) {
  if (!document || !fdr) return null;

  let extractedData = {};
  try {
    extractedData = typeof document.ocr_extracted_json === 'string'
      ? JSON.parse(document.ocr_extracted_json || '{}')
      : (document.ocr_extracted_json || {});
  } catch (e) {
    extractedData = {};
  }

  const [ocrValues, setOcrValues] = useState({
    fdrNumber: extractedData.fdrNumber || fdr.fdr_number || '',
    bankName: extractedData.bankName || fdr.bank_name || '',
    depositAmount: extractedData.depositAmount || fdr.deposit_amount || '',
    issueDate: extractedData.issueDate || fdr.issue_date || '',
    maturityDate: extractedData.maturityDate || fdr.maturity_date || '',
    holderName: extractedData.holderName || fdr.deposit_holder_name || ''
  });

  const [officerNotes, setOfficerNotes] = useState('');
  const [forceDiscrepancy, setForceDiscrepancy] = useState(fdr.discrepancy_flag || false);
  const [saving, setSaving] = useState(false);

  // Compare submitted vs current OCR
  const fields = [
    {
      id: 'fdrNumber',
      label: 'FDR / Reference Number',
      submitted: fdr.fdr_number || '(Not Specified)',
      ocrKey: 'fdrNumber'
    },
    {
      id: 'bankName',
      label: 'Bank Name',
      submitted: fdr.bank_name || '(Not Specified)',
      ocrKey: 'bankName'
    },
    {
      id: 'depositAmount',
      label: 'Deposit Amount',
      submitted: fdr.deposit_amount ? `₹${Number(fdr.deposit_amount).toLocaleString('en-IN')}` : '₹0',
      ocrKey: 'depositAmount',
      isCurrency: true
    },
    {
      id: 'issueDate',
      label: 'Issue Date',
      submitted: fdr.issue_date || 'N/A',
      ocrKey: 'issueDate'
    },
    {
      id: 'maturityDate',
      label: 'Maturity Date',
      submitted: fdr.maturity_date || 'N/A',
      ocrKey: 'maturityDate'
    },
    {
      id: 'holderName',
      label: 'Deposit Holder Name',
      submitted: fdr.deposit_holder_name || 'N/A',
      ocrKey: 'holderName'
    }
  ];

  const checkMatch = (item) => {
    const subVal = String(fdr[item.id === 'fdrNumber' ? 'fdr_number' : item.id === 'depositAmount' ? 'deposit_amount' : item.id === 'bankName' ? 'bank_name' : item.id === 'issueDate' ? 'issue_date' : item.id === 'maturityDate' ? 'maturity_date' : 'deposit_holder_name'] || '').toLowerCase().trim();
    const ocrVal = String(ocrValues[item.ocrKey] || '').toLowerCase().trim();

    if (!ocrVal) return { status: 'Attention Required', color: 'text-amber-600 bg-amber-50' };

    if (item.isCurrency) {
      const n1 = parseFloat(fdr.deposit_amount || 0);
      const n2 = parseFloat(ocrValues.depositAmount || 0);
      if (Math.abs(n1 - n2) < 1.0) {
        return { status: 'Match', color: 'text-emerald-700 bg-emerald-50' };
      }
      return { status: 'Mismatch', color: 'text-rose-700 bg-rose-50' };
    }

    if (subVal === ocrVal || subVal.includes(ocrVal) || ocrVal.includes(subVal)) {
      return { status: 'Match', color: 'text-emerald-700 bg-emerald-50' };
    }
    return { status: 'Mismatch', color: 'text-rose-700 bg-rose-50' };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/documents/${document.id}/ocr-feedback`, {
        correctedValues: ocrValues,
        discrepancyFlag: forceDiscrepancy,
        officerNotes
      });
      if (onSaveFeedback) onSaveFeedback();
      onClose();
    } catch (err) {
      alert('Failed to save OCR feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OCR Document Inspection & Side-by-Side Comparison" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Compliance Notice */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Statutory Verification Notice:</span> OCR extraction is an automated assistive tool and does NOT establish legal authenticity. An FDR cannot be certified genuine merely because OCR fields match the form. Final verification requires authorized verification of bank endorsements and independent evidence.
          </div>
        </div>

        {/* Document Info Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800">{document.original_filename}</span>
            <span className="text-slate-400">({(document.file_size / 1024).toFixed(1)} KB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">OCR Status:</span>
            <Badge status={document.ocr_status} />
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <th className="py-2.5 px-4 w-1/4">Field</th>
                <th className="py-2.5 px-4 w-1/4">Submitted Value</th>
                <th className="py-2.5 px-4 w-1/3">OCR Extracted (Editable)</th>
                <th className="py-2.5 px-4 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {fields.map((f) => {
                const res = checkMatch(f);
                return (
                  <tr key={f.id} className={res.status === 'Mismatch' ? 'bg-rose-50/40' : ''}>
                    <td className="py-3 px-4 font-medium text-slate-700">{f.label}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{f.submitted}</td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={ocrValues[f.ocrKey]}
                        onChange={(e) => setOcrValues({ ...ocrValues, [f.ocrKey]: e.target.value })}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-royal-500 focus:border-royal-500 bg-white"
                        placeholder="Extracted value..."
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${res.color}`}>
                        {res.status === 'Match' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {res.status === 'Mismatch' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {res.status === 'Attention Required' && <HelpCircle className="w-3.5 h-3.5" />}
                        {res.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Officer Review Actions */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-xs">
          <label className="block font-medium text-slate-700">Verification Officer Findings & Discrepancy Remarks</label>
          <textarea
            rows="2"
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            placeholder="Record any discrepancies, bank seal clarity, branch lien validation notes..."
            className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 focus:border-royal-500 bg-white"
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="flagDiscrepancy"
              checked={forceDiscrepancy}
              onChange={(e) => setForceDiscrepancy(e.target.checked)}
              className="rounded border-slate-300 text-royal-600 focus:ring-royal-500 h-4 w-4"
            />
            <label htmlFor="flagDiscrepancy" className="font-medium text-slate-800">
              Flag this deposit record for Discrepancy Investigation
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href={`/api/documents/${document.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-royal-600 hover:text-royal-800 font-medium inline-flex items-center gap-1"
          >
            Open Original File in New Tab &rarr;
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium text-white bg-royal-600 rounded-lg hover:bg-royal-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving Changes...' : 'Save & Confirm Values'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
