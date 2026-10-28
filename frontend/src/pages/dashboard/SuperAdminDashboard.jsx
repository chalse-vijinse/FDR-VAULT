import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Building2,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Download,
  Filter,
  Search,
  ShieldAlert,
  ArrowRight,
  History,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Queue Filter States
  const [collegeFilter, setCollegeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [maturityPeriodFilter, setMaturityPeriodFilter] = useState('All');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard-stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError('Failed to fetch system dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        {error || 'Unable to load dashboard.'}
      </div>
    );
  }

  const { stats, charts, recentActivity, pendingApprovalList = [], pendingReleaseList = [] } = data;

  // Modern Fintech Status Colors
  const STATUS_COLORS = {
    Verified: '#10B981',             // Green for approved
    Approved: '#10B981',
    'Under Review': '#2563EB',        // Blue for under verification
    'Under Verification': '#2563EB',
    Submitted: '#F59E0B',            // Amber for pending
    'Pending Admin Approval': '#14B8A6', // Teal for ready for signoff
    Resubmitted: '#8B5CF6',
    'Additional Documents Required': '#F97316',
    Draft: '#94A3B8',
    Rejected: '#EF4444'              // Red for rejected
  };

  const pieData = (charts?.statusDistribution || []).map((item) => ({
    ...item,
    color: STATUS_COLORS[item.name] || '#64748B'
  }));

  // Filter Approval Queue
  const filteredApprovals = pendingApprovalList.filter((item) => {
    const matchesCollege =
      !collegeFilter ||
      item.institution_name?.toLowerCase().includes(collegeFilter.toLowerCase()) ||
      item.fdr_number?.toLowerCase().includes(collegeFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesBank =
      bankFilter === 'All' ||
      item.bank_name?.toLowerCase().includes(bankFilter.toLowerCase());

    return matchesCollege && matchesStatus && matchesBank;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#12345A] via-[#163f6d] to-[#2563EB] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/15 border border-white/20 text-white backdrop-blur-xs">
              AICTE Headquarters
            </span>
            <span className="text-xs text-teal-300 font-medium">
              &bull; FDRvault Central Regulatory Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            System Administration & Institutional Monitoring
          </h1>
          <p className="text-xs text-slate-200 mt-0.5">
            Real-time compliance surveillance across all AICTE-affiliated institutions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all backdrop-blur-xs shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" />
            <span>Export Reports</span>
          </Link>
          <Link
            to="/verifications"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-[#0c2440] shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* 4 Prominent Overview Cards: Total Colleges, Total FDRs, Pending Approvals, Release Requests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Colleges"
          value={stats.totalInstitutions || 0}
          subtitle="Accredited technical entities"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Total FDRs"
          value={stats.totalFdrs || 0}
          subtitle={`₹${(Number(stats.totalDepositValue || 0) / 10000000).toFixed(2)} Cr Total Assets`}
          icon={TrendingUp}
          variant="info"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingVerification || 0}
          subtitle="Awaiting officer & admin action"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Release Requests"
          value={stats.pendingReleaseRequests || 0}
          subtitle="Lien discharge reviews active"
          icon={ArrowUpRight}
          variant="info"
        />
      </div>

      {/* Structured Filters Bar for Queue */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Filter className="w-4 h-4 text-[#2563EB]" />
          <span>Surveillance Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* College / Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search college or FDR #..."
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-48 sm:w-56 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-700 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Admin Approval">Pending Admin Approval</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Resubmitted">Resubmitted</option>
            </select>
          </div>

          {/* Bank Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-700 bg-white"
            >
              <option value="All">All Banks</option>
              <option value="State Bank of India">State Bank of India</option>
              <option value="Punjab National Bank">Punjab National Bank</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="Canara Bank">Canara Bank</option>
              <option value="Bank of Baroda">Bank of Baroda</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(collegeFilter || statusFilter !== 'All' || bankFilter !== 'All') && (
            <button
              onClick={() => {
                setCollegeFilter('');
                setStatusFilter('All');
                setBankFilter('All');
              }}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Analytics Charts Grid: Status Distribution & Deposit Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">FDR Verification Status Breakdown</h2>
              <p className="text-[11px] text-slate-500">Portfolio distribution by statutory stage</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Records`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Institution-wise Deposit Volume Bar Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Deposit Holding by Institution (₹ Lakhs)</h2>
              <p className="text-[11px] text-slate-500">Security deposit values held under AICTE lien</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(charts?.institutionWiseChart || []).map((i) => ({
                  name: i.name.length > 20 ? i.name.substring(0, 18) + '...' : i.name,
                  amount: Math.round(Number(i.total_amount) / 100000)
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} unit="L" />
                <Tooltip
                  formatter={(val) => [`₹${val} Lakhs`, 'Total Deposit']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Structured Approval Queue & Release Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Structured Approval Queue */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Structured Approval Queue ({filteredApprovals.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                FDR submissions awaiting administrative signoff or regulatory oversight
              </p>
            </div>
            <Link to="/verifications" className="text-xs font-semibold text-[#2563EB] hover:underline">
              Full Queue &rarr;
            </Link>
          </div>

          {filteredApprovals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
              All matching recommendations reviewed. No pending approvals in this view.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredApprovals.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#12345A]">{item.fdr_number || `FDR #${item.id}`}</span>
                      <Badge status={item.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <span className="font-medium text-slate-900">{item.institution_name}</span> &bull; ₹{Number(item.deposit_amount).toLocaleString('en-IN')} &bull; {item.bank_name}
                    </p>
                    {item.officer_name && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned Officer: {item.officer_name}</p>
                    )}
                  </div>
                  <Link
                    to={`/verifications/${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-royal-50 hover:bg-royal-100 text-[#2563EB] font-semibold text-xs border border-blue-200 shrink-0 inline-flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Release Requests Queue */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pending Release Requests
              </h2>
              <p className="text-[11px] text-slate-500">
                Deposit lien discharge applications requiring administrative NOC
              </p>
            </div>
            <Link to="/release-requests" className="text-xs font-semibold text-[#2563EB] hover:underline">
              View All &rarr;
            </Link>
          </div>

          {pendingReleaseList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
              No pending security deposit release applications.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReleaseList.map((rel) => (
                <div key={rel.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#12345A] font-mono">{rel.request_reference}</span>
                      <Badge status={rel.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{rel.institution_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">₹{Number(rel.deposit_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <Link
                    to={`/release-requests/${rel.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 shrink-0 transition-colors"
                  >
                    Review NOC &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Maturity Horizon & Real-Time Audit Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maturity Horizon */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-slate-900">Maturity Timeline Horizon</h2>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Deposit maturity distribution among verified instruments</p>
          <div className="space-y-2.5">
            {(charts?.maturityBuckets || []).map((b) => (
              <div key={b.bucket} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-200">
                <span className="font-medium text-slate-700">{b.bucket}</span>
                <span className="font-bold text-[#12345A] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {b.count} Deposits
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link to="/reports" className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              <span>View Detailed Maturity Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Immutable Audit Activity Feed */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Immutable Audit Event Stream</h2>
                <p className="text-[11px] text-slate-500">Live regulatory audit trail across all colleges and actions</p>
              </div>
            </div>
            <Link to="/audit-logs" className="text-xs font-semibold text-[#2563EB] hover:underline">
              Full Audit Trail &rarr;
            </Link>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {recentActivity.map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-[#2563EB] border border-blue-200">
                      {log.entity_type} #{log.entity_id}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{log.change_summary}</p>
                <div className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-2">
                  <span>By: <span className="text-slate-700 font-medium">{log.user_email}</span></span>
                  <span>&bull;</span>
                  <span className="uppercase font-semibold text-slate-500">{log.user_role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
