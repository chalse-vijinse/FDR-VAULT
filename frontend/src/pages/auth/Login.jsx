import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import FdrVaultLogo from '../../components/common/FdrVaultLogo';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export default function Login() {
  const { login, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Role selection state: 'INSTITUTION_ADMIN' | 'VERIFICATION_OFFICER' | 'SUPER_ADMIN'
  const [selectedRole, setSelectedRole] = useState('INSTITUTION_ADMIN');
  const [email, setEmail] = useState('admin@iitdelhi.ac.in');
  const [password, setPassword] = useState('Inst@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('sessionExpired');

  const roleConfigs = {
    INSTITUTION_ADMIN: {
      title: 'College Login',
      badge: 'College / Institute',
      icon: Building2,
      desc: 'Submit FDR records, track verification progress, correct documents, and initiate release requests',
      defaultEmail: 'admin@iitdelhi.ac.in',
      defaultPass: 'Inst@123',
      placeholder: 'principal@college.edu.in',
      personaName: 'Delhi Institute (Dr. Ramesh Narayan)',
      activeColor: 'text-[#2563EB]',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    VERIFICATION_OFFICER: {
      title: 'AICTE Officer Login',
      badge: 'Verification Officer',
      icon: ShieldCheck,
      desc: 'Inspect submitted FDR certificates, review automated OCR findings, request clarifications, and recommend decisions',
      defaultEmail: 'officer.sharma@securefdr.gov.in',
      defaultPass: 'Officer@123',
      placeholder: 'officer@aicte.gov.in',
      personaName: 'Dr. Rajesh Sharma (North Zone Officer)',
      activeColor: 'text-[#2563EB]',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    SUPER_ADMIN: {
      title: 'AICTE Admin Login',
      badge: 'AICTE Headquarters',
      icon: ShieldAlert,
      desc: 'Final administrative approvals, institutional compliance oversight, statutory NOC generation, and audit logging',
      defaultEmail: 'admin@securefdr.gov.in',
      defaultPass: 'Admin@123',
      placeholder: 'admin@aicte.gov.in',
      personaName: 'Sunil Verma, IAS (Member Secretary)',
      activeColor: 'text-[#2563EB]',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  };

  const handleRoleTabChange = (roleKey) => {
    setSelectedRole(roleKey);
    setEmail(roleConfigs[roleKey].defaultEmail);
    setPassword(roleConfigs[roleKey].defaultPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid official email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      const res = await switchDemoUser(demoEmail);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to switch persona.');
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = roleConfigs[selectedRole];

  return (
    <div className="min-h-screen bg-[#0d223a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#12345A] via-[#0d233c] to-[#071322]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4">
        <div className="inline-flex items-center justify-center mb-3">
          <FdrVaultLogo size="xl" showTagline={false} theme="dark" />
        </div>
        <p className="text-sm font-medium text-teal-400 tracking-wide">
          Secure Deposits. Smarter Management.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          AICTE Institutional Fixed Deposit & Security Deposit Management Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-100">
          
          {/* 3 Distinguishable Login Options */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select Your Portal Role
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                {currentConfig.badge}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
              {Object.entries(roleConfigs).map(([key, config]) => {
                const IconComponent = config.icon;
                const isSelected = selectedRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleTabChange(key)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-all relative ${
                      isSelected
                        ? 'bg-white text-[#12345A] shadow-md border border-slate-200/90 ring-2 ring-[#2563EB]/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 mb-1.5 transition-colors ${
                        isSelected ? 'text-[#2563EB]' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-[11px] leading-tight text-center font-semibold">{config.title}</span>
                    {isSelected && (
                      <span className="absolute bottom-1 w-5 h-0.5 bg-[#2563EB] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Role Scope Card */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
              <div className="p-1 rounded bg-teal-500/10 text-teal-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-900 mr-1">{currentConfig.title}:</span>
                <span className="text-slate-600">{currentConfig.desc}</span>
              </div>
            </div>
          </div>

          {sessionExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Official Registered Email ID
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentConfig.placeholder}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Account Password</label>
                <Link to="/forgot-password" className="text-[11px] font-medium text-[#2563EB] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#12345A] to-[#2563EB] hover:from-[#0f2a48] hover:to-[#1d4ed8] shadow-md transition-all disabled:opacity-50 mt-3"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {currentConfig.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Persona Login for Evaluation */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Evaluation Quick Access
              </span>
              <span className="text-[10px] text-teal-600 font-medium">Demo Verified</span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin(currentConfig.defaultEmail)}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-[#12345A] text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate">
                <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="truncate">1-Click Sign-in: {currentConfig.personaName}</span>
              </div>
              <span className="text-[11px] text-[#2563EB] font-bold shrink-0">&rarr;</span>
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            New College or Technical Institution?{' '}
            <Link to="/register" className="font-semibold text-[#2563EB] hover:underline">
              Submit registration request
            </Link>
          </div>
        </div>

        {/* Footer Tagline and Security Assurance */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">
            FDRvault &bull; Secure Deposits. Smarter Management.
          </p>
          <p className="text-[11px] text-slate-500">
            AICTE Security Deposit Workflow Platform &bull; 256-bit Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
