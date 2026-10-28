import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  FileCheck2,
  Users,
  History,
  Calendar,
  Edit,
  ArrowLeft,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

export default function InstitutionDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/institutions/${id}`);
      if (res.data.success) {
        setInstitution(res.data.data);
        setEditForm(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load institution details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/institutions/${id}`, editForm);
      setIsEditOpen(false);
      fetchDetail();
    } catch (err) {
      alert('Failed to update institution: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading institution profile...</div>;
  }

  if (error || !institution) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        {error || 'Institution not found.'}
      </div>
    );
  }

  const fdrs = institution.fdrRecords || [];
  const users = institution.authorizedUsers || [];
  const logs = institution.auditHistory || [];
  const totalAmount = fdrs.reduce((acc, f) => acc + parseFloat(f.deposit_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/institutions" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Institutions Registry
        </Link>
      </div>

      {/* Institution Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-royal-50 border border-royal-200 text-royal-700 flex items-center justify-center font-bold text-xl shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {institution.institution_code}
                </span>
                <Badge status={institution.status} />
                <span className="text-xs text-slate-400">&bull; {institution.category}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                {institution.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {institution.address}, {institution.district}, {institution.state} - {institution.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                Edit Profile
              </button>
            )}
            <Link
              to="/fdr/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Deposit
            </Link>
          </div>
        </div>

        {/* Quick Contact & Summary Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Authorized Contact</span>
            <p className="font-medium text-slate-800 mt-0.5">{institution.contact_name}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Official Email</span>
            <p className="font-medium text-slate-800 mt-0.5 truncate">{institution.contact_email}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Phone</span>
            <p className="font-medium text-slate-800 mt-0.5">{institution.contact_phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Deposit Holding</span>
            <p className="font-bold text-royal-700 mt-0.5">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Associated FDR Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Associated Security Deposit & FDR Records</h2>
            <p className="text-[11px] text-slate-400">All registered fixed deposits and bank guarantees submitted by this institution</p>
          </div>
          <Link
            to="/fdr/create"
            className="text-xs font-semibold text-royal-600 hover:text-royal-800"
          >
            + Create Deposit Record
          </Link>
        </div>

        {fdrs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No FDR records registered for this institution yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-2.5 px-3">FDR / Ref Number</th>
                  <th className="py-2.5 px-3">Record Type</th>
                  <th className="py-2.5 px-3">Bank Details</th>
                  <th className="py-2.5 px-3 text-right">Deposit Amount</th>
                  <th className="py-2.5 px-3">Maturity Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fdrs.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {f.fdr_number || `Deposit #${f.id}`}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{f.record_type}</td>
                    <td className="py-3 px-3">{f.bank_name || 'N/A'}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ₹{Number(f.deposit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {f.maturity_date}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={f.status} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        to={`/fdr/${f.id}`}
                        className="text-xs font-semibold text-royal-600 hover:text-royal-800"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorized Users & Audit History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Authorized Users */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-card p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Authorized Institutional Users</h2>
          <p className="text-[11px] text-slate-400 mb-4">Credentials authorized to manage deposits for this institute</p>

          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-xs text-slate-400">No users registered.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{u.full_name}</p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                    <p className="text-[10px] text-slate-400">{u.designation || 'Signatory'}</p>
                  </div>
                  <Badge status={u.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Institution Audit History */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-card p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Institutional Audit Log</h2>
          <p className="text-[11px] text-slate-400 mb-4">Chronological record of submissions, approvals, and releases</p>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400">No historical audit events logged.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{log.change_summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Institution Details">
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                disabled={role !== 'SUPER_ADMIN'}
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={editForm.contact_name || ''}
                onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={editForm.contact_email || ''}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editForm.contact_phone || ''}
                onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-royal-600 text-white rounded-lg hover:bg-royal-700 font-semibold shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
