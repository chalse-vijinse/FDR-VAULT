import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#12345A]">FDRvault</span>
          <span className="text-slate-400">&bull;</span>
          <span className="font-medium text-slate-600">Secure Deposits. Smarter Management.</span>
        </div>
        <div className="text-[11px] text-slate-400">
          AICTE Security Deposit & Fixed Deposit Management System
        </div>
      </div>
    </footer>
  );
}
