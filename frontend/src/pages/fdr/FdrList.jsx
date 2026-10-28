import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  Building,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

export default function FdrList() {
  const { role } = useAuth();
  const [fdrs, setFdrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [recordTypeFilter, setRecordTypeFilter] = useState('All');
  const [maturityRange, setMaturityRange] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const recordTypes = [
    'All',
    'Fixed Deposit Receipt',
    'Bank Guarantee',
    'Government Security',
    'Term Deposit Certificate'
  ];

  const statuses = [
    'All',
    'Draft',
    'Submitted',
    'Under Verification',
    'Clarification Required',
    'Resubmitted',
    'Verified',
    'Pending Admin Approval',
    'Approved',
    'Released',
    'Rejected'
  ];

  const maturityFilters = [
    { label: 'All Horizons', value: 'All' },
    { label: 'Matured / Past Due', value: 'matured' },
    { label: 'Within 7 Days', value: 'upcoming-7' },
    { label: 'Within 15 Days', value: 'upcoming-15' },
    { label: 'Within 30 Days', value: 'upcoming-30' }
  ];

  const fetchFdrs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder
      };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (recordTypeFilter !== 'All') params.record_type = recordTypeFilter;
      if (maturityRange !== 'All') params.maturity_range = maturityRange;

      const res = await api.get('/fdr', { params });
      if (res.data.success) {
        setFdrs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch FDR records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFdrs();
  }, [page, statusFilter, recordTypeFilter, maturityRange, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFdrs();
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('ASC');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Security Deposit & FDR Records Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional fixed deposit receipts, bank guarantees, and statutory escrow accounts
          </p>
        </div>

        <Link
          to="/fdr/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New FDR
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="lg:col-span-4 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FDR number, bank, institution..."
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

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={recordTypeFilter}
              onChange={(e) => { setRecordTypeFilter(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white"
            >
              {recordTypes.map((rt) => (
                <option key={rt} value={rt}>Type: {rt}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={maturityRange}
              onChange={(e) => { setMaturityRange(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500 bg-white font-medium text-amber-800"
            >
              {maturityFilters.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading FDR records...</div>
        ) : fdrs.length === 0 ? (
          <EmptyState
            title="No Deposit Records Found"
            description="No records match your selected search or filter parameters."
            actionText="Submit New FDR"
            onAction={() => window.location.href = '/fdr/create'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('fdr_number')}>
                    <div className="flex items-center gap-1">
                      <span>FDR / Ref Number</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4" onClick={() => toggleSort('bank_name')}>
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      <span>Bank & Type</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => toggleSort('deposit_amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Deposit Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('maturity_date')}>
                    <div className="flex items-center gap-1">
                      <span>Maturity Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fdrs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono">
                        {item.fdr_number || `Deposit #${item.id}`}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ref: {item.approval_reference || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{item.institution_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.institution_code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.bank_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{item.record_type}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(item.deposit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.maturity_date}</div>
                      <div className="text-[10px] text-slate-400">Issue: {item.issue_date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={item.status} />
                      {item.discrepancy_flag === 1 && (
                        <span className="block mt-1 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Discrepancy Flagged
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/fdr/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
