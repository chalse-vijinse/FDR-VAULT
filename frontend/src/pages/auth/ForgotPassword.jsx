import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import FdrVaultLogo from '../../components/common/FdrVaultLogo';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d223a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#12345A] via-[#0d233c] to-[#071322]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <FdrVaultLogo size="lg" showTagline={false} theme="dark" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Password Recovery</h2>
        <p className="mt-1 text-xs text-slate-300">FDRvault Institutional Portal Recovery</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recovery Instructions Dispatched</h3>
              <p className="text-xs text-slate-600">
                If an authorized institutional account exists for <strong>{email}</strong>, verification links have been dispatched. Contact your designated nodal officer if you need urgent re-authorization.
              </p>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal-600 hover:text-royal-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your registered official email address. System administrators will dispatch a secure reset token.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Official Email</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@securefdr.gov.in"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-royal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-royal-600 hover:bg-royal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send Recovery Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-600 hover:text-slate-800 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
