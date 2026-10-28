import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FdrVaultLogo from '../../components/common/FdrVaultLogo';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  BarChart3,
  Landmark
} from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const lifecycleStages = [
    { step: 1, title: 'Drafting', desc: 'College enters deposit details from bank FDR' },
    { step: 2, title: 'Document Upload', desc: 'High-res FDR scan & lien certificate uploaded' },
    { step: 3, title: 'AI/OCR Analysis', desc: 'Automatic extraction of FDR #, amount & lien clause' },
    { step: 4, title: 'Officer Audit', desc: 'AICTE Regional Officer verifies joint lien status' },
    { step: 5, title: 'Active Custody', desc: 'Deposit locked in statutory custody under AICTE lien' },
    { step: 6, title: 'Maturity Alert', desc: 'Proactive alerts at 30, 15, and 7 days prior to maturity' },
    { step: 7, title: 'NOC & Release', desc: 'Clearance verification & digital NOC generation' }
  ];

  const portals = [
    {
      title: 'College / Institute Portal',
      subtitle: 'For Technical Institutions & Trusts',
      desc: 'Upload fixed deposit certificates, track AICTE review progress, correct discrepancies flagged by officers, and request statutory deposit releases.',
      icon: Building2,
      badge: 'Institute Signatory',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      actionText: 'Enter College Portal',
      actionRole: 'INSTITUTION_ADMIN'
    },
    {
      title: 'Verification Officer Portal',
      subtitle: 'For AICTE Regional Verification Cells',
      desc: 'Inspect submitted FDR certificates, compare OCR findings side-by-side, verify bank lien endorsements, and recommend approvals or corrections.',
      icon: ShieldCheck,
      badge: 'Regional Officer',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      actionText: 'Enter Officer Portal',
      actionRole: 'VERIFICATION_OFFICER'
    },
    {
      title: 'AICTE Admin & HQ Portal',
      subtitle: 'For AICTE Member Secretary & Leadership',
      desc: 'Oversee pan-India institution compliance, approve statutory release requests, issue digital NOC certificates, and inspect immutable audit logs.',
      icon: Landmark,
      badge: 'AICTE Headquarters',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      actionText: 'Enter Admin Portal',
      actionRole: 'SUPER_ADMIN'
    }
  ];

  const features = [
    {
      icon: FileCheck2,
      title: 'Automated OCR Verification',
      desc: 'Instant text extraction highlights discrepancies between declared application amounts and certified bank deposit receipts.'
    },
    {
      icon: Lock,
      title: 'Joint Lien Custody Tracking',
      desc: 'Validates that fixed deposits are strictly drawn in the joint name of the Technical Institution and AICTE as mandated by APH rules.'
    },
    {
      icon: AlertTriangle,
      title: 'Proactive Maturity Safeguards',
      desc: 'Automated alerting system warns officers and institutions weeks before deposits mature to prevent unauthorized premature liquidation.'
    },
    {
      icon: History,
      title: 'Immutable Audit Ledger',
      desc: 'Every certificate review, status transition, document correction, and officer sign-off is indelibly timestamped and logged.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#2563EB]/20 selection:text-[#12345A]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <FdrVaultLogo size="md" showTagline={true} theme="light" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#workflow" className="hover:text-[#2563EB] transition-colors">7-Stage Workflow</a>
            <a href="#portals" className="hover:text-[#2563EB] transition-colors">Role Portals</a>
            <a href="#features" className="hover:text-[#2563EB] transition-colors">Key Features</a>
            <a href="#compliance" className="hover:text-[#2563EB] transition-colors">AICTE Compliance</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#12345A] to-[#2563EB] text-white hover:shadow-md transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-700 hover:text-[#2563EB] px-3 py-2 transition-colors"
                >
                  Register College
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#12345A] to-[#2563EB] text-white hover:shadow-md transition-all shadow-2xs"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#12345A] via-[#0d233c] to-[#071322] text-white py-20 lg:py-28">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Official AICTE Statutory Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-teal-300 mb-6">
            <BadgeCheck className="w-4 h-4 text-teal-400" />
            <span>AICTE Approval Process Handbook (APH) Statutory Custody Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Secure Deposits.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-blue-400">
              Smarter Management.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The national digital depository and verification platform for All India Council for Technical Education (AICTE). 
            Streamlining institutional security deposit lifecycle, joint bank lien validation, and automated maturity tracking.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-sm transition-all"
            >
              <span>Explore Dashboard</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-medium rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <span>Register Institution</span>
            </Link>
          </div>

          {/* Key Metrics / Trust Bar */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left sm:text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">₹4.82+ Cr</p>
              <p className="text-xs text-slate-400 mt-1">Active Deposits Managed</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Joint AICTE Lien Verification</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-sky-400">7-Stage</p>
              <p className="text-xs text-slate-400 mt-1">Transparent Lifecycle Audit</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">Zero</p>
              <p className="text-xs text-slate-400 mt-1">Physical Paper Bottlenecks</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Dedicated Role Portals Section */}
      <section id="portals" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Unified Digital Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Three Portals. One Integrated Depository.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Tailored workspaces specifically designed for College Authorities, AICTE Verification Officers, and AICTE Leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portals.map((portal) => {
              const IconComp = portal.icon;
              return (
                <div
                  key={portal.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] group-hover:bg-[#12345A] group-hover:text-white transition-colors">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${portal.badgeColor}`}>
                        {portal.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{portal.title}</h3>
                    <p className="text-xs font-medium text-[#2563EB] mt-0.5 mb-3">{portal.subtitle}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-6">
                      {portal.desc}
                    </p>
                  </div>

                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-[#12345A] bg-slate-100 hover:bg-[#12345A] hover:text-white transition-all border border-slate-200 group-hover:border-[#12345A]"
                  >
                    <span>{portal.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7-Stage Workflow Visualization Section */}
      <section id="workflow" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              End-to-End Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              The 7-Stage FDR Lifecycle Tracker
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              From original submission through AI OCR check, lien registration, maturity monitoring, and statutory NOC release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {lifecycleStages.map((stage) => (
              <div
                key={stage.step}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between relative hover:border-[#2563EB] transition-colors"
              >
                <div>
                  <div className="w-7 h-7 rounded-full bg-[#12345A] text-white flex items-center justify-center font-bold text-xs mb-3">
                    {stage.step}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{stage.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Stage 0{stage.step}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Architectural & Compliance Features */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Security & FinTech Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Built for Institutional Trust & Regulatory Rigor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Eliminating compliance gaps with automated verification algorithms and tamper-evident audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="p-3 rounded-xl bg-teal-50 text-teal-700 w-fit mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section id="compliance" className="py-16 bg-gradient-to-r from-[#12345A] to-[#2563EB] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to Access the FDRvault Portal?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Sign in with your registered institutional or officer credentials to manage FDR records, review verifications, or track maturity status.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-white text-[#12345A] hover:bg-slate-100 shadow-md transition-all"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all"
            >
              <span>Submit College Registration</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#071322] text-slate-400 py-12 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <FdrVaultLogo size="md" showTagline={true} theme="dark" />
              <p className="mt-2 text-[11px] text-slate-400 max-w-md">
                AICTE Statutory Fixed Deposit & Security Deposit Lifecycle Management Portal.
                Designed for compliance with AICTE Approval Process Handbook (APH).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              <Link to="/forgot-password" className="hover:text-white transition-colors">Password Recovery</Link>
              <a href="#compliance" className="hover:text-white transition-colors">Compliance Guidelines</a>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>&copy; {new Date().getFullYear()} FDRvault &bull; All India Council for Technical Education (AICTE). All rights reserved.</p>
            <p className="text-teal-400 font-medium">Secure Deposits. Smarter Management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
