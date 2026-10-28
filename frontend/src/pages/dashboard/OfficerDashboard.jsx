import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileQuestion,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  ArrowUpRight,
  Building2,
  Eye,
  CheckSquare,
  MessageSquare
} from 'lucide-react';

export default function OfficerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/reports/dashboard-stats');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load officer dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const activeQueue = data?.activeQueue || [];
  const recentReviewed = data?.recentReviewed || [];

  // Filter active queue by search query and status filter
  const filteredQueue = activeQueue.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.fdr_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.institution_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Discrepancy' && item.discrepancy_flag === 1) ||
      (statusFilter === 'Clarification' && (item.status?.toLowerCase().includes('clarification') || item.status?.toLowerCase().includes('additional'))) ||
      (statusFilter === 'Pending' && !item.status?.toLowerCase().includes('clarification'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Header Banner */}
      <div className="bg-gradient-to-r from-[#12345A] to-[#1e4a7a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30">
              AICTE Regulatory Officer
            </span>
            <span className="text-xs text-slate-300">&bull; Verification Queue Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Verification Officer Workbench
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Institutional deposit review queue, OCR discrepancy validation, and statutory recommendations
          </p>
        </div>
        <div>
          <Link
            to="/verifications"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-[#0c2440] shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            <span>Open Full Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards matching exact prompt:
          Pending Verification, Clarification Required, Verified FDRs, Pending Release Reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Verification"
          value={stats.pendingVerification ?? stats.pendingTasks ?? 0}
          subtitle="Deposit records awaiting action"
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Clarification Required"
          value={stats.clarificationRequired ?? stats.missingDocsCases ?? 0}
          subtitle="Institution resubmissions pending"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Verified FDRs"
          value={stats.verifiedFdrs ?? 0}
          subtitle="Statutory liens validated"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Pending Release Reviews"
          value={stats.pendingReleaseReviews ?? 0}
          subtitle="Discharge requests to evaluate"
          icon={ArrowUpRight}
          variant="default"
        />
      </div>

      {/* Clean Verification Queue with Search, Filters, and Review Actions */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assigned Verification Queue</h2>
            <p className="text-[11px] text-slate-500">
              Prioritized submissions requiring document validation and OCR inspection
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search college or FDR #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-700 bg-white"
              >
                <option value="All">All Queue</option>
                <option value="Pending">Pending Action</option>
                <option value="Clarification">Clarification Required</option>
                <option value="Discrepancy">Discrepancy Detected</option>
              </select>
            </div>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No items match the selected filter in your queue.</p>
            <p className="mt-1">All current submissions have been processed or moved to approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">College / Institution</th>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Bank & Amount</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Discrepancy</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <div className="truncate max-w-[200px]" title={item.institution_name}>
                        {item.institution_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      <Link to={`/verifications/${item.id}`} className="hover:text-[#2563EB] hover:underline font-semibold text-[#12345A]">
                        {item.fdr_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{item.bank_name}</div>
                      <div className="text-[10px] text-slate-500">₹{Number(item.deposit_amount).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.discrepancy_flag === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          OCR Flagged
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/verifications/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <span>Review & Verify</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Organized Document Preview & Recent Reviews with Officer Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recently Reviewed Records Stream */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Verification Outcomes & Remarks</h2>
              <p className="text-[11px] text-slate-500">Audit trail of regulatory decisions recorded by officer</p>
            </div>
            <Link to="/audit-logs" className="text-xs font-semibold text-[#2563EB] hover:underline">
              Audit Logs &rarr;
            </Link>
          </div>

          {recentReviewed.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              No recent review records logged in this session.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviewed.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{r.institution_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {r.fdr_number} &bull; {r.bank_name} &bull; ₹{Number(r.deposit_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Badge status={r.decision || r.status} size="sm" />
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Logged on: {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <Link
                      to={`/verifications/${r.id}`}
                      className="font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Inspect Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Controls & Guidelines Card */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">AICTE Verification Protocol</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Statutory review checklists for AICTE Approval Process Handbook (APH) compliance:
          </p>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
              <div>
                <span className="font-semibold text-slate-800">Lien Endorsement</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Verify that the FDR certificate is issued jointly or lien-marked in favor of AICTE.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
              <div>
                <span className="font-semibold text-slate-800">OCR Discrepancy Cross-Check</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Compare digital form values against automated document OCR extractions.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
              <div>
                <span className="font-semibold text-slate-800">Clarification Requests</span>
                <p className="text-[11px] text-slate-500 mt-0.5">If scans are illegible or missing bank confirmation letters, request college clarification.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/reports"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Generate Officer Verification Report &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
