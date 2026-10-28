import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  Eye
} from 'lucide-react';

export default function InstitutionList() {
  const { role } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Register Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInst, setNewInst] = useState({
    institution_code: '',
    name: '',
    category: 'Engineering & Technology',
    address: '',
    state: 'Delhi',
    district: '',
    pincode: '',
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const states = ['All', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'Uttar Pradesh', 'Gujarat'];
  const categories = ['All', 'Engineering & Technology', 'Management', 'Pharmacy', 'Polytechnic & Applied Sciences'];

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (stateFilter !== 'All') params.state = stateFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const res = await api.get('/institutions', { params });
      if (res.data.success) {
        setInstitutions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [stateFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInstitutions();
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await api.post('/institutions', newInst);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchInstitutions();
        setNewInst({
          institution_code: '',
          name: '',
          category: 'Engineering & Technology',
          address: '',
          state: 'Delhi',
          district: '',
          pincode: '',
          contact_name: '',
          contact_email: '',
          contact_phone: ''
        });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create institution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Educational Institutions Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of affiliated universities and institutions managing AICTE statutory deposits
          </p>
        </div>

        {role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Institution
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Institution Name, Code, Contact..."
              className="w-full pl-9 pr-20 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 text-xs font-medium text-white bg-royal-600 rounded-md hover:bg-royal-700"
            >
              Search
            </button>
          </form>

          <div className="md:col-span-3">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
            >
              {states.map((s) => (
                <option key={s} value={s}>State: {s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>Category: {c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <EmptyState
            title="No Institutions Found"
            description="No institutions match your search or filter settings."
            actionText={role === 'SUPER_ADMIN' ? 'Register New Institution' : null}
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Code / Institution Name</th>
                  <th className="py-3 px-4">Category & Location</th>
                  <th className="py-3 px-4">Authorized Contact</th>
                  <th className="py-3 px-4 text-center">FDR Records</th>
                  <th className="py-3 px-4 text-right">Total Deposit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[10px] text-royal-700 font-semibold">{inst.institution_code}</div>
                      <Link to={`/institutions/${inst.id}`} className="font-bold text-slate-900 hover:text-royal-600 block text-xs">
                        {inst.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{inst.category}</div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {inst.district}, {inst.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{inst.contact_name}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{inst.contact_email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                        {inst.total_fdrs || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(inst.total_deposit_value || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inst.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/institutions/${inst.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Institution (Super Admin) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Educational Institution">
        <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Institution Name *</label>
              <input
                type="text"
                required
                value={newInst.name}
                onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                placeholder="e.g. Indian Institute of Information Technology"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institution Code *</label>
              <input
                type="text"
                required
                value={newInst.institution_code}
                onChange={(e) => setNewInst({ ...newInst, institution_code: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 font-mono"
                placeholder="e.g. AICTE-DL-2026-99"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={newInst.category}
                onChange={(e) => setNewInst({ ...newInst, category: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <select
                value={newInst.state}
                onChange={(e) => setNewInst({ ...newInst, state: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                {states.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                required
                value={newInst.district}
                onChange={(e) => setNewInst({ ...newInst, district: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="District"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={newInst.address}
                onChange={(e) => setNewInst({ ...newInst, address: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="Full address"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Contact Name *</label>
              <input
                type="text"
                required
                value={newInst.contact_name}
                onChange={(e) => setNewInst({ ...newInst, contact_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="Dr. / Prof. Name"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={newInst.contact_email}
                onChange={(e) => setNewInst({ ...newInst, contact_email: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="official@institute.ac.in"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newInst.contact_phone}
                onChange={(e) => setNewInst({ ...newInst, contact_phone: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="+91..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-royal-600 text-white rounded-lg hover:bg-royal-700 font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Institution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
