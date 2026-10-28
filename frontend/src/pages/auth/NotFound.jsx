import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4 border border-slate-200">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Page Not Found (404)</h1>
      <p className="mt-2 text-xs text-slate-600 max-w-md">
        The requested portal module, deposit record, or document could not be located on the server.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
