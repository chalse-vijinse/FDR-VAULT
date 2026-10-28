import React from 'react';
import {
  FileUp,
  Cpu,
  ShieldCheck,
  Award,
  CalendarClock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from 'lucide-react';

/**
 * Compact, Professional FDR Lifecycle Workflow Tracker
 * Stages:
 * 1. College Submission
 * 2. System Validation
 * 3. Officer Verification
 * 4. Admin Approval
 * 5. Maturity Monitoring
 * 6. Release Request
 * 7. Release Completed
 */
export default function WorkflowTracker({
  status = 'Draft',
  clarificationRemark = '',
  rejectionReason = '',
  className = ''
}) {
  const normStatus = String(status || '').trim().toLowerCase();

  // Determine which step (1-7) is currently active, completed, or failed
  const getLifecycleState = (s) => {
    switch (s) {
      case 'draft':
        return { currentStep: 1, stepStatus: 'active' };
      case 'submitted':
      case 'resubmitted':
        return { currentStep: 2, stepStatus: 'active' };
      case 'ocr completed':
        return { currentStep: 2, stepStatus: 'completed' };
      case 'under review':
      case 'under verification':
        return { currentStep: 3, stepStatus: 'active' };
      case 'clarification required':
      case 'additional documents required':
      case 'clarification requested':
        return { currentStep: 3, stepStatus: 'clarification' };
      case 'verified':
      case 'pending admin approval':
      case 'recommended':
        return { currentStep: 4, stepStatus: 'active' };
      case 'approved':
      case 'active':
      case 'independently verified':
      case 'statutory aicte approved':
        return { currentStep: 5, stepStatus: 'active' };
      case 'release requested':
      case 'release under review':
      case 'release review':
        return { currentStep: 6, stepStatus: 'active' };
      case 'release approved':
      case 'released':
      case 'completed':
      case 'lien discharged / released':
        return { currentStep: 7, stepStatus: 'completed' };
      case 'rejected':
      case 'failed':
        return { currentStep: 3, stepStatus: 'rejected' };
      default:
        return { currentStep: 1, stepStatus: 'active' };
    }
  };

  const { currentStep, stepStatus } = getLifecycleState(normStatus);

  const steps = [
    { id: 1, name: 'College Submission', short: 'Submission', icon: FileUp },
    { id: 2, name: 'System Validation', short: 'OCR Validation', icon: Cpu },
    { id: 3, name: 'Officer Verification', short: 'Verification', icon: ShieldCheck },
    { id: 4, name: 'Admin Approval', short: 'Approval', icon: Award },
    { id: 5, name: 'Maturity Monitoring', short: 'Monitoring', icon: CalendarClock },
    { id: 6, name: 'Release Request', short: 'Release Req.', icon: ArrowUpRight },
    { id: 7, name: 'Release Completed', short: 'Released', icon: CheckCircle2 },
  ];

  const isClarification = stepStatus === 'clarification';
  const isRejected = stepStatus === 'rejected';

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-card ${className}`}>
      {/* Header with Title and Current Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            FDR Lifecycle Progression
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Current Phase:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isRejected
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isClarification
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : currentStep === 7
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-royal-50 text-royal-700 border-royal-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Stepper Tracker */}
      <div className="relative overflow-x-auto pb-2 pt-1">
        <div className="flex items-center justify-between min-w-[620px] relative">
          {/* Connector Line behind steps */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-teal-500 to-royal-600 -z-0 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
            }}
          />

          {steps.map((st) => {
            const isCompleted = st.id < currentStep || (st.id === 7 && currentStep === 7);
            const isCurrent = st.id === currentStep && !isCompleted;
            const Icon = st.icon;

            // Icon circle appearance
            let circleClass = 'bg-white text-slate-400 border-2 border-slate-300';
            if (isCompleted) {
              circleClass = 'bg-teal-500 text-white border-2 border-teal-500 shadow-sm';
            } else if (isCurrent) {
              if (isRejected) {
                circleClass = 'bg-rose-600 text-white border-2 border-rose-600 shadow-glow-rose ring-4 ring-rose-100';
              } else if (isClarification) {
                circleClass = 'bg-amber-500 text-white border-2 border-amber-500 ring-4 ring-amber-100';
              } else {
                circleClass = 'bg-[#12345A] text-white border-2 border-[#2563EB] shadow-glow-royal ring-4 ring-blue-50';
              }
            }

            return (
              <div key={st.id} className="relative z-10 flex flex-col items-center group cursor-default">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${circleClass}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent && isRejected ? (
                    <XCircle className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent && isClarification ? (
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  )}
                </div>

                {/* Step Name */}
                <div className="mt-2 text-center max-w-[84px]">
                  <span
                    className={`block text-[11px] leading-tight font-semibold truncate ${
                      isCurrent
                        ? isRejected
                          ? 'text-rose-700 font-bold'
                          : isClarification
                          ? 'text-amber-700 font-bold'
                          : 'text-royal-700 font-bold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                    title={st.name}
                  >
                    {st.short}
                  </span>
                  <span className="text-[9px] text-slate-400 hidden sm:block">
                    Step {st.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clarification or Rejection Notice if applicable */}
      {isClarification && (
        <div className="mt-3.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-950">Clarification Requested by AICTE Officer:</span>
            <p className="mt-0.5 text-[11px] text-amber-900 leading-relaxed font-medium">
              {clarificationRemark || 'The verification officer requested corrections or additional supporting documents. Please update the deposit details or upload the requested scans to proceed.'}
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-rose-950">FDR Verification / Approval Rejected:</span>
            <p className="mt-0.5 text-[11px] text-rose-900 leading-relaxed font-medium">
              {rejectionReason || 'The deposit record was rejected during verification. Check audit log and comments for regulatory details.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
