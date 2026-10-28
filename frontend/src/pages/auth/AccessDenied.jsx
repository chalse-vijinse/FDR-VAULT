import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied() {
  const { role } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
      <p className="mt-2 text-xs text-slate-600 max-w-md">
        Your institutional user role <strong>({role?.replace('_', ' ')})</strong> does not have authorization to view or manipulate this resource. AICTE institutional records are strictly segregated.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm"
        >
          <Home className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
