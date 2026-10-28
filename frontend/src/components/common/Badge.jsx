import React from 'react';

export default function Badge({ status, label, size = 'md' }) {
  const text = label || status || 'Unknown';

  const getStyle = (s) => {
    switch (String(s).toLowerCase()) {
      case 'verified':
      case 'approved':
      case 'release approved':
      case 'released':
      case 'active':
      case 'completed':
      case 'independently verified':
      case 'statutory aicte approved':
      case 'lien discharged / released':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';

      case 'pending admin approval':
      case 'recommended':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10';

      case 'under verification':
      case 'under review':
      case 'release under review':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';

      case 'resubmitted':
        return 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/10';

      case 'clarification required':
      case 'additional documents required':
      case 'clarification requested':
      case 'manual verification required':
        return 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/10 font-semibold';

      case 'submitted':
      case 'release requested':
      case 'pending':
      case 'clearance pending':
      case 'ocr completed':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';

      case 'rejected':
      case 'suspended':
      case 'failed':
      case 'overdue':
      case 'discrepancy detected':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';

      case 'draft':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 ring-inset ${getStyle(status)} ${sizeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {text}
    </span>
  );
}
