import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'default', 'success', 'warning', 'danger', 'info'
  trend
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          indicator: 'border-l-4 border-l-emerald-500'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          indicator: 'border-l-4 border-l-amber-500'
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
          indicator: 'border-l-4 border-l-rose-500'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          indicator: 'border-l-4 border-l-blue-500'
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
          indicator: 'border-l-4 border-l-navy-800'
        };
    }
  };

  const { iconBg, indicator } = getVariantStyles();

  return (
    <div className={`bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 border border-slate-200/80 ${indicator}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 pt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">{trend}</span>
        </div>
      )}
    </div>
  );
}
