import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  Calendar,
  Building,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('fdr'); // 'fdr', 'maturities'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [daysFilter, setDaysFilter] = useState('90');

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'fdr') {
        const res = await api.get('/reports/fdr', {
          params: { status: statusFilter }
        });
        if (res.data.success) setData(res.data.data);
      } else {
        const res = await api.get('/reports/maturities', {
          params: { days: daysFilter }
        });
        if (res.data.success) setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, statusFilter, daysFilter]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `FDRvault_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalAmount = data.reduce((acc, row) => acc + parseFloat(row.deposit_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reports & Analytical Disclosures
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance audits, maturity projections, and deposit portfolio summaries (Synthetic Demonstration Dataset)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={exportCSV}
            disabled={data.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Report Controls (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-4 items-center justify-between text-xs no-print">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setReportType('fdr')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                reportType === 'fdr' ? 'bg-white shadow-2xs text-royal-700' : 'text-slate-600'
              }`}
            >
              FDR & Security Deposits
            </button>
            <button
              onClick={() => setReportType('maturities')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                reportType === 'maturities' ? 'bg-white shadow-2xs text-royal-700' : 'text-slate-600'
              }`}
            >
              Upcoming Maturities Schedule
            </button>
          </div>

          {reportType === 'fdr' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Verification Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Under Review">Under Review</option>
              <option value="Submitted">Submitted</option>
              <option value="Rejected">Rejected</option>
            </select>
          ) : (
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="30">Maturity Window: 30 Days</option>
              <option value="60">Maturity Window: 60 Days</option>
              <option value="90">Maturity Window: 90 Days</option>
              <option value="365">Maturity Window: 1 Year</option>
            </select>
          )}
        </div>

        <div className="text-right">
          <span className="text-slate-500">Cumulative Valuation: </span>
          <span className="font-bold text-slate-900 text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
          <span className="text-slate-400 text-[11px] block">({data.length} Total Line Items)</span>
        </div>
      </div>

      {/* Printable Report Output Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-royal-700">Official Disclosure Report</div>
            <h2 className="text-base font-bold text-slate-900">
              {reportType === 'fdr' ? 'Institutional Security Deposit & FDR Portfolio' : 'Upcoming Deposit Maturity & Renewal Schedule'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Generated: {new Date().toLocaleDateString()} &bull; FDRvault Verified Record Export
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-mono font-bold text-slate-800">FDRvault Portal</span>
            <p className="text-[10px] text-slate-400">AICTE Security Deposit Management</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Computing report dataset...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No records found matching report criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">FDR / Ref Number</th>
                  <th className="py-2.5 px-3">Institution Name</th>
                  <th className="py-2.5 px-3">Bank Details</th>
                  <th className="py-2.5 px-3 text-right">Principal Amount</th>
                  <th className="py-2.5 px-3">Maturity Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                      {row.fdr_number || `REC-${row.id}`}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {row.institution_name}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.bank_name || 'Bank'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{Number(row.deposit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {row.maturity_date}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <td colSpan="4" className="py-3 px-3 text-right">
                    Total Portfolio Valuation:
                  </td>
                  <td className="py-3 px-3 text-right text-royal-700 font-mono">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td colSpan="2" className="py-3 px-3 text-slate-500">
                    {data.length} Records
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Confidentiality: For authorized institutional monitoring only.</span>
          <span>End of Report</span>
        </div>
      </div>
    </div>
  );
}
