import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import {
  History,
  Search,
  Filter,
  Shield,
  Download,
  Calendar,
  User,
  Activity
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');

  const actions = [
    'All',
    'LOGIN',
    'LOGOUT',
    'FDR_CREATED',
    'FDR_SUBMITTED',
    'FDR_VERIFIED',
    'FDR_REJECTED',
    'VERIFICATION_ASSIGNED',
    'DISCREPANCY_FLAGGED',
    'RELEASE_REQUEST_SUBMITTED',
    'INSTITUTION_CREATED',
    'USER_CREATED'
  ];

  const entities = ['All', 'FDR', 'INSTITUTION', 'USER', 'RELEASE_REQUEST', 'DOCUMENT', 'SYSTEM'];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter !== 'All') params.action = actionFilter;
      if (entityFilter !== 'All') params.entityType = entityFilter;
      if (search) params.search = search;

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Immutable Regulatory Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological audit trail of all institutional actions, officer decisions, and security events
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor email, entity ID, or description..."
              className="w-full pl-9 pr-20 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 font-medium text-white bg-royal-600 rounded-md hover:bg-royal-700"
            >
              Filter
            </button>
          </form>

          <div className="md:col-span-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {actions.map((a) => (
                <option key={a} value={a}>Action: {a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {entities.map((ent) => (
                <option key={ent} value={ent}>Entity: {ent}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description="No audit trail events match your search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Change Summary</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.user_email || 'System Worker'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                        {log.user_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-royal-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.entity_type}</span>
                      {log.entity_id && <span className="text-slate-400 font-mono text-[10px]"> #{log.entity_id}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm leading-relaxed">
                      {log.change_summary}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
