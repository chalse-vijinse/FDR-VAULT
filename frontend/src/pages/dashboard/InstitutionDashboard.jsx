import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Building2,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  PlusCircle,
  Bell,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentFdrs, setRecentFdrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsRes, fdrRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/fdr?page=1&limit=5&sortBy=created_at&sortOrder=DESC')
        ]);

        if (statsRes.data?.success) {
          setData(statsRes.data);
        }
        if (fdrRes.data?.success) {
          setRecentFdrs(fdrRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load institution dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl" />
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
  const maturities = data?.upcomingMaturities || [];
  const notifications = data?.recentNotifications || [];

  return (
    <div className="space-y-6">
      {/* Institution Header Banner */}
      <div className="bg-gradient-to-r from-[#12345A] via-[#1a4472] to-[#2563EB] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/15 border border-white/20 text-white backdrop-blur-xs">
              {user?.institutionCode || 'INST-CODE'}
            </span>
            <span className="text-xs text-teal-300 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              FDRvault Verified College Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {user?.institutionName || 'Educational Institution'}
          </h1>
          <p className="text-xs text-slate-200 mt-0.5">
            Security Deposit & Fixed Deposit Portfolio Management Dashboard
          </p>
        </div>

        {/* Prominent Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/fdr/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-teal-500 hover:bg-teal-600 text-[#0c2440] shadow-md hover:shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
            <span>Add New FDR</span>
          </Link>
          <Link
            to="/release-requests"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all backdrop-blur-xs shadow-2xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Release</span>
          </Link>
        </div>
      </div>

      {/* Action Required Banner when Officer Requested Clarification */}
      {stats.requires_correction > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Clarification Required for {stats.requires_correction} Deposit Record(s)
              </h3>
              <p className="text-amber-800 mt-0.5 text-[11px]">
                The AICTE Verification Officer has requested corrections or missing documents. Please review officer remarks and resubmit.
              </p>
            </div>
          </div>
          <Link
            to="/fdr?status=Clarification Required"
            className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs whitespace-nowrap shadow-2xs transition-colors shrink-0 text-center"
          >
            Review & Correct Now &rarr;
          </Link>
        </div>
      )}

      {/* 4 Clean Summary Cards: Total FDRs, Pending Verification, Approved FDRs, Upcoming Maturities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total FDRs"
          value={stats.total_fdrs || 0}
          subtitle={`₹${(Number(stats.total_deposit_value || 0) / 100000).toFixed(2)} Lakhs Total`}
          icon={FileCheck2}
          variant="default"
        />
        <StatCard
          title="Pending Verification"
          value={stats.pending_verification || 0}
          subtitle="Under officer evaluation"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Approved FDRs"
          value={stats.verified_records || 0}
          subtitle="AICTE lien confirmed"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Upcoming Maturities"
          value={maturities.length}
          subtitle="Due within 60 days"
          icon={Calendar}
          variant="info"
        />
      </div>

      {/* Well-Designed FDR Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Security Deposits & FDR Records</h2>
            <p className="text-[11px] text-slate-500">Live view of institutional deposits registered in FDRvault</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/fdr"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-[#2563EB] border border-slate-200 transition-colors"
            >
              <span>View Full Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {recentFdrs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No FDR records submitted yet.</p>
            <p className="mt-1">Click "Add New FDR" above to register your institution's security deposit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">FDR Certificate No.</th>
                  <th className="px-4 py-3">Bank & Branch</th>
                  <th className="px-4 py-3">Deposit Amount</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Maturity Date</th>
                  <th className="px-4 py-3">Lifecycle Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFdrs.map((fdr) => (
                  <tr key={fdr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#12345A]">
                      <Link to={`/fdr/${fdr.id}`} className="hover:text-[#2563EB] hover:underline">
                        {fdr.fdr_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{fdr.bank_name}</div>
                      <div className="text-[10px] text-slate-400">{fdr.branch_name || 'Main Branch'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ₹{Number(fdr.deposit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fdr.issue_date || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{fdr.maturity_date || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={fdr.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/fdr/${fdr.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] hover:underline"
                      >
                        <span>View</span>
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

      {/* Two Column Grid: Maturity Reminders + Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maturity Reminders */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Maturity Reminder Schedule</h2>
              <p className="text-[11px] text-slate-500">Fixed deposits maturing in the next 60 days</p>
            </div>
            <Link to="/fdr" className="text-xs font-semibold text-[#2563EB] hover:underline">
              All Deposits &rarr;
            </Link>
          </div>

          {maturities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              No fixed deposits maturing within the next 60 days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {maturities.map((m) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{m.fdr_number}</div>
                    <div className="text-[11px] text-slate-500">{m.bank_name} &bull; ₹{Number(m.deposit_amount).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {m.maturity_date}
                    </span>
                    <Link
                      to={`/fdr/${m.id}`}
                      className="block text-[11px] text-[#2563EB] hover:underline mt-1 font-medium"
                    >
                      View Record &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity & Notifications</h2>
              <p className="text-[11px] text-slate-500">Live status updates and regulatory alerts</p>
            </div>
            <Link to="/notifications" className="text-xs font-semibold text-[#2563EB] hover:underline">
              Inbox &rarr;
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Bell className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              No recent notifications received.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-800">{n.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.link_url && (
                    <Link
                      to={n.link_url}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline mt-1.5 inline-block"
                    >
                      View Details &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
