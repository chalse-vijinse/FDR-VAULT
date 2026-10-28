import React from 'react';
import { FolderSearch } from 'lucide-react';

export default function EmptyState({
  title = 'No Records Found',
  description = 'No matching information matches the current search or filter criteria.',
  icon: Icon = FolderSearch,
  actionText,
  onAction
}) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <div className="mt-4">
          <button
            onClick={onAction}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-royal-600 hover:bg-royal-700 shadow-sm transition-colors"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}
