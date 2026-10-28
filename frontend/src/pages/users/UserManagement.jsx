import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  Users2,
  Plus,
  Search,
  Filter,
  UserCheck,
  Shield,
  Building2,
  Lock,
  Mail,
  Phone
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'VERIFICATION_OFFICER',
    institution_id: '',
    designation: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Load institutions for assignment
    api.get('/institutions').then((res) => {
      if (res.data.success) setInstitutions(res.data.data);
    }).catch(console.error);
  }, [roleFilter]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await api.post('/users', newUser);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchUsers();
        setNewUser({
          email: '',
          password: '',
          full_name: '',
          role: 'VERIFICATION_OFFICER',
          institution_id: '',
          designation: '',
          phone: ''
        });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Toggle status of ${userObj.email} to ${newStatus}?`)) return;

    try {
      await api.put(`/users/${userObj.id}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert('Status update failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Authorized User & Role Access Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin directory for officers, institution administrators, and nodal accounts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Authorized User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name, email, designation..."
            className="w-64 py-1.5 px-3 border border-slate-300 rounded-lg"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="All">All User Roles</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="VERIFICATION_OFFICER">Verification Officers</option>
            <option value="INSTITUTION_ADMIN">Institution Admins</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          {users.length} Active System Accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading authorized users...</div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No user accounts match the search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Full Name & Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Associated Institution</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        u.role === 'VERIFICATION_OFFICER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {u.designation || 'Signatory'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.institution_name ? (
                        <div className="line-clamp-1 font-medium text-slate-800">{u.institution_name}</div>
                      ) : (
                        <span className="text-slate-400">AICTE Headquarters</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                          u.status === 'Active'
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Authorized User */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Authorized Portal User">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Dr. / Prof. / Officer Name"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="officer@fdrvault.aicte.gov.in"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Initial Password *</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Portal Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="VERIFICATION_OFFICER">Verification Officer</option>
                <option value="INSTITUTION_ADMIN">Institution Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {newUser.role === 'INSTITUTION_ADMIN' && (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Assign to Institution *</label>
                <select
                  value={newUser.institution_id}
                  onChange={(e) => setNewUser({ ...newUser, institution_id: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="">Select Target Institution...</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.institution_code})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Designation</label>
              <input
                type="text"
                value={newUser.designation}
                onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                placeholder="e.g. Senior Verification Officer"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+91..."
                className="w-full p-2 border border-slate-300 rounded-lg"
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
              className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
